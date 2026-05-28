"""
Integration tests for createFarm.
Covers allowed and denied paths for both REST and GraphQL transports.
Authz client is mocked — tests verify handler and transport behaviour,
not the platform API itself.
"""
from __future__ import annotations

import pytest
import duckdb
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

from main import application
from core.storage.database import DB


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def in_memory_db(tmp_path):
    import settings as s
    s.settings.database_path = str(tmp_path / "test.db")
    DB.connect()
    conn = DB.get_connection()
    conn.execute("CREATE SCHEMA IF NOT EXISTS v1")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.farms (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            description TEXT,
            shortcode   TEXT,
            org_id      TEXT NOT NULL,
            created_by  TEXT NOT NULL,
            is_active   BOOLEAN NOT NULL DEFAULT TRUE,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    yield conn
    DB.disconnect()


@pytest.fixture
def headers():
    return {
        "x-user-id": "user-abc",
        "x-account-id": "org-xyz",
    }


@pytest.fixture
def graphql_headers():
    return {
        "x-user-id": "user-abc",
        "x-account-id": "org-xyz",
        "Content-Type": "application/json",
    }


def farm_count(conn: duckdb.DuckDBPyConnection) -> int:
    return conn.execute("SELECT COUNT(*) FROM v1.farms").fetchone()[0]


# ---------------------------------------------------------------------------
# REST — POST /v1/farms
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_rest_allowed_creates_farm(headers, in_memory_db):
    with patch(
        "core.authz.client.AuthzClient.can",
        new_callable=AsyncMock,
        return_value=True,
    ):
        async with AsyncClient(
            transport=ASGITransport(app=application), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/v1/farms/",
                json={"name": "Sunrise Farm", "description": "Test farm"},
                headers=headers,
            )

    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Sunrise Farm"
    assert body["description"] == "Test farm"
    assert body["org_id"] == "org-xyz"
    assert body["created_by"] == "user-abc"
    assert body["is_active"] is True
    assert "id" in body
    assert farm_count(in_memory_db) == 1


@pytest.mark.asyncio
async def test_rest_denied_returns_403_no_row_written(headers, in_memory_db):
    with patch(
        "core.authz.client.AuthzClient.can",
        new_callable=AsyncMock,
        return_value=False,
    ):
        async with AsyncClient(
            transport=ASGITransport(app=application), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/v1/farms/",
                json={"name": "Denied Farm"},
                headers=headers,
            )

    assert resp.status_code == 403
    assert farm_count(in_memory_db) == 0


@pytest.mark.asyncio
async def test_rest_missing_headers_returns_422(in_memory_db):
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        resp = await client.post("/v1/farms/", json={"name": "No Headers"})
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# GraphQL — createFarm mutation
# ---------------------------------------------------------------------------

MUTATION = """
mutation {
  createFarm(input: {
    name: "Sunrise Farm"
    description: "Test farm"
  }) {
    id
    name
    description
    orgId
    createdBy
    isActive
  }
}
"""


@pytest.mark.asyncio
async def test_graphql_allowed_creates_farm(graphql_headers, in_memory_db):
    with patch(
        "core.authz.client.AuthzClient.can",
        new_callable=AsyncMock,
        return_value=True,
    ):
        async with AsyncClient(
            transport=ASGITransport(app=application), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/graphql",
                json={"query": MUTATION},
                headers=graphql_headers,
            )

    assert resp.status_code == 200
    data = resp.json()
    assert "errors" not in data
    farm = data["data"]["createFarm"]
    assert farm["name"] == "Sunrise Farm"
    assert farm["orgId"] == "org-xyz"
    assert farm["createdBy"] == "user-abc"
    assert farm["isActive"] is True
    assert farm_count(in_memory_db) == 1


@pytest.mark.asyncio
async def test_graphql_denied_returns_permission_denied_no_row(graphql_headers, in_memory_db):
    with patch(
        "core.authz.client.AuthzClient.can",
        new_callable=AsyncMock,
        return_value=False,
    ):
        async with AsyncClient(
            transport=ASGITransport(app=application), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/graphql",
                json={"query": MUTATION},
                headers=graphql_headers,
            )

    assert resp.status_code == 200
    data = resp.json()
    errors = data.get("errors", [])
    assert any("PERMISSION_DENIED" in str(e) for e in errors)
    assert farm_count(in_memory_db) == 0