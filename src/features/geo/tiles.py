from __future__ import annotations

from typing import Annotated, Optional

import duckdb
from fastapi import APIRouter, Depends, Query, Request, Response, status

from core.auth.principal import Principal
from core.auth.resolver import require_principal
from core.authz.service import AuthzService, get_authz_service
from features.geo.db import geo_db
from features.geo.handlers.tile.handler import render_tile

router = APIRouter(prefix="/v1/tiles", tags=["geo"])

_MVT_MEDIA_TYPE = "application/vnd.mapbox-vector-tile"
_CACHE_CONTROL = "public, max-age=0, must-revalidate"


@router.get("/{layer}/{z}/{x}/{y}.mvt")
async def get_tile(
    layer: str,
    z: int,
    x: int,
    y: int,
    request: Request,
    conn: Annotated[duckdb.DuckDBPyConnection, Depends(geo_db)],
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
    season: Annotated[Optional[str], Query()] = None,
) -> Response:
    """Serve one vector tile (MVT) for a layer at the given z/x/y."""
    result = await render_tile(
        layer_name=layer,
        z=z,
        x=x,
        y=y,
        season=season,
        conn=conn,
        authz=authz,
        principal=principal,
        if_none_match=request.headers.get("if-none-match"),
    )

    headers = {"ETag": result.etag, "Cache-Control": _CACHE_CONTROL}
    if result.not_modified:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED, headers=headers)
    if result.tile is None:
        return Response(status_code=status.HTTP_204_NO_CONTENT, headers=headers)
    return Response(content=result.tile, media_type=_MVT_MEDIA_TYPE, headers=headers)
