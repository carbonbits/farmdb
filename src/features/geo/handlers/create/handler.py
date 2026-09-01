"""
createFeature handler.

Validates the layer, checks the caller may edit it, validates the geometry,
then inserts one row into v1.geospatial and returns it as GeoJSON.
"""
from __future__ import annotations

import json

import duckdb
from fastapi import HTTPException, status
from ulid import ULID

from core.auth.principal import Principal
from core.authz.service import AuthzService
from core.config.service import ConfigService
from features.geo.handlers.common import FEATURE_COLUMNS, row_to_feature
from features.geo.handlers.create.input import CreateFeatureInput
from features.geo.layers import get_layer
from features.geo.models.feature import GeoFeature
from features.geo.permissions import ensure_permission


async def create_feature(
    input_: CreateFeatureInput,
    conn: duckdb.DuckDBPyConnection,
    authz: AuthzService,
    principal: Principal,
) -> GeoFeature:
    layer = get_layer(input_.layer)  # 400 on unknown layer, before anything else
    await ensure_permission(authz, principal.user_id, layer.edit)

    geometry_json = json.dumps(input_.geometry)
    _validate_geometry(conn, geometry_json, layer.geometry_type)

    # Season-less layers never carry a season, whatever the caller sent.
    season = input_.season if layer.seasonal else None
    farm_id = ConfigService().get("farmId")
    feature_id = str(ULID())
    properties_json = json.dumps(input_.properties)

    conn.execute(
        """
        INSERT INTO v1.geospatial
            (id, farm_id, feature_type, geometry, properties, layer, season, created_by)
        VALUES (?, ?, ?, ST_GeomFromGeoJSON(?), ?, ?, ?, ?)
        """,
        [
            feature_id,
            farm_id,
            input_.layer,  # feature_type mirrors layer (legacy NOT NULL column)
            geometry_json,
            properties_json,
            input_.layer,
            season,
            principal.user_id,
        ],
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

    Runs before the insert, so nothing is written on failure.
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
