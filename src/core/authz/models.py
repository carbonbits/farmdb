from __future__ import annotations

from datetime import datetime

from duckling import Document
from pydantic import Field
from ulid import ULID

from utils.time import now_utc


class Role(Document):
    id: str = Field(default_factory=lambda: str(ULID()))
    name: str
    description: str | None = None
    created_at: datetime = Field(default_factory=now_utc)
    display_name: str | None = None
    is_system: bool = False
    is_locked: bool = False

    class Settings:
        table_name = 'v1"."roles'


class Permission(Document):
    id: str = Field(default_factory=lambda: str(ULID()))
    name: str
    description: str | None = None
    created_at: datetime = Field(default_factory=now_utc)
    group_name: str | None = None

    class Settings:
        table_name = 'v1"."permissions'


class RolePermission(Document):
    id: str = Field(default_factory=lambda: str(ULID()))
    role_id: str
    permission_id: str
    created_at: datetime = Field(default_factory=now_utc)

    class Settings:
        table_name = 'v1"."role_permissions'


class Group(Document):
    id: str = Field(default_factory=lambda: str(ULID()))
    name: str
    description: str | None = None
    created_at: datetime = Field(default_factory=now_utc)

    class Settings:
        table_name = 'v1"."groups'


class GroupRole(Document):
    id: str = Field(default_factory=lambda: str(ULID()))
    group_id: str
    role_id: str
    created_at: datetime = Field(default_factory=now_utc)

    class Settings:
        table_name = 'v1"."group_roles'


class UserRole(Document):
    id: str = Field(default_factory=lambda: str(ULID()))
    user_id: str
    role_id: str
    created_at: datetime = Field(default_factory=now_utc)

    class Settings:
        table_name = 'v1"."user_roles'


class UserGroup(Document):
    id: str = Field(default_factory=lambda: str(ULID()))
    user_id: str
    group_id: str
    created_at: datetime = Field(default_factory=now_utc)

    class Settings:
        table_name = 'v1"."user_groups'
