import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from core.storage.database import DB
from main import application


@pytest_asyncio.fixture
async def client(tmp_path, monkeypatch):
    """Unauthenticated client (no bearer token), for testing the auth gate.

    Uses an isolated DB so the test never contends for the shared farm.db lock.
    """
    from config.settings import settings

    monkeypatch.setattr(settings, "database_path", str(tmp_path / "unauth.db"))
    DB.disconnect()
    DB.connect()
    async with AsyncClient(transport=ASGITransport(app=application), base_url="http://test") as ac:
        yield ac
    DB.disconnect()


@pytest.mark.asyncio
async def test_create_field_requires_authorization(client):
    response = await client.post(
        "/v1/fields/", json={"name": "North Field", "description": "Primary wheat field"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_fields_requires_authorization(client):
    response = await client.get("/v1/fields/")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_field(auth_client):
    response = await auth_client.post(
        "/v1/fields/", json={"name": "North Field", "description": "Primary wheat field"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "North Field"
    assert data["description"] == "Primary wheat field"
    assert "id" in data


@pytest.mark.asyncio
async def test_cookie_auth(api_client):
    # Register issues an httpOnly access cookie; the cookie jar reuses it.
    reg = await api_client.post(
        "/v1/auth/register",
        json={"email": "cookie@example.com", "password": "supersecret123"},
    )
    assert reg.status_code == 200
    assert reg.cookies.get("farmdb_access_token")

    # No Authorization header — authentication rides on the cookie alone.
    resp = await api_client.get("/v1/fields/")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_list_fields(auth_client):
    await auth_client.post("/v1/fields/", json={"name": "North Field"})
    await auth_client.post("/v1/fields/", json={"name": "South Field"})

    response = await auth_client.get("/v1/fields/")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    names = {field["name"] for field in data}
    assert {"North Field", "South Field"} <= names
