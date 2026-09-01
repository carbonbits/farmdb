"""getFeature handler: fetch one feature as GeoJSON, gated by its layer's view permission."""
from __future__ import annotations

import duckdb
from fastapi import HTTPException, status

from core.auth.principal import Principal
from core.authz.service import AuthzService
from features.geo.handlers.common import FEATURE_COLUMNS, row_to_feature
from features.geo.layers import get_layer
from features.geo.models.feature import GeoFeature
from features.geo.permissions import ensure_permission


async def get_feature(
    feature_id: str,
    conn: duckdb.DuckDBPyConnection,
    authz: AuthzService,
    principal: Principal,
) -> GeoFeature:
    row = conn.execute(
        f"SELECT {FEATURE_COLUMNS} FROM v1.geospatial WHERE id = ?",
        [feature_id],
    ).fetchone()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Feature not found."
        )

    layer = get_layer(row[1])
    await ensure_permission(authz, principal.user_id, layer.view)
    return row_to_feature(row)
