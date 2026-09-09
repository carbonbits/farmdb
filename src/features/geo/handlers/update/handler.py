"""
updateItem handler.

Reshapes a shape or changes its properties. It keeps its id and its collection,
so anything referencing it stays attached. This is a PUT, so the properties in
the body replace what is stored — an omitted properties object empties them.
"""

from __future__ import annotations

from core.auth.principal import Principal
from core.authz.service import AuthzService
from core.geo.service import GeospatialService
from features.geo.handlers.common import resolve_item
from features.geo.handlers.update.input import UpdateFeatureInput
from features.geo.models.feature import GeoFeature
from features.geo.permissions import ensure_permission


async def update_feature(
    collection_id: str,
    feature_id: str,
    input_: UpdateFeatureInput,
    geo: GeospatialService,
    authz: AuthzService,
    principal: Principal,
) -> GeoFeature:
    layer = resolve_item(geo, collection_id, feature_id)
    await ensure_permission(authz, principal.user_id, layer.edit)

    record = geo.replace_geometry(
        feature_id, geometry=input_.geometry, properties=input_.properties
    )

    return GeoFeature.from_record(record)
