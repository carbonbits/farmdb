"""
Tests for POST /v1/crops/

Follows the project test pattern:
  - pytest + pytest_asyncio
  - httpx ASGITransport against the real FastAPI application
  - in-memory DuckDB via DB.connect()
  - migrations applied manually per fixture
"""

from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from core.storage.database import DB
from main import application


def _apply_migration(conn, filepath: str) -> None:
    spec = importlib.util.spec_from_file_location("migration", Path(filepath))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.up(conn)


@pytest_asyncio.fixture
async def client():
    DB.connect()
    conn = DB.get_connection()
    conn.execute("CREATE SCHEMA IF NOT EXISTS v1")
    _apply_migration(conn, "src/migrations/0004_create_users_table.py")
    _apply_migration(conn, "src/migrations/0006_create_crops_table.py")
    _apply_migration(conn, "src/migrations/0007_create_activities_table.py")
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as ac:
        yield ac
    DB.disconnect()


@pytest_asyncio.fixture
async def auth_client(client):
    reg = await client.post(
        "/v1/auth/register",
        json={
            "email": "miriam@test.farm",
            "password": "TestPassword123!",
            "display_name": "Miriam",
        },
    )
    assert reg.status_code == 200
    token = reg.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


@pytest.mark.asyncio
async def test_create_crop_returns_201(auth_client):
    response = await auth_client.post(
        "/v1/crops/",
        json={"name": "Maize", "variety": "H614D", "description": "Main season crop"},
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_create_crop_response_shape(auth_client):
    response = await auth_client.post("/v1/crops/", json={"name": "Maize"})
    data = response.json()
    assert data["name"] == "Maize"
    assert "id" in data
    assert "created_by" in data
    assert "created_at" in data
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_create_crop_optional_fields_null_by_default(auth_client):
    response = await auth_client.post("/v1/crops/", json={"name": "Beans"})
    data = response.json()
    assert data["field_id"] is None
    assert data["variety"] is None
    assert data["description"] is None


@pytest.mark.asyncio
async def test_create_crop_writes_activity_row(auth_client):
    response = await auth_client.post("/v1/crops/", json={"name": "Sorghum"})
    assert response.status_code == 201
    crop_id = response.json()["id"]

    conn = DB.get_connection()
    row = conn.execute(
        """
        SELECT action, entity_type, entity_id, actor_email, description
        FROM v1.activities
        WHERE entity_id = ?
        """,
        [crop_id],
    ).fetchone()

    assert row is not None, "No activity row written for crop creation"
    assert row[0] == "crop.created"
    assert row[1] == "crop"
    assert row[2] == crop_id
    assert "miriam@test.farm" in row[3]
    assert "Sorghum" in row[4]


@pytest.mark.asyncio
async def test_create_crop_description_format(auth_client):
    response = await auth_client.post("/v1/crops/", json={"name": "Wheat"})
    crop_id = response.json()["id"]

    conn = DB.get_connection()
    row = conn.execute(
        "SELECT description FROM v1.activities WHERE entity_id = ?",
        [crop_id],
    ).fetchone()

    assert row is not None
    assert "Miriam" in row[0]
    assert "Wheat" in row[0]
    assert "created crop" in row[0]


@pytest.mark.asyncio
async def test_create_crop_requires_auth(client):
    response = await client.post("/v1/crops/", json={"name": "Maize"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_crop_rejects_invalid_token(client):
    response = await client.post(
        "/v1/crops/",
        json={"name": "Maize"},
        headers={"Authorization": "Bearer this.is.not.valid"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_crop_rejects_missing_name(auth_client):
    response = await auth_client.post("/v1/crops/", json={"variety": "H614D"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_crop_rejects_extra_fields(auth_client):
    response = await auth_client.post(
        "/v1/crops/", json={"name": "Maize", "unknown_field": "sneaky"}
    )
    assert response.status_code == 422
