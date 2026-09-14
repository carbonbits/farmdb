"""
GeospatialService — the one way to read and write v1.geospatial.

Geometry is not a domain of its own: almost every record a farm keeps sits
somewhere, so the store ships with the service and any feature can call it
rather than reaching into another feature package or growing a geometry column
of its own. A domain row keeps its own identity and points at a geospatial row:

    geo = GeospatialService(conn=conn)
    shape = geo.create(layer="fields", geometry=boundary, created_by=user_id)
    conn.execute(
        "INSERT INTO v1.fields (id, name, geospatial_id) VALUES (?, ?, ?)",
        [field_id, name, shape.id],
    )

No foreign key is declared, per project convention, so deleting a domain row
does not cascade — whichever feature owns the link deletes its geometry too.

The service does not know who is asking. Permission checks belong to the caller,
which is what keeps it usable from a CLI command or a backfill; the layer's
permission keys are on the Layer record for the edge to read.

The work itself sits in three handlers the service holds — geometry validation,
tile rendering and the layer registry. The service is the seam: it decides the
order (look the layer up, validate against its geometry class, then write) and
owns the connection they share, so a caller reaches them as `geo.geometry`,
`geo.tiles` and `geo.layers` rather than importing a module and passing a cursor
in. The two that need the database are built on first use, so constructing the
service still opens nothing.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Optional

import duckdb
from ulid import ULID

from core.config.service import ConfigService
from core.geo.errors import FarmNotMapped, FeatureNotFound, OutsideFarm
from core.geo.geometry import GeometryHandler
from core.geo.layers import FARM_LAYER, Layer, LayerHandler
from core.geo.models import COLUMNS, Bbox, GeoRecord
from core.geo.tiles import TileHandler
from core.service import Service
from core.storage.database import db


class GeospatialService(Service):
    def __init__(self, conn: Optional[duckdb.DuckDBPyConnection] = None) -> None:
        super().__init__()
        self._conn = conn
        self._geometry: Optional[GeometryHandler] = None
        self._tiles: Optional[TileHandler] = None
        self._layers: Optional[LayerHandler] = None

    @property
    def service_signature(self) -> str:
        return "geo_svc"

    @property
    def conn(self) -> duckdb.DuckDBPyConnection:
        """The connection this service works on.

        A request handler passes its own request-scoped cursor and a test passes
        a fixture connection; anything else gets a cursor of its own on first
        use, so an ad-hoc caller does not have to plumb one through.
        """
        if self._conn is None:
            self._conn = db()

        return self._conn

    @property
    def geometry(self) -> GeometryHandler:
        """Geometry validation and the CRS policy, on this connection."""
        if self._geometry is None:
            self._geometry = GeometryHandler(self.conn)

        return self._geometry

    @property
    def tiles(self) -> TileHandler:
        """Tile rendering, on this connection."""
        if self._tiles is None:
            self._tiles = TileHandler(self.conn)

        return self._tiles

    @property
    def layers(self) -> LayerHandler:
        """The layer registry, on this connection.

        Deferred like the other two now that the registry is a table: built on
        the service's own cursor, so a test that hands in a fixture connection
        reads the layers it seeded rather than opening a second one.
        """
        if self._layers is None:
            self._layers = LayerHandler(self.conn)

        return self._layers

    def create(
        self,
        *,
        layer: str,
        geometry: dict[str, Any],
        properties: Optional[dict[str, Any]] = None,
        season: Optional[str] = None,
        created_by: Optional[str] = None,
    ) -> GeoRecord:
        """Store one shape in a layer.

        Raises UnknownLayer or InvalidGeometry before anything is written.
        """
        spec = self.layers.get(layer)
        geometry_json = self.geometry.validate(geometry, spec.geometry_type)
        self.ensure_contained(spec, geometry_json)

        feature_id = str(ULID())
        # Season-less layers never carry a season, whatever the caller passed.
        stored_season = season if spec.seasonal else None

        self.conn.execute(
            """
            INSERT INTO v1.geospatial
                (id, farm_id, feature_type, geometry, properties, srid, layer,
                 season, created_by)
            VALUES (?, ?, ?, ST_GeomFromGeoJSON(?), ?, ?, ?, ?, ?)
            """,
            [
                feature_id,
                self._farm_id(),
                layer,  # feature_type mirrors layer (legacy NOT NULL column)
                geometry_json,
                _as_json(properties),
                self.geometry.SRID,
                layer,
                stored_season,
                created_by,
            ],
        )

        if layer == FARM_LAYER:
            # This shape is the farm from now on. The pointer, not the layer, is
            # what the platform reads as the outline — so an older outline left
            # in the layer stops counting the moment this row lands, and a PUT
            # that reshapes this same feature keeps the pointer valid because
            # the id does not change.
            ConfigService().set(
                self.FARM_GEOMETRY_KEY, feature_id, created_by=created_by
            )

        return self._require(feature_id)

    def get(self, feature_id: str) -> GeoRecord:
        """One shape by id. Raises FeatureNotFound."""
        return self._require(feature_id)

    def list(self, *, layer: str, season: Optional[str] = None) -> list[GeoRecord]:
        """Every shape in a layer, oldest first."""
        spec = self.layers.get(layer)

        # A season filter only applies to seasonal layers; season-less layers
        # return everything regardless of the season passed.
        if spec.seasonal and season is not None:
            rows = self.conn.execute(
                f"SELECT {COLUMNS} FROM v1.geospatial "
                "WHERE layer = ? AND season = ? ORDER BY created_at",
                [layer, season],
            ).fetchall()
        else:
            rows = self.conn.execute(
                f"SELECT {COLUMNS} FROM v1.geospatial WHERE layer = ? "
                "ORDER BY created_at",
                [layer],
            ).fetchall()

        return [GeoRecord.from_row(row) for row in rows]

    def replace_geometry(
        self,
        feature_id: str,
        *,
        geometry: dict[str, Any],
        properties: Optional[dict[str, Any]] = None,
    ) -> GeoRecord:
        """Reshape a feature, keeping its id and its layer.

        Anything referencing the feature stays attached. properties left as None
        keeps what is stored, so a caller that only wants to move a shape does
        not have to read its properties back first; the map API passes the
        properties it was given, because a PUT replaces.
        """
        spec = self.layers.get(self.layer_of(feature_id))
        geometry_json = self.geometry.validate(geometry, spec.geometry_type)
        self.ensure_contained(spec, geometry_json)

        if properties is None:
            self.conn.execute(
                """
                UPDATE v1.geospatial
                SET geometry = ST_GeomFromGeoJSON(?), updated_at = now()
                WHERE id = ?
                """,
                [geometry_json, feature_id],
            )
        else:
            self.conn.execute(
                """
                UPDATE v1.geospatial
                SET geometry = ST_GeomFromGeoJSON(?),
                    properties = ?,
                    updated_at = now()
                WHERE id = ?
                """,
                [geometry_json, _as_json(properties), feature_id],
            )

        return self._require(feature_id)

    def delete(self, feature_id: str) -> None:
        """Remove a feature. Raises FeatureNotFound if there is nothing to remove."""
        self.layer_of(feature_id)
        self.conn.execute("DELETE FROM v1.geospatial WHERE id = ?", [feature_id])

    def layer_of(self, feature_id: str) -> str:
        """The layer a feature belongs to, without reading its geometry.

        The edge needs this before it can decide which permission guards a
        request, so it is worth the cheap lookup on its own.
        """
        row = self.conn.execute(
            "SELECT layer FROM v1.geospatial WHERE id = ?",
            [feature_id],
        ).fetchone()

        if row is None:
            raise FeatureNotFound(feature_id)

        return row[0]

    def extent(self, layer: str) -> Optional[Bbox]:
        """The bounding box around everything in a layer, or None if it is empty.

        Computed from the per-shape extents rather than ST_Extent_Agg so the
        result is plain floats in storage CRS order, which is what both the OGC
        collections document and the WMS capabilities document want.
        """
        self.layers.get(layer)

        row = self.conn.execute(
            """
            SELECT min(ST_XMin(geometry)), min(ST_YMin(geometry)),
                   max(ST_XMax(geometry)), max(ST_YMax(geometry))
            FROM v1.geospatial
            WHERE layer = ?
            """,
            [layer],
        ).fetchone()

        if row is None or row[0] is None:
            return None

        return (float(row[0]), float(row[1]), float(row[2]), float(row[3]))

    def data_version(self, layer: str) -> Optional[datetime]:
        """When a layer last changed, for cache validators at the edge."""
        return self.tiles.data_version(layer)

    def tile(
        self, *, layer: str, z: int, x: int, y: int, season: Optional[str] = None
    ) -> Optional[bytes]:
        """One vector tile of a layer, or None when it holds nothing here."""
        return self.tiles.render(
            layer=self.layers.get(layer), z=z, x=x, y=y, season=season
        )

    # How much of a shape must fall inside the farm outline. Not all of it: an
    # outline traced by hand, or walked with a phone's GPS, is a few metres out
    # in places, and a field following the same fence will cross it by a sliver.
    # Two per cent of a field's area is that slop; more than that is a field in
    # the wrong place, and the caller is told rather than quietly clipped.
    CONTAINMENT = 0.98

    # The configuration key holding the id of this farm's outline. One value,
    # read by everything that needs to know where the farm is. The farm layer
    # may hold older outlines; this is the one that counts.
    FARM_GEOMETRY_KEY = "farmGeometryId"

    def farm_outline(self) -> Optional[GeoRecord]:
        """This farm's outline, or None while the farm is unmapped."""
        feature_id = ConfigService().get(self.FARM_GEOMETRY_KEY)

        if not feature_id:
            return None

        try:
            return self.get(feature_id)
        except FeatureNotFound:
            # The pointer outlived the shape it named. Unmapped is the honest
            # answer: it tells a caller drawing a field what to do about it,
            # which "feature 01J… not found" would not.
            self.logger.warning(
                "farmGeometryId points at a shape that is gone", id=feature_id
            )

            return None

    def ensure_contained(self, spec: Layer, geometry_json: str) -> None:
        """Refuse a shape that does not sit inside the layer it belongs to.

        Layers with no contained_in are unfenced and return immediately. The
        rest are measured against the farm outline: at least CONTAINMENT of the
        shape's area has to fall inside it.

        The ratio is computed on the planar geometry rather than the ellipsoid.
        A ratio of two areas at the same latitude divides the distortion out, so
        the extra cost of a spheroid measure buys nothing here — unlike the area
        the API reports, which is measured properly.
        """
        if spec.contained_in is None:
            return

        outline = self.farm_outline()

        if outline is None or outline.layer != spec.contained_in:
            raise FarmNotMapped()

        inside = self.conn.execute(
            """
            SELECT ST_Area(ST_Intersection(ST_GeomFromGeoJSON(?), g.geometry))
                   / NULLIF(ST_Area(ST_GeomFromGeoJSON(?)), 0)
            FROM v1.geospatial g
            WHERE g.id = ?
            """,
            [geometry_json, geometry_json, outline.id],
        ).fetchone()[0]

        # NULL means the shape has no area of its own — a degenerate polygon —
        # which cannot be inside anything.
        if inside is None or inside < self.CONTAINMENT:
            raise OutsideFarm(inside or 0.0, self.CONTAINMENT)

    def _require(self, feature_id: str) -> GeoRecord:
        row = self.conn.execute(
            f"SELECT {COLUMNS} FROM v1.geospatial WHERE id = ?",
            [feature_id],
        ).fetchone()

        if row is None:
            raise FeatureNotFound(feature_id)

        return GeoRecord.from_row(row)

    def _farm_id(self) -> Optional[str]:
        """The farm every shape is stamped with, bootstrapped on first boot."""
        return ConfigService().get("farmId")


def _as_json(properties: Optional[dict[str, Any]]) -> str:
    return json.dumps(properties or {})
