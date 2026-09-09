"""
createItem handler.

Checks the caller may edit the collection, then hands the shape to the store,
which validates the geometry and stamps the farm and CRS onto it.
"""

from __future__ import annotations

from core.auth.principal import Principal
from core.authz.service import AuthzService
from core.geo.layers import get_layer
from core.geo.service import GeospatialService
from features.geo.handlers.create.input import CreateFeatureInput
from features.geo.models.feature import GeoFeature
from features.geo.permissions import ensure_permission


async def create_feature(
    collection_id: str,
    input_: CreateFeatureInput,
    geo: GeospatialService,
    authz: AuthzService,
    principal: Principal,
) -> GeoFeature:
    layer = get_layer(collection_id)  # 404 on unknown collection, before anything else
    await ensure_permission(authz, principal.user_id, layer.edit)

    record = geo.create(
        layer=layer.name,
        geometry=input_.geometry,
        properties=input_.properties,
        season=input_.season,
        created_by=principal.user_id,
    )

    return GeoFeature.from_record(record)
