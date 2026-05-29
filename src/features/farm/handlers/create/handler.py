"""
createFarm handler.
Transportagnostic called by both REST and GraphQL.
Raises PermissionDenied so each transport maps it correctly.
"""
from __future__ import annotations

import logging
from ulid import ULID
import duckdb
import httpx

from core.authz.fga import FGAClient, FGATuple
from features.farm.handlers.create.input import CreateFarmInput
from features.farm.models.farm import FarmModel
from settings import settings

logger = logging.getLogger(__name__)

fga_client = FGAClient()


class PermissionDenied(Exception):
    pass


async def get_org_authz(org_id: str) -> tuple[str, str]:
    """Fetch org's OpenFGA store_id and model_id from platform API."""
    headers = {"Content-Type": "application/json"}
    if settings.cf_access_client_id:
        headers["CF-Access-Client-Id"] = settings.cf_access_client_id
    if settings.cf_access_client_secret:
        headers["CF-Access-Client-Secret"] = settings.cf_access_client_secret

    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(
            f"{settings.platform_api_url}/platform/v1/organizations/{org_id}",
            headers=headers,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["authorization_store_id"], data["authorization_model_id"]


async def create_farm(
    input_: CreateFarmInput,
    conn: duckdb.DuckDBPyConnection,
    user_id: str,
    org_id: str,
) -> FarmModel:
    # 1. Get org's OpenFGA store and model
    store_id, model_id = await get_org_authz(org_id)

    # 2. Permission check
    allowed = await fga_client.can(
        tuple_=FGATuple(
            user=f"user:{user_id}",
            relation="create_farm",
            object=f"organization:{org_id}",
        ),
        store_id=store_id,
        model_id=model_id,
    )
    if not allowed:
        raise PermissionDenied("create_farm")

    # 3. Insert
    farm_id = str(ULID())
    conn.execute(
        """
        INSERT INTO v1.farms (id, name, description, shortcode, org_id, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        [farm_id, input_.name, input_.description, input_.shortcode, org_id, user_id],
    )

    # 4. Fetch and return
    row = conn.execute(
        """
        SELECT id, name, description, shortcode, org_id, created_by,
               is_active, created_at, updated_at
        FROM v1.farms WHERE id = ?
        """,
        [farm_id],
    ).fetchone()

    return FarmModel(
        id=row[0], name=row[1], description=row[2], shortcode=row[3],
        org_id=row[4], created_by=row[5], is_active=row[6],
        created_at=row[7], updated_at=row[8],
    )