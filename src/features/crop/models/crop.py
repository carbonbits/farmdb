from __future__ import annotations

from datetime import datetime, timezone

import strawberry
from duckling import Document
from pydantic import Field
from ulid import ULID


def _new_ulid() -> str:
    return str(ULID())


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


class Crop(Document):
    id: str = Field(default_factory=_new_ulid)
    field_id: str | None = None
    name: str
    variety: str | None = None
    description: str | None = None
    created_by: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=_now_utc)
    updated_at: datetime = Field(default_factory=_now_utc)

    class Settings:
        # Renders as "v1"."crops" so Duckling addresses the schema-qualified
        # table managed by the migration runner.
        table_name = 'v1"."crops'


@strawberry.experimental.pydantic.type(model=Crop, all_fields=True)
class CropType:
    pass
