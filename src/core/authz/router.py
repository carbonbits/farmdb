"""
Access-control admin API.

The full RBAC surface the settings UI drives: read the permission catalog,
list/create roles, edit a role's permission set, and assign/revoke roles on
users. Every endpoint is gated by the `roles.manage` permission (held by the
seeded owner role), so a single dependency both authenticates and authorizes.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from core.auth.principal import Principal
from core.authz.schemas import (
    CreateRoleRequest,
    PermissionOut,
    RoleDetail,
    RoleSummary,
    SetPermissionsRequest,
    UserWithRoles,
)
from core.authz.service import AuthzService, get_authz_service, require_permission

router = APIRouter(prefix="/v1/authz", tags=["authz"])

# One gate for the whole router: authenticate + require roles.manage.
ManageDep = Annotated[Principal, Depends(require_permission("roles.manage"))]
AuthzDep = Annotated[AuthzService, Depends(get_authz_service)]


@router.get("/permissions", response_model=list[PermissionOut])
async def list_permissions(_: ManageDep, authz: AuthzDep) -> list[PermissionOut]:
    """The full permission catalog, grouped for display."""
    return [PermissionOut(**p) for p in authz.list_permissions()]


@router.get("/roles", response_model=list[RoleSummary])
async def list_roles(_: ManageDep, authz: AuthzDep) -> list[RoleSummary]:
    """Every role with its permission keys and member count."""
    return [RoleSummary(**r) for r in authz.list_roles()]


@router.get("/roles/{role_id}", response_model=RoleDetail)
async def get_role(role_id: str, _: ManageDep, authz: AuthzDep) -> RoleDetail:
    role = authz.get_role(role_id)
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Role not found")
    return RoleDetail(**role)


@router.post("/roles", response_model=RoleDetail, status_code=status.HTTP_201_CREATED)
async def create_role(
    request: CreateRoleRequest, _: ManageDep, authz: AuthzDep
) -> RoleDetail:
    """Create a custom role with an initial permission set."""
    if authz.get_role_by_name(request.name):
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail=f"A role named '{request.name}' already exists"
        )
    role = await authz.create_role(
        name=request.name,
        description=request.description,
        display_name=request.display_name,
    )
    await authz.set_role_permissions(role.id, request.permissions)
    return RoleDetail(**authz.get_role(role.id))


@router.put("/roles/{role_id}/permissions", response_model=RoleDetail)
async def set_role_permissions(
    role_id: str, request: SetPermissionsRequest, _: ManageDep, authz: AuthzDep
) -> RoleDetail:
    """Replace a role's permission set. System/locked roles cannot be edited."""
    role = authz.get_role(role_id)
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Role not found")
    if role["is_locked"]:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="This is a system role. Duplicate it to make an editable copy.",
        )
    await authz.set_role_permissions(role_id, request.permissions)
    return RoleDetail(**authz.get_role(role_id))


@router.get("/users", response_model=list[UserWithRoles])
async def list_users(_: ManageDep, authz: AuthzDep) -> list[UserWithRoles]:
    """All users and the roles they directly hold."""
    return [UserWithRoles(**u) for u in authz.list_users_with_roles()]


@router.post(
    "/users/{user_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def assign_role(
    user_id: str, role_id: str, _: ManageDep, authz: AuthzDep
) -> None:
    """Grant a role to a user (idempotent)."""
    if authz.get_role(role_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Role not found")
    await authz.assign_role_to_user(user_id, role_id)


@router.delete(
    "/users/{user_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def revoke_role(
    user_id: str, role_id: str, _: ManageDep, authz: AuthzDep
) -> None:
    """Revoke a role from a user (leaves their other roles untouched)."""
    await authz.remove_role_from_user(user_id, role_id)
