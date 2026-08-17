from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    display_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime


class UserPublic(BaseModel):
    id: str
    email: str
    display_name: Optional[str] = None
    is_active: bool
    is_verified: bool


class RoleRef(BaseModel):
    id: str
    name: str
    display_name: Optional[str] = None


class UserMe(UserPublic):
    """`/me` payload — the public user plus the roles they hold and their
    effective permission names, so the client can show or hide features."""

    roles: list[RoleRef] = Field(default_factory=list)
    permissions: list[str] = Field(default_factory=list)
