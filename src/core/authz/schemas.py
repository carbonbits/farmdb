"""Request/response models for the Access-control admin API (/v1/authz)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PermissionOut(BaseModel):
    name: str
    group: str | None = None
    description: str | None = None


class RoleSummary(BaseModel):
    id: str
    name: str
    display_name: str | None = None
    description: str | None = None
    is_system: bool = False
    is_locked: bool = False
    permissions: list[str] = Field(default_factory=list)
    member_count: int = 0


class RoleMember(BaseModel):
    id: str
    email: str
    display_name: str | None = None


class RoleDetail(RoleSummary):
    members: list[RoleMember] = Field(default_factory=list)


class CreateRoleRequest(BaseModel):
    name: str
    display_name: str | None = None
    description: str | None = None
    permissions: list[str] = Field(default_factory=list)


class SetPermissionsRequest(BaseModel):
    permissions: list[str] = Field(default_factory=list)


class UserRoleRef(BaseModel):
    id: str
    name: str
    display_name: str | None = None


class UserWithRoles(BaseModel):
    id: str
    email: str
    display_name: str | None = None
    is_active: bool = True
    roles: list[UserRoleRef] = Field(default_factory=list)
