"""
Vector tile (MVT) rendering, straight from DuckDB.

One SQL query builds a tile: transform each shape to web mercator, simplify it
for the zoom when far out, clip it to the tile envelope, and encode it with
ST_AsMVT. The query also returns a feature count so the caller can tell an empty
tile from a tile with content and skip serving an all but empty protobuf.

Nothing here knows about HTTP. Caching is the caller's business, which is why
data_version() is separate: the edge reads the version first, builds an ETag,
and only calls render() when the caller does not already hold that tile.

The handler holds the connection it renders on. GeospatialService builds it and
exposes it as `geo.tiles`, alongside the `tile()` and `data_version()` methods
the edge actually calls.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from core.geo.handler import GeoHandler
from core.geo.layers import Layer

# Metres per pixel in web mercator at zoom 0 (256 px tiles).
_METRES_PER_PIXEL_Z0 = 156543.03392804097
# At or above this zoom we serve full detail and do not simplify.
_FULL_DETAIL_ZOOM = 14
# Web mercator: what a slippy map speaks, and the only CRS we reproject into.
_MERCATOR = "EPSG:3857"


def _simplify_tolerance(z: int) -> float:
    """Simplify tolerance in mercator metres, about one pixel at this zoom.

    Zero once zoomed in past _FULL_DETAIL_ZOOM, so close tiles keep every vertex
    while far out tiles shed detail they could not show anyway.
    """
    if z >= _FULL_DETAIL_ZOOM:
        return 0.0

    return _METRES_PER_PIXEL_Z0 / (2**z)


class TileHandler(GeoHandler):
    """Builds vector tiles, and reports when a layer last changed."""

    @property
    def handler_signature(self) -> str:
        return "geo_tiles"

    def data_version(self, layer_name: str) -> Optional[datetime]:
        """The latest change in a layer, or None if it holds nothing.

        Deliberately layer-wide rather than per season or per tile: it is one
        cheap indexed read, and a version that moves too often only costs a
        re-render, while one that moves too rarely would serve a stale tile.
        """
        return self._conn.execute(
            "SELECT max(updated_at) FROM v1.geospatial WHERE layer = $layer",
            {"layer": layer_name},
        ).fetchone()[0]

    def render(
        self,
        *,
        layer: Layer,
        z: int,
        x: int,
        y: int,
        season: Optional[str] = None,
    ) -> Optional[bytes]:
        """The MVT bytes for one tile, or None when no shape falls inside it."""
        # Season-less layers ignore any season passed to them.
        effective_season = season if layer.seasonal else None

        # The source CRS is the storage SRID off the base handler, so the one
        # place that reprojects follows the column rather than a second opinion
        # about what is in it. The target is web mercator because that is the
        # tile scheme, not a setting.
        storage = f"EPSG:{self.SRID}"
        merc_geometry = (
            f"ST_Transform(geometry, '{storage}', '{_MERCATOR}', always_xy := true)"
        )
        tolerance = _simplify_tolerance(z)

        if tolerance > 0:
            merc_geometry = f"ST_Simplify({merc_geometry}, $tolerance)"

        params: dict[str, object] = {"layer": layer.name, "z": z, "x": x, "y": y}
        season_clause = ""

        if effective_season is not None:
            season_clause = "AND season = $season"
            params["season"] = effective_season

        if tolerance > 0:
            params["tolerance"] = tolerance

        query = f"""
            SELECT ST_AsMVT(t, $layer) AS tile, COUNT(*) AS n
            FROM (
                SELECT id, properties, geom FROM (
                    SELECT id, properties,
                        ST_AsMVTGeom(
                            {merc_geometry},
                            ST_Extent(ST_TileEnvelope($z, $x, $y))
                        ) AS geom
                    FROM v1.geospatial
                    WHERE layer = $layer
                        {season_clause}
                        AND ST_Intersects(
                            geometry,
                            ST_Transform(
                                ST_TileEnvelope($z, $x, $y), '{_MERCATOR}', '{storage}', always_xy := true
                            )
                        )
                ) WHERE geom IS NOT NULL
            ) t
        """

        tile, feature_count = self._conn.execute(query, params).fetchone()

        return bytes(tile) if feature_count else None
