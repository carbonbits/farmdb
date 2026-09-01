"""
Render a vector tile (MVT) for one map layer straight from DuckDB.

One SQL round trip builds the tile: transform each shape to web mercator,
simplify it for the zoom when far out, clip it to the tile, and encode the tile
with ST_AsMVT. The same query returns a feature count so an empty tile can be
served as a 204 instead of an all but empty protobuf.

Each tile also carries an ETag built from the layer's latest change time and
the tile coordinates, so a caller holding the current ETag gets a cheap 304 and
we skip building the tile at all.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass

import duckdb
from fastapi import HTTPException, status

from core.auth.principal import Principal
from core.authz.service import AuthzService
from features.geo.layers import LAYERS
from features.geo.permissions import ensure_permission

# Metres per pixel in web mercator at zoom 0 (256 px tiles).
_METRES_PER_PIXEL_Z0 = 156543.03392804097
# At or above this zoom we serve full detail and do not simplify.
_FULL_DETAIL_ZOOM = 14


@dataclass(frozen=True)
class TileResult:
    """Outcome of a tile request.

    etag identifies this tile and the data version behind it.
    not_modified is True when the caller already holds this etag.
    tile is the MVT bytes, or None for an empty tile.
    """

    etag: str
    not_modified: bool
    tile: bytes | None


def _simplify_tolerance(z: int) -> float:
    """Simplify tolerance in mercator metres, about one pixel at this zoom.

    Zero once zoomed in past _FULL_DETAIL_ZOOM, so close tiles keep every vertex
    while far out tiles shed detail they could not show anyway.
    """
    if z >= _FULL_DETAIL_ZOOM:
        return 0.0
    return _METRES_PER_PIXEL_Z0 / (2**z)


def _make_etag(layer_name, z, x, y, season, data_version) -> str:
    raw = f"{layer_name}:{z}:{x}:{y}:{season}:{data_version}"
    return '"' + hashlib.sha1(raw.encode()).hexdigest() + '"'


async def render_tile(
    layer_name: str,
    z: int,
    x: int,
    y: int,
    season: str | None,
    conn: duckdb.DuckDBPyConnection,
    authz: AuthzService,
    principal: Principal,
    if_none_match: str | None = None,
) -> TileResult:
    layer = LAYERS.get(layer_name)
    if layer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown layer: {layer_name}",
        )
    await ensure_permission(authz, principal.user_id, layer.view)

    # Season-less layers ignore any season passed to them.
    effective_season = season if layer.seasonal else None

    # Data version: the latest change in this layer. When it moves, the ETag
    # changes and caches revalidate.
    data_version = conn.execute(
        "SELECT max(updated_at) FROM v1.geospatial WHERE layer = $layer",
        {"layer": layer_name},
    ).fetchone()[0]
    etag = _make_etag(layer_name, z, x, y, effective_season, data_version)

    if if_none_match is not None and if_none_match == etag:
        return TileResult(etag=etag, not_modified=True, tile=None)

    merc_geometry = "ST_Transform(geometry, 'EPSG:4326', 'EPSG:3857', always_xy := true)"
    tolerance = _simplify_tolerance(z)
    if tolerance > 0:
        merc_geometry = f"ST_Simplify({merc_geometry}, $tolerance)"

    params: dict[str, object] = {"layer": layer_name, "z": z, "x": x, "y": y}
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
                            ST_TileEnvelope($z, $x, $y), 'EPSG:3857', 'EPSG:4326', always_xy := true
                        )
                    )
            ) WHERE geom IS NOT NULL
        ) t
    """

    tile, feature_count = conn.execute(query, params).fetchone()
    return TileResult(
        etag=etag,
        not_modified=False,
        tile=bytes(tile) if feature_count else None,
    )
