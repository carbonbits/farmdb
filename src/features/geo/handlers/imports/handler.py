"""
importCollection handler.

Checks the caller may edit the collection, then walks the uploaded features and
stores each through the same create path a drawn shape uses, so an imported
feature is validated exactly like a drawn one. A feature the database refuses is
skipped with its reason rather than failing the whole upload, so one bad shape
never loses the good ones.
"""

from __future__ import annotations

from typing import Optional

from core.auth.principal import Principal
from core.authz.service import AuthzService
from core.errors import Invalid
from core.geo.layers import get_layer
from core.geo.service import GeospatialService
from features.geo.handlers.imports.input import ImportFeatureCollection
from features.geo.handlers.imports.result import ImportResult, SkippedFeature
from features.geo.permissions import ensure_permission


async def import_features(
    collection_id: str,
    payload: ImportFeatureCollection,
    season: Optional[str],
    geo: GeospatialService,
    authz: AuthzService,
    principal: Principal,
) -> ImportResult:
    layer = get_layer(collection_id)  # 404 on unknown collection, before anything else
    await ensure_permission(authz, principal.user_id, layer.edit)

    imported = 0
    skipped: list[SkippedFeature] = []

    for index, feature in enumerate(payload.features):
        try:
            geo.create(
                layer=layer.name,
                geometry=feature.geometry,
                properties=feature.properties,
                season=season,
                created_by=principal.user_id,
            )
            imported += 1
        except Invalid as exc:
            skipped.append(SkippedFeature(index=index, reason=str(exc)))

    return ImportResult(imported=imported, skipped=skipped)