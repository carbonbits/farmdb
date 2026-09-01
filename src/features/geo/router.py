from __future__ import annotations

from typing import Annotated, Optional

import duckdb
from fastapi import APIRouter, Depends, Query, status

from core.auth.principal import Principal
from core.auth.resolver import require_principal
from core.authz.service import AuthzService, get_authz_service
from features.geo.db import geo_db
from features.geo.handlers.create.handler import create_feature
from features.geo.handlers.create.input import CreateFeatureInput
from features.geo.handlers.delete.handler import delete_feature
from features.geo.handlers.get.handler import get_feature
from features.geo.handlers.list.handler import list_features
from features.geo.handlers.update.handler import update_feature
from features.geo.handlers.update.input import UpdateFeatureInput
from features.geo.models.feature import GeoFeature, GeoFeatureCollection

router = APIRouter(prefix="/v1/geo/features", tags=["geo"])


@router.post("/", response_model=GeoFeature, status_code=status.HTTP_201_CREATED)
async def create_geo_feature(
    input_: CreateFeatureInput,
    conn: Annotated[duckdb.DuckDBPyConnection, Depends(geo_db)],
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
) -> GeoFeature:
    """Create a map feature in a layer. Requires the layer's edit permission."""
    return await create_feature(
        input_=input_, conn=conn, authz=authz, principal=principal
    )


@router.get("/", response_model=GeoFeatureCollection)
async def list_geo_features(
    layer: Annotated[str, Query(description="Layer machine key, e.g. fields")],
    conn: Annotated[duckdb.DuckDBPyConnection, Depends(geo_db)],
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
    season: Annotated[Optional[str], Query()] = None,
) -> GeoFeatureCollection:
    """List the features in a layer. Requires the layer's view permission."""
    return await list_features(
        layer_name=layer,
        season=season,
        conn=conn,
        authz=authz,
        principal=principal,
    )


@router.get("/{feature_id}", response_model=GeoFeature)
async def get_geo_feature(
    feature_id: str,
    conn: Annotated[duckdb.DuckDBPyConnection, Depends(geo_db)],
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
) -> GeoFeature:
    """Fetch one feature as GeoJSON. Requires the layer's view permission."""
    return await get_feature(
        feature_id=feature_id, conn=conn, authz=authz, principal=principal
    )


@router.put("/{feature_id}", response_model=GeoFeature)
async def update_geo_feature(
    feature_id: str,
    input_: UpdateFeatureInput,
    conn: Annotated[duckdb.DuckDBPyConnection, Depends(geo_db)],
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
) -> GeoFeature:
    """Reshape a feature or change its properties. Requires the layer's edit permission."""
    return await update_feature(
        feature_id=feature_id,
        input_=input_,
        conn=conn,
        authz=authz,
        principal=principal,
    )


@router.delete("/{feature_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_geo_feature(
    feature_id: str,
    conn: Annotated[duckdb.DuckDBPyConnection, Depends(geo_db)],
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
) -> None:
    """Delete a feature. Requires the layer's delete permission."""
    await delete_feature(
        feature_id=feature_id, conn=conn, authz=authz, principal=principal
    )
