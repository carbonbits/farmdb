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
from core.geo.errors import FeatureNotFound
from core.geo.geometry import GeometryHandler
from core.geo.layers import LayerHandler
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
        # No database of its own, so there is nothing to defer.
        self.layers = LayerHandler()

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
