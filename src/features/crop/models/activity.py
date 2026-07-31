from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from duckling import Document
from pydantic import Field
from ulid import ULID


def _new_ulid() -> str:
    return str(ULID())


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


class Activity(Document):
    id: str = Field(default_factory=_new_ulid)
    actor_id: str
    actor_email: str
    action: str
    entity_type: str
    entity_id: str
    description: str | None = None
    metadata: dict[str, Any] | None = None
    created_at: datetime = Field(default_factory=_now_utc)

    class Settings:
        table_name = 'v1"."activities'
