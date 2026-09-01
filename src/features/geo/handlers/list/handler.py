"""listFeatures handler: the features in one layer, as a GeoJSON FeatureCollection."""
from __future__ import annotations

from typing import Optional

import duckdb

from core.auth.principal import Principal
from core.authz.service import AuthzService
from features.geo.handlers.common import FEATURE_COLUMNS, row_to_feature
from features.geo.layers import get_layer
from features.geo.models.feature import GeoFeatureCollection
from features.geo.permissions import ensure_permission


async def list_features(
    layer_name: str,
    season: Optional[str],
    conn: duckdb.DuckDBPyConnection,
    authz: AuthzService,
    principal: Principal,
) -> GeoFeatureCollection:
    layer = get_layer(layer_name)  # 400 on unknown layer
    await ensure_permission(authz, principal.user_id, layer.view)

    # A season filter only applies to seasonal layers; season-less layers
    # return everything regardless of the season passed.
    if layer.seasonal and season is not None:
        rows = conn.execute(
            f"SELECT {FEATURE_COLUMNS} FROM v1.geospatial "
            "WHERE layer = ? AND season = ? ORDER BY created_at",
            [layer_name, season],
        ).fetchall()
    else:
        rows = conn.execute(
            f"SELECT {FEATURE_COLUMNS} FROM v1.geospatial WHERE layer = ? "
            "ORDER BY created_at",
            [layer_name],
        ).fetchall()

    return GeoFeatureCollection(features=[row_to_feature(r) for r in rows])
