"""
tile handler: cache validation around core's tile rendering.

A cheap read of the collection's last change time builds the ETag, so a caller
holding the current tile gets a 304 and no tile is built at all. Only on a cache
miss does core render the MVT.
"""

from __future__ import annotations

import hashlib
from typing import Optional

from pydantic import BaseModel, ConfigDict

from core.auth.principal import Principal
from core.authz.service import AuthzService
from core.geo.layers import get_layer
from core.geo.service import GeospatialService
from features.geo.permissions import ensure_permission


class TileResult(BaseModel):
    """Outcome of a tile request.

    etag identifies this tile and the data version behind it.
    not_modified is True when the caller already holds this etag.
    tile is the MVT bytes, or None for an empty tile.
    """

    model_config = ConfigDict(frozen=True)

    etag: str
    not_modified: bool
    tile: Optional[bytes]


def _make_etag(collection_id, z, x, y, season, data_version) -> str:
    raw = f"{collection_id}:{z}:{x}:{y}:{season}:{data_version}"

    return '"' + hashlib.sha1(raw.encode()).hexdigest() + '"'


async def render_tile(
    collection_id: str,
    z: int,
    x: int,
    y: int,
    season: Optional[str],
    geo: GeospatialService,
    authz: AuthzService,
    principal: Principal,
    if_none_match: Optional[str] = None,
) -> TileResult:
    layer = get_layer(collection_id)  # 404 on unknown collection
    await ensure_permission(authz, principal.user_id, layer.view)

    # Season-less collections ignore any season passed to them, so the ETag must
    # ignore it too or the same tile would carry two different validators.
    effective_season = season if layer.seasonal else None
    etag = _make_etag(
        collection_id, z, x, y, effective_season, geo.data_version(layer.name)
    )

    if if_none_match is not None and if_none_match == etag:
        return TileResult(etag=etag, not_modified=True, tile=None)

    tile = geo.tile(layer=layer.name, z=z, x=x, y=y, season=effective_season)

    return TileResult(etag=etag, not_modified=False, tile=tile)
