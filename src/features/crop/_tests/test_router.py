import pytest


@pytest.mark.asyncio
async def test_create_crop_requires_authorization(api_client):
    resp = await api_client.post("/v1/crops/", json={"name": "Maize"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_crop(auth_client):
    resp = await auth_client.post(
        "/v1/crops/",
        json={"name": "Maize", "variety": "H614D", "description": "Main season crop"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Maize"
    assert body["variety"] == "H614D"
    assert body["description"] == "Main season crop"
    assert body["is_active"] is True
    assert "id" in body
    assert "created_by" in body
    assert "created_at" in body


@pytest.mark.asyncio
async def test_create_crop_optional_fields_default_to_null(auth_client):
    resp = await auth_client.post("/v1/crops/", json={"name": "Beans"})
    body = resp.json()
    assert body["field_id"] is None
    assert body["variety"] is None
    assert body["description"] is None


@pytest.mark.asyncio
async def test_create_crop_rejects_missing_name(auth_client):
    resp = await auth_client.post("/v1/crops/", json={"variety": "H614D"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_crop_rejects_extra_fields(auth_client):
    resp = await auth_client.post(
        "/v1/crops/", json={"name": "Maize", "unknown_field": "sneaky"}
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_crop_writes_activity_row(auth_client):
    from core.storage.database import DB

    resp = await auth_client.post("/v1/crops/", json={"name": "Sorghum"})
    crop_id = resp.json()["id"]

    conn = DB.get_connection()
    row = conn.execute(
        """
        SELECT action, entity_type, entity_id, actor_email
        FROM v1.activities
        WHERE entity_id = ?
        """,
        [crop_id],
    ).fetchone()

    assert row is not None
    assert row[0] == "crop.created"
    assert row[1] == "crop"
    assert row[2] == crop_id
    assert "tester@example.com" in row[3]
