"""listItems handler: a collection's shapes, as a GeoJSON FeatureCollection."""

from __future__ import annotations

from typing import Optional

from core.auth.principal import Principal
from core.authz.service import AuthzService
from core.geo.layers import get_layer
from core.geo.service import GeospatialService
from features.geo.models.feature import GeoFeatureCollection
from features.geo.permissions import ensure_permission


async def list_features(
    collection_id: str,
    season: Optional[str],
    geo: GeospatialService,
    authz: AuthzService,
    principal: Principal,
) -> GeoFeatureCollection:
    layer = get_layer(collection_id)  # 404 on unknown collection
    await ensure_permission(authz, principal.user_id, layer.view)

    return GeoFeatureCollection.from_records(geo.list(layer=layer.name, season=season))
