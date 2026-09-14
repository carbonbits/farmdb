"""
The import route: bulk load a GeoJSON FeatureCollection into a collection.

    POST /v1/maps/collections/{cid}/import

The collection is in the path like the other write routes, and an optional
season travels as a query param so the body stays a plain GeoJSON file a user
can upload as is. An upload larger than the configured cap is refused whole, so
a huge file fails fast instead of writing thousands of rows one at a time.
"""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from config.settings import settings
from core.auth.principal import Principal
from core.auth.resolver import require_principal
from core.authz.service import AuthzService, get_authz_service
from features.geo.deps import Geo
from features.geo.handlers.imports.handler import import_features
from features.geo.handlers.imports.input import ImportFeatureCollection
from features.geo.handlers.imports.result import ImportResult

router = APIRouter()


@router.post("/collections/{collection_id}/import", response_model=ImportResult)
async def import_collection(
    collection_id: str,
    payload: ImportFeatureCollection,
    geo: Geo,
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
    season: Annotated[Optional[str], Query()] = None,
) -> ImportResult:
    """Bulk import features into a collection. Requires the collection's edit permission."""
    if len(payload.features) > settings.geo_import_max_features:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"Too many features: {len(payload.features)}. "
                f"The limit is {settings.geo_import_max_features}."
            ),
        )

    return await import_features(
        collection_id=collection_id,
        payload=payload,
        season=season,
        geo=geo,
        authz=authz,
        principal=principal,
    )