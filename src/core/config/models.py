"""
The v1.configuration row.

The table is keyed by `key`, not by an `id` column, so the primary key field is
aliased onto it: duckling reads `Field(alias=...)` when it builds the WHERE
clause, and `self.id` addresses the `key` column. That is what lets this table
be a Document at all without a migration to reshape it.
"""

from datetime import datetime
from typing import Optional

from duckling import Document
from pydantic import Field

from utils.time import now_utc


class Configuration(Document):
    id: str = Field(alias="key")
    value: Optional[str] = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    created_by: Optional[str] = None

    class Settings:
        table_name = 'v1"."configuration'
