"""
Response models for the instance metadata endpoint (/v1/metadata).

The document is a bag of facts about this deployment, so it grows by adding a
field with a sensible absent value rather than by reshaping what is already
there. Every field is therefore optional: a client written against today's
response keeps working, and one written against tomorrow's can ask for a field
an older server does not report yet.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from config.settings import Environment


class DatabaseMetadata(BaseModel):
    """Where the embedded database lives and what it costs on disk."""

    path: Optional[str] = None
    size_bytes: Optional[int] = None
    wal_bytes: Optional[int] = None


class FarmMetadata(BaseModel):
    """What this instance is, what it runs, and how big it has grown."""

    # Written once at startup and read back here, never minted on the way out —
    # null says this instance has no id yet, which is worth seeing as null.
    farm_id: Optional[str] = None
    created_at: Optional[datetime] = None
    version: Optional[str] = None
    environment: Optional[Environment] = None
    database: Optional[DatabaseMetadata] = None
