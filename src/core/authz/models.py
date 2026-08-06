from __future__ import annotations

from datetime import datetime, timezone

from duckling import Document
from pydantic import Field
from ulid import ULID


def _new_ulid() -> str:
    return str(ULID())


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


class Role(Document):
    id: str = Field(default_factory=_new_ulid)
    name: str
    description: str | None = None
    created_at: datetime = Field(default_factory=_now_utc)

    class Settings:
        table_name = 'v1"."roles'


class Permission(Document):
    id: str = Field(default_factory=_new_ulid)
    name: str
    description: str | None = None
    created_at: datetime = Field(default_factory=_now_utc)

    class Settings:
        table_name = 'v1"."permissions'


class RolePermission(Document):
    id: str = Field(default_factory=_new_ulid)
    role_id: str
    permission_id: str
    created_at: datetime = Field(default_factory=_now_utc)

    class Settings:
        table_name = 'v1"."role_permissions'


class Group(Document):
    id: str = Field(default_factory=_new_ulid)
    name: str
    description: str | None = None
    created_at: datetime = Field(default_factory=_now_utc)

    class Settings:
        table_name = 'v1"."groups'


class GroupRole(Document):
    id: str = Field(default_factory=_new_ulid)
    group_id: str
    role_id: str
    created_at: datetime = Field(default_factory=_now_utc)

    class Settings:
        table_name = 'v1"."group_roles'


class UserRole(Document):
    id: str = Field(default_factory=_new_ulid)
    user_id: str
    role_id: str
    created_at: datetime = Field(default_factory=_now_utc)

    class Settings:
        table_name = 'v1"."user_roles'


class UserGroup(Document):
    id: str = Field(default_factory=_new_ulid)
    user_id: str
    group_id: str
    created_at: datetime = Field(default_factory=_now_utc)

    class Settings:
        table_name = 'v1"."user_groups'
