"""
Authorization — DuckDB-backed RBAC via duckling.

A user's effective permissions are the union of permissions granted by
roles assigned directly (UserRole) and roles granted through group
membership (UserGroup -> GroupRole). `require_permission` is the FastAPI
dependency routes use; it resolves the principal and raises 403 when the
permission is missing, so call sites need only one dependency.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import Depends, HTTPException, status

from core.auth.principal import Principal
from core.auth.resolver import require_principal
from core.authz.models import (
    Group,
    GroupRole,
    Permission,
    Role,
    RolePermission,
    UserGroup,
    UserRole,
)


class AuthzService:
    async def can(self, user_id: str, action: str) -> bool:
        permission = await Permission.find_one(Permission.name == action)
        if permission is None:
            return False

        role_ids = {
            ur.role_id
            for ur in await UserRole.find(UserRole.user_id == user_id).to_list()
        }

        group_ids = [
            ug.group_id
            for ug in await UserGroup.find(UserGroup.user_id == user_id).to_list()
        ]
        if group_ids:
            role_ids |= {
                gr.role_id
                for gr in await GroupRole.find(
                    GroupRole.group_id.is_in(group_ids)
                ).to_list()
            }

        if not role_ids:
            return False

        return await RolePermission.find(
            RolePermission.permission_id == permission.id,
            RolePermission.role_id.is_in(list(role_ids)),
        ).exists()

    # Management — no HTTP surface yet, used for seeding/tests/future admin tooling.

    async def create_role(self, name: str, description: str | None = None) -> Role:
        existing = await Role.find_one(Role.name == name)
        if existing:
            return existing
        return await Role(name=name, description=description).insert()

    async def create_permission(
        self, name: str, description: str | None = None
    ) -> Permission:
        existing = await Permission.find_one(Permission.name == name)
        if existing:
            return existing
        return await Permission(name=name, description=description).insert()

    async def create_group(self, name: str, description: str | None = None) -> Group:
        existing = await Group.find_one(Group.name == name)
        if existing:
            return existing
        return await Group(name=name, description=description).insert()

    async def grant_permission_to_role(self, role_id: str, permission_id: str) -> None:
        existing = await RolePermission.find_one(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
        if existing:
            return
        await RolePermission(role_id=role_id, permission_id=permission_id).insert()

    async def add_role_to_group(self, group_id: str, role_id: str) -> None:
        existing = await GroupRole.find_one(
            GroupRole.group_id == group_id, GroupRole.role_id == role_id
        )
        if existing:
            return
        await GroupRole(group_id=group_id, role_id=role_id).insert()

    async def assign_role_to_user(self, user_id: str, role_id: str) -> None:
        existing = await UserRole.find_one(
            UserRole.user_id == user_id, UserRole.role_id == role_id
        )
        if existing:
            return
        await UserRole(user_id=user_id, role_id=role_id).insert()

    async def add_user_to_group(self, user_id: str, group_id: str) -> None:
        existing = await UserGroup.find_one(
            UserGroup.user_id == user_id, UserGroup.group_id == group_id
        )
        if existing:
            return
        await UserGroup(user_id=user_id, group_id=group_id).insert()


@lru_cache
def get_authz_service() -> AuthzService:
    return AuthzService()


def require_permission(action: str):
    """FastAPI dependency: resolve the principal and enforce `action`, or raise 403."""

    async def _dependency(
        principal: Annotated[Principal, Depends(require_principal)],
        authz: Annotated[AuthzService, Depends(get_authz_service)],
    ) -> Principal:
        if not await authz.can(principal.user_id, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {action}",
            )
        return principal

    return _dependency
