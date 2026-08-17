"""
End-to-end tests for the Access-control admin API (/v1/authz).

`auth_client` authenticates as tester@example.com, who is granted the seeded
`owner` role on creation — and after migration 0011 that role holds
`roles.manage`, so it clears the gate on every endpoint here.
"""

import pytest


@pytest.mark.asyncio
async def test_authz_requires_authentication(api_client):
    assert (await api_client.get("/v1/authz/roles")).status_code == 401
    assert (await api_client.get("/v1/authz/permissions")).status_code == 401


@pytest.mark.asyncio
async def test_authz_requires_roles_manage_permission(auth_client):
    # Strip the administrator role from the tester -> loses roles.manage -> 403.
    from core.authz.models import Role, UserRole

    role = await Role.find_one(Role.name == "administrator")
    await UserRole.find(UserRole.role_id == role.id).delete()

    assert (await auth_client.get("/v1/authz/roles")).status_code == 403


@pytest.mark.asyncio
async def test_list_permissions_returns_grouped_catalog(auth_client):
    resp = await auth_client.get("/v1/authz/permissions")
    assert resp.status_code == 200
    perms = resp.json()
    by_name = {p["name"]: p for p in perms}
    assert "fields.view" in by_name
    assert by_name["fields.view"]["group"] == "Fields & mapping"
    assert by_name["roles.manage"]["group"] == "Access control"


@pytest.mark.asyncio
async def test_list_roles_includes_seeded_roles(auth_client):
    resp = await auth_client.get("/v1/authz/roles")
    assert resp.status_code == 200
    roles = {r["name"]: r for r in resp.json()}

    assert {"administrator", "authenticated", "manager", "agronomist", "viewer"} <= set(
        roles
    )
    admin = roles["administrator"]
    assert admin["is_locked"] is True
    assert admin["display_name"] == "Administrator"
    # Administrator holds the whole catalog.
    assert "fields.view" in admin["permissions"]
    assert "fields.edit" in admin["permissions"]
    assert "roles.manage" in admin["permissions"]
    # The tester is the first user, so it holds administrator.
    assert admin["member_count"] >= 1
    # The baseline "authenticated" role grants nothing on its own.
    assert roles["authenticated"]["permissions"] == []
    # A non-system role carries a curated subset.
    assert set(roles["worker"]["permissions"]) == {
        "fields.view", "crops.view", "crops.log", "livestock.log", "tasks.view",
    }


@pytest.mark.asyncio
async def test_get_role_detail_lists_members(auth_client):
    roles = (await auth_client.get("/v1/authz/roles")).json()
    admin_id = next(r["id"] for r in roles if r["name"] == "administrator")

    resp = await auth_client.get(f"/v1/authz/roles/{admin_id}")
    assert resp.status_code == 200
    detail = resp.json()
    assert any(m["email"] == "tester@example.com" for m in detail["members"])


@pytest.mark.asyncio
async def test_create_role_and_reject_duplicate(auth_client):
    resp = await auth_client.post(
        "/v1/authz/roles",
        json={
            "name": "irrigation_lead",
            "display_name": "Irrigation lead",
            "description": "Runs the irrigation crew",
            "permissions": ["fields.view", "tasks.view", "tasks.assign"],
        },
    )
    assert resp.status_code == 201, resp.text
    created = resp.json()
    assert created["display_name"] == "Irrigation lead"
    assert set(created["permissions"]) == {"fields.view", "tasks.view", "tasks.assign"}
    assert created["is_locked"] is False

    # Same machine name -> 409.
    dup = await auth_client.post(
        "/v1/authz/roles", json={"name": "irrigation_lead", "permissions": []}
    )
    assert dup.status_code == 409


@pytest.mark.asyncio
async def test_set_permissions_on_custom_role(auth_client):
    created = (
        await auth_client.post(
            "/v1/authz/roles",
            json={"name": "scout", "permissions": ["fields.view"]},
        )
    ).json()

    resp = await auth_client.put(
        f"/v1/authz/roles/{created['id']}/permissions",
        json={"permissions": ["fields.view", "crops.view", "crops.log"]},
    )
    assert resp.status_code == 200
    assert set(resp.json()["permissions"]) == {"fields.view", "crops.view", "crops.log"}


@pytest.mark.asyncio
async def test_set_permissions_rejected_on_locked_role(auth_client):
    roles = (await auth_client.get("/v1/authz/roles")).json()
    admin_id = next(r["id"] for r in roles if r["name"] == "administrator")

    resp = await auth_client.put(
        f"/v1/authz/roles/{admin_id}/permissions",
        json={"permissions": ["fields.view"]},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_assign_and_revoke_role_to_user(auth_client):
    # A second user (also auto-granted owner) to manage.
    from core.auth.service import AuthService

    other = AuthService().create_user(email="grace@example.com", display_name="Grace")

    roles = (await auth_client.get("/v1/authz/roles")).json()
    viewer_id = next(r["id"] for r in roles if r["name"] == "viewer")

    assign = await auth_client.post(f"/v1/authz/users/{other.id}/roles/{viewer_id}")
    assert assign.status_code == 204

    users = {u["id"]: u for u in (await auth_client.get("/v1/authz/users")).json()}
    assert "viewer" in {r["name"] for r in users[other.id]["roles"]}

    revoke = await auth_client.delete(f"/v1/authz/users/{other.id}/roles/{viewer_id}")
    assert revoke.status_code == 204

    users = {u["id"]: u for u in (await auth_client.get("/v1/authz/users")).json()}
    assert "viewer" not in {r["name"] for r in users[other.id]["roles"]}


@pytest.mark.asyncio
async def test_assign_unknown_role_is_404(auth_client):
    from core.auth.service import AuthService

    other = AuthService().create_user(email="nobody@example.com")
    resp = await auth_client.post(f"/v1/authz/users/{other.id}/roles/does-not-exist")
    assert resp.status_code == 404
