from __future__ import annotations

from datetime import datetime
from typing import Any

from duckling import Document
from pydantic import Field
from ulid import ULID

from utils.time import now_utc


class Activity(Document):
    id: str = Field(default_factory=lambda: str(ULID()))
    actor_id: str
    actor_email: str
    action: str
    entity_type: str
    entity_id: str
    description: str | None = None
    metadata: dict[str, Any] | None = None
    created_at: datetime = Field(default_factory=now_utc)

    class Settings:
        table_name = 'v1"."activities'
