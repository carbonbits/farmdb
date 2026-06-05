"""
createFarm handler.
Transportagnostic called by both REST and GraphQL.
Raises PermissionDenied so each transport maps it correctly.
"""

from __future__ import annotations

import logging

import duckdb
from ulid import ULID

from core.authz.client import AuthzTuple, authz_client
from features.farm.handlers.create.input import CreateFarmInput
from features.farm.models.farm import FarmModel

logger = logging.getLogger(__name__)


class PermissionDenied(Exception):
    pass


async def create_farm(
    input_: CreateFarmInput,
    conn: duckdb.DuckDBPyConnection,
    user_id: str,
    org_id: str,
) -> FarmModel:
    # 1. Permission check
    allowed = await authz_client.can(
        tuple_=AuthzTuple(
            user=f"user:{user_id}",
            relation="create_farm",
            object=f"organization:{org_id}",
        ),
        context="organization",
        context_id=org_id,
    )
    if not allowed:
        raise PermissionDenied("create_farm")

    # 2. Insert
    farm_id = str(ULID())
    conn.execute(
        """
        INSERT INTO v1.farms (id, name, description, shortcode, org_id, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        [farm_id, input_.name, input_.description, input_.shortcode, org_id, user_id],
    )

    # 3. Fetch and return
    row = conn.execute(
        """
        SELECT id, name, description, shortcode, org_id, created_by,
               is_active, created_at, updated_at
        FROM v1.farms WHERE id = ?
        """,
        [farm_id],
    ).fetchone()

    return FarmModel(
        id=row[0],
        name=row[1],
        description=row[2],
        shortcode=row[3],
        org_id=row[4],
        created_by=row[5],
        is_active=row[6],
        created_at=row[7],
        updated_at=row[8],
    )
