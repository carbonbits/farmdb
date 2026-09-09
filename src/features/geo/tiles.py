"""
The tile routes: OGC API - Tiles paths over the MVT renderer in core.

    GET /v1/maps/collections/{cid}/tiles
    GET /v1/maps/collections/{cid}/tiles/{tileMatrixSetId}/{z}/{x}/{y}.mvt

We serve one tile matrix set, WebMercatorQuad — the slippy-map scheme every web
map already speaks — so any other id is simply not there.
"""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from core.auth.principal import Principal
from core.auth.resolver import require_principal
from core.authz.service import AuthzService, get_authz_service
from core.geo.layers import get_layer
from features.geo.deps import Geo
from features.geo.handlers.tile.handler import render_tile
from features.geo.links import JSON, MVT, PREFIX, TILE_MATRIX_SET, absolute
from features.geo.models.ogc import Link, TileMatrixSetLink, TileSets
from features.geo.permissions import ensure_permission

router = APIRouter()

_CACHE_CONTROL = "public, max-age=0, must-revalidate"


@router.get("/collections/{collection_id}/tiles", response_model=TileSets)
async def list_tilesets(
    collection_id: str,
    request: Request,
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
) -> TileSets:
    """The tilesets a collection offers. Requires the collection's view permission."""
    layer = get_layer(collection_id)
    await ensure_permission(authz, principal.user_id, layer.view)

    base = f"{PREFIX}/collections/{layer.name}/tiles"
    template = f"{base}/{TILE_MATRIX_SET}/{{z}}/{{x}}/{{y}}.mvt"

    return TileSets(
        tilesets=[
            TileMatrixSetLink(
                tileMatrixSetId=TILE_MATRIX_SET,
                links=[
                    Link(
                        href=absolute(request, template),
                        rel="item",
                        type=MVT,
                        title=f"{layer.title} vector tiles",
                    )
                ],
            )
        ],
        links=[
            Link(
                href=absolute(request, base),
                rel="self",
                type=JSON,
                title="This document",
            )
        ],
    )


@router.get("/collections/{collection_id}/tiles/{tile_matrix_set_id}/{z}/{x}/{y}.mvt")
async def get_tile(
    collection_id: str,
    tile_matrix_set_id: str,
    z: int,
    x: int,
    y: int,
    request: Request,
    geo: Geo,
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
    season: Annotated[Optional[str], Query()] = None,
) -> Response:
    """Serve one vector tile (MVT) for a collection at the given z/x/y."""
    if tile_matrix_set_id != TILE_MATRIX_SET:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown tile matrix set: {tile_matrix_set_id}",
        )

    result = await render_tile(
        collection_id=collection_id,
        z=z,
        x=x,
        y=y,
        season=season,
        geo=geo,
        authz=authz,
        principal=principal,
        if_none_match=request.headers.get("if-none-match"),
    )

    headers = {"ETag": result.etag, "Cache-Control": _CACHE_CONTROL}

    if result.not_modified:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED, headers=headers)

    if result.tile is None:
        return Response(status_code=status.HTTP_204_NO_CONTENT, headers=headers)

    return Response(content=result.tile, media_type=MVT, headers=headers)
