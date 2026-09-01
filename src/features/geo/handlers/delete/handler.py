"""deleteFeature handler: remove a feature, gated by its layer's delete permission."""
from __future__ import annotations

import duckdb
from fastapi import HTTPException, status

from core.auth.principal import Principal
from core.authz.service import AuthzService
from features.geo.layers import get_layer
from features.geo.permissions import ensure_permission


async def delete_feature(
    feature_id: str,
    conn: duckdb.DuckDBPyConnection,
    authz: AuthzService,
    principal: Principal,
) -> None:
    existing = conn.execute(
        "SELECT layer FROM v1.geospatial WHERE id = ?",
        [feature_id],
    ).fetchone()
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Feature not found."
        )

    layer = get_layer(existing[0])
    await ensure_permission(authz, principal.user_id, layer.delete)

    conn.execute("DELETE FROM v1.geospatial WHERE id = ?", [feature_id])
