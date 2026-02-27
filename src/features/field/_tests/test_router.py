import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from core.storage.database import DB
from main import application


@pytest_asyncio.fixture
async def client():
    DB.connect()
    async with AsyncClient(
        transport=ASGITransport(app=application),
        base_url="http://test"
    ) as ac:
        yield ac
    DB.disconnect()


@pytest.mark.asyncio
@pytest.mark.xfail(reason="Endpoint not implemented")
async def test_create_field(client):
    response = await client.post(
        "/v1/fields/",
        json={"name": "North Field", "description": "Primary wheat field"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "North Field"
    assert "id" in data


@pytest.mark.asyncio
@pytest.mark.xfail(reason="Endpoint not implemented")
async def test_list_fields(client):
    response = await client.get("/v1/fields/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
