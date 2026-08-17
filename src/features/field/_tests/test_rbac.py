"""
End-to-end RBAC enforcement over the HTTP surface.

The `authz` unit tests prove `AuthzService.can()` resolves permissions through
direct roles and group membership. These tests prove the same resolution is
actually *enforced* by `require_permission` on real routes, across the two
credential types (bearer JWT and API key), and that permissions are scoped
per-action rather than all-or-nothing.

The `auth_client` fixture authenticates as tester@example.com — the first user
in the isolated DB, so it is granted the all-access "administrator" role on
creation. Tests that exercise narrower grants strip that role first, then
rebuild exactly the access under test.
"""

import pytest

from core.auth.service import AuthService
from core.authz.models import Role, UserRole
from core.authz.service import AuthzService

TESTER_EMAIL = "tester@example.com"


async def _tester_id() -> str:
    user = AuthService().get_user_by_email(TESTER_EMAIL)
    assert user is not None
    return user.id


async def _strip_admin_role() -> None:
    """Remove the tester's administrator grant so a narrower one can be tested."""
    role = await Role.find_one(Role.name == "administrator")
    await UserRole.find(UserRole.role_id == role.id).delete()


@pytest.mark.asyncio
async def test_permission_granted_via_group_membership(auth_client):
    """A permission reaching the user only through a group is enforced on a route."""
    user_id = await _tester_id()
    await _strip_admin_role()

    # Without the administrator role, listing fields (fields.view) is denied.
    assert (await auth_client.get("/v1/fields/")).status_code == 403

    # Grant fields.view through a group rather than a direct role.
    authz = AuthzService()
    permission = await authz.create_permission("fields.view")
    role = await authz.create_role("map_viewer")
    await authz.grant_permission_to_role(role.id, permission.id)

    group = await authz.create_group("viewers")
    await authz.add_role_to_group(group.id, role.id)
    await authz.add_user_to_group(user_id, group.id)

    # The union (user -> group -> role -> permission) is honoured on the route.
    assert (await auth_client.get("/v1/fields/")).status_code == 200


@pytest.mark.asyncio
async def test_permissions_are_scoped_per_action(auth_client):
    """A role granting only fields.view permits reads but not writes."""
    user_id = await _tester_id()
    await _strip_admin_role()

    authz = AuthzService()
    view_perm = await authz.create_permission("fields.view")
    role = await authz.create_role("field_reader")
    await authz.grant_permission_to_role(role.id, view_perm.id)
    await authz.assign_role_to_user(user_id, role.id)

    # Reads are allowed...
    assert (await auth_client.get("/v1/fields/")).status_code == 200
    # ...but creating a field requires fields.edit, which was never granted.
    denied = await auth_client.post("/v1/fields/", json={"name": "West Field"})
    assert denied.status_code == 403
    assert denied.json()["detail"] == "Permission denied: fields.edit"


@pytest.mark.asyncio
async def test_api_key_principal_carries_owner_permissions(auth_client):
    """An API key resolves to its owner and passes permission gates for writes."""
    created = await auth_client.post("/v1/api-keys/", json={"name": "automation"})
    assert created.status_code == 201
    key = created.json()["key"]

    # The key authenticates AND clears the fields.edit gate (admin has it),
    # so a write succeeds with no JWT in play.
    resp = await auth_client.post(
        "/v1/fields/",
        json={"name": "Drone Field"},
        headers={"Authorization": f"Bearer {key}"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["name"] == "Drone Field"


@pytest.mark.asyncio
async def test_api_key_denied_when_owner_loses_permission(auth_client):
    """Revoking the owner's role also strips the API key's derived access."""
    created = await auth_client.post("/v1/api-keys/", json={"name": "automation"})
    key = created.json()["key"]

    await _strip_admin_role()

    resp = await auth_client.post(
        "/v1/fields/",
        json={"name": "Orphan Field"},
        headers={"Authorization": f"Bearer {key}"},
    )
    assert resp.status_code == 403
