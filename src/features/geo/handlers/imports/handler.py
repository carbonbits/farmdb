"""
importCollection handler.

Checks the caller may edit the collection, then walks the uploaded features and
stores each through the same create path a drawn shape uses, so an imported
feature is validated exactly like a drawn one. A feature the database refuses is
skipped with its reason rather than failing the whole upload, so one bad shape
never loses the good ones.
"""
from typing import Optional

from core.auth.principal import Principal
from core.authz.service import AuthzService
from core.errors import Invalid
from core.geo.layers import Layer, get_layer
from core.geo.service import GeospatialService
from features.geo.handlers.imports.input import ImportFeature, ImportFeatureCollection
from features.geo.handlers.imports.result import ImportResult, SkippedFeature
from features.geo.permissions import ensure_permission


class ImportFeaturesHandler:
    """Bulk load a GeoJSON FeatureCollection into one collection.

    The collaborators are held on the instance and the upload itself is passed
    to `handle`, so the handler carries no per-request state between calls.
    """

    def __init__(
        self,
        geo: GeospatialService,
        authz: AuthzService,
        principal: Principal,
    ) -> None:
        self._geo = geo
        self._authz = authz
        self._principal = principal

    async def handle(
        self,
        collection_id: str,
        payload: ImportFeatureCollection,
        season: Optional[str],
    ) -> ImportResult:
        layer = get_layer(collection_id)  # 404 on unknown collection, before anything else
        await ensure_permission(self._authz, self._principal.user_id, layer.edit)

        imported = 0
        skipped: list[SkippedFeature] = []

        for index, feature in enumerate(payload.features):
            try:
                self._store(layer, feature, season)
                imported += 1
            except Invalid as exc:
                skipped.append(SkippedFeature(index=index, reason=str(exc)))

        return ImportResult(imported=imported, skipped=skipped)

    def _store(self, layer: Layer, feature: ImportFeature, season: Optional[str]) -> None:
        self._geo.create(
            layer=layer.name,
            geometry=feature.geometry,
            properties=feature.properties,
            season=season,
            created_by=self._principal.user_id,
        )
