"""
updateFeature handler.

Reshapes an existing feature or changes its properties. The feature keeps its
id and its layer, so anything referencing it stays attached. Gated by the
layer's edit permission; the new geometry must still match the layer's class.
"""
from __future__ import annotations

import json

import duckdb
from fastapi import HTTPException, status

from core.auth.principal import Principal
from core.authz.service import AuthzService
from features.geo.handlers.common import FEATURE_COLUMNS, row_to_feature
from features.geo.handlers.update.input import UpdateFeatureInput
from features.geo.layers import get_layer
from features.geo.models.feature import GeoFeature
from features.geo.permissions import ensure_permission


async def update_feature(
    feature_id: str,
    input_: UpdateFeatureInput,
    conn: duckdb.DuckDBPyConnection,
    authz: AuthzService,
    principal: Principal,
) -> GeoFeature:
    existing = conn.execute(
        "SELECT layer FROM v1.geospatial WHERE id = ?",
        [feature_id],
    ).fetchone()
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Feature not found."
        )

    layer = get_layer(existing[0])
    await ensure_permission(authz, principal.user_id, layer.edit)

    geometry_json = json.dumps(input_.geometry)
    _validate_geometry(conn, geometry_json, layer.geometry_type)
    properties_json = json.dumps(input_.properties)

    conn.execute(
        """
        UPDATE v1.geospatial
        SET geometry = ST_GeomFromGeoJSON(?),
            properties = ?,
            updated_at = now()
        WHERE id = ?
        """,
        [geometry_json, properties_json, feature_id],
    )

    row = conn.execute(
        f"SELECT {FEATURE_COLUMNS} FROM v1.geospatial WHERE id = ?",
        [feature_id],
    ).fetchone()
    return row_to_feature(row)


def _validate_geometry(
    conn: duckdb.DuckDBPyConnection, geometry_json: str, expected_type: str
) -> None:
    """Reject anything that is not a valid geometry of the layer's class.

    Runs before the update, so nothing is changed on failure.
    """
    try:
        result = conn.execute(
            "SELECT ST_GeometryType(ST_GeomFromGeoJSON(?)), "
            "ST_IsValid(ST_GeomFromGeoJSON(?))",
            [geometry_json, geometry_json],
        ).fetchone()
    except duckdb.Error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read geometry as GeoJSON.",
        )

    geometry_type, is_valid = result[0], result[1]
    if geometry_type != expected_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Layer expects {expected_type} geometry, got {geometry_type}.",
        )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geometry is not valid, for example a self-intersecting polygon.",
        )
