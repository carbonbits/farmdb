"""deleteItem handler: remove a shape, gated by its collection's delete permission."""

from __future__ import annotations

from core.auth.principal import Principal
from core.authz.service import AuthzService
from core.geo.service import GeospatialService
from features.geo.handlers.common import resolve_item
from features.geo.permissions import ensure_permission


async def delete_feature(
    collection_id: str,
    feature_id: str,
    geo: GeospatialService,
    authz: AuthzService,
    principal: Principal,
) -> None:
    layer = resolve_item(geo, collection_id, feature_id)
    await ensure_permission(authz, principal.user_id, layer.delete)

    geo.delete(feature_id)
