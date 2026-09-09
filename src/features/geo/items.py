"""
The item routes: OGC API - Features paths over our own CRUD semantics.

    GET    /v1/maps/collections/{cid}/items
    POST   /v1/maps/collections/{cid}/items
    GET    /v1/maps/collections/{cid}/items/{fid}
    PUT    /v1/maps/collections/{cid}/items/{fid}
    DELETE /v1/maps/collections/{cid}/items/{fid}

The collection is part of the path, so a body never names its layer and an item
is only reachable through the collection it belongs to.

Permissions cannot be pinned on the route the way the fields router pins
fields.edit: which permission guards a request depends on the collection, so the
handler looks it up and checks it. Authentication still happens here.
"""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse

from core.auth.principal import Principal
from core.auth.resolver import require_principal
from core.authz.service import AuthzService, get_authz_service
from features.geo.deps import Geo
from features.geo.handlers.create.handler import create_feature
from features.geo.handlers.create.input import CreateFeatureInput
from features.geo.handlers.delete.handler import delete_feature
from features.geo.handlers.get.handler import get_feature
from features.geo.handlers.list.handler import list_features
from features.geo.handlers.update.handler import update_feature
from features.geo.handlers.update.input import UpdateFeatureInput
from features.geo.links import GEOJSON
from features.geo.models.feature import GeoFeature, GeoFeatureCollection

router = APIRouter()


class GeoJSONResponse(JSONResponse):
    """Same JSON body, labelled the way a GeoJSON client expects."""

    media_type = GEOJSON


@router.post(
    "/collections/{collection_id}/items",
    response_model=GeoFeature,
    response_class=GeoJSONResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_item(
    collection_id: str,
    input_: CreateFeatureInput,
    geo: Geo,
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
) -> GeoFeature:
    """Add a shape to a collection. Requires the collection's edit permission."""
    return await create_feature(
        collection_id=collection_id,
        input_=input_,
        geo=geo,
        authz=authz,
        principal=principal,
    )


@router.get(
    "/collections/{collection_id}/items",
    response_model=GeoFeatureCollection,
    response_class=GeoJSONResponse,
)
async def list_items(
    collection_id: str,
    geo: Geo,
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
    season: Annotated[Optional[str], Query()] = None,
) -> GeoFeatureCollection:
    """The shapes in a collection. Requires the collection's view permission."""
    return await list_features(
        collection_id=collection_id,
        season=season,
        geo=geo,
        authz=authz,
        principal=principal,
    )


@router.get(
    "/collections/{collection_id}/items/{feature_id}",
    response_model=GeoFeature,
    response_class=GeoJSONResponse,
)
async def get_item(
    collection_id: str,
    feature_id: str,
    geo: Geo,
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
) -> GeoFeature:
    """One shape as GeoJSON. Requires the collection's view permission."""
    return await get_feature(
        collection_id=collection_id,
        feature_id=feature_id,
        geo=geo,
        authz=authz,
        principal=principal,
    )


@router.put(
    "/collections/{collection_id}/items/{feature_id}",
    response_model=GeoFeature,
    response_class=GeoJSONResponse,
)
async def update_item(
    collection_id: str,
    feature_id: str,
    input_: UpdateFeatureInput,
    geo: Geo,
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
) -> GeoFeature:
    """Reshape a feature or replace its properties. Requires the edit permission."""
    return await update_feature(
        collection_id=collection_id,
        feature_id=feature_id,
        input_=input_,
        geo=geo,
        authz=authz,
        principal=principal,
    )


@router.delete(
    "/collections/{collection_id}/items/{feature_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_item(
    collection_id: str,
    feature_id: str,
    geo: Geo,
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
) -> None:
    """Delete a feature. Requires the collection's delete permission."""
    await delete_feature(
        collection_id=collection_id,
        feature_id=feature_id,
        geo=geo,
        authz=authz,
        principal=principal,
    )
