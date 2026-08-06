import pytest

from core.authz.models import Role
from core.authz.service import AuthzService


@pytest.mark.asyncio
async def test_can_returns_false_for_unknown_permission(migrated_db):
    authz = AuthzService()
    assert await authz.can("some-user", "does_not_exist") is False


@pytest.mark.asyncio
async def test_can_grants_via_direct_role(migrated_db):
    authz = AuthzService()
    permission = await authz.create_permission("water_crops")
    role = await authz.create_role("irrigator")
    await authz.grant_permission_to_role(role.id, permission.id)
    await authz.assign_role_to_user("user-1", role.id)

    assert await authz.can("user-1", "water_crops") is True
    assert await authz.can("user-2", "water_crops") is False


@pytest.mark.asyncio
async def test_can_grants_via_group_membership(migrated_db):
    authz = AuthzService()
    permission = await authz.create_permission("harvest_crops")
    role = await authz.create_role("harvester")
    await authz.grant_permission_to_role(role.id, permission.id)

    group = await authz.create_group("field_crew")
    await authz.add_role_to_group(group.id, role.id)
    await authz.add_user_to_group("user-3", group.id)

    assert await authz.can("user-3", "harvest_crops") is True


@pytest.mark.asyncio
async def test_can_false_when_user_has_no_roles_or_groups(migrated_db):
    authz = AuthzService()
    await authz.create_permission("delete_farm")

    assert await authz.can("nobody", "delete_farm") is False


@pytest.mark.asyncio
async def test_owner_role_seeded_by_migration(migrated_db):
    authz = AuthzService()
    role = await Role.find_one(Role.name == "owner")
    assert role is not None

    await authz.assign_role_to_user("owner-user", role.id)

    assert await authz.can("owner-user", "create_crop") is True
    assert await authz.can("owner-user", "create_field") is True
    assert await authz.can("owner-user", "list_fields") is True
