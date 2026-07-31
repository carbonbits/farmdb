"""
API key response models.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

# Plaintext API keys are prefixed so the resolver can tell them apart from JWTs.
API_KEY_PREFIX = "fdb_"


class ApiKeyInfo(BaseModel):
    """Non-secret metadata about a key (safe to list)."""

    id: str
    name: str
    prefix: str
    created_at: datetime
    last_used_at: Optional[datetime] = None
    revoked: bool = False


class GeneratedApiKey(BaseModel):
    """Returned once on creation — `key` is the only time the secret is exposed."""

    key: str
    info: ApiKeyInfo
