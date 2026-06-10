import pytest


@pytest.mark.asyncio
async def test_api_keys_require_authorization(api_client):
    assert (await api_client.get("/v1/api-keys/")).status_code == 401
    assert (await api_client.post("/v1/api-keys/", json={"name": "ci"})).status_code == 401


@pytest.mark.asyncio
async def test_create_and_use_api_key(auth_client):
    # Create a key (authenticated with a bearer token).
    created = await auth_client.post("/v1/api-keys/", json={"name": "ci-token"})
    assert created.status_code == 201
    body = created.json()
    key = body["key"]
    assert key.startswith("fdb_")
    assert body["info"]["name"] == "ci-token"
    assert body["info"]["prefix"] == key[:10]

    # The key authenticates API calls (sent as a bearer credential), no JWT.
    resp = await auth_client.get("/v1/fields/", headers={"Authorization": f"Bearer {key}"})
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_list_and_revoke_api_key(auth_client):
    created = await auth_client.post("/v1/api-keys/", json={"name": "to-revoke"})
    key = created.json()["key"]
    key_id = created.json()["info"]["id"]

    listed = await auth_client.get("/v1/api-keys/")
    assert listed.status_code == 200
    assert [k["id"] for k in listed.json()] == [key_id]
    assert "key" not in listed.json()[0]  # secret never listed

    # Revoke, then the key no longer authenticates.
    assert (await auth_client.delete(f"/v1/api-keys/{key_id}")).status_code == 204
    resp = await auth_client.get("/v1/fields/", headers={"Authorization": f"Bearer {key}"})
    assert resp.status_code == 401

    # Revoking again is a 404.
    assert (await auth_client.delete(f"/v1/api-keys/{key_id}")).status_code == 404
