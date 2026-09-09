"""getItem handler: one shape as GeoJSON, gated by its collection's view permission."""

from __future__ import annotations

from core.auth.principal import Principal
from core.authz.service import AuthzService
from core.geo.service import GeospatialService
from features.geo.handlers.common import resolve_item
from features.geo.models.feature import GeoFeature
from features.geo.permissions import ensure_permission


async def get_feature(
    collection_id: str,
    feature_id: str,
    geo: GeospatialService,
    authz: AuthzService,
    principal: Principal,
) -> GeoFeature:
    layer = resolve_item(geo, collection_id, feature_id)
    await ensure_permission(authz, principal.user_id, layer.view)

    return GeoFeature.from_record(geo.get(feature_id))
