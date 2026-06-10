"""
API key store port and response models.

`ApiKeyStore` is the injectable interface for issuing, verifying, listing, and
revoking account API keys. Open core ships a DuckDB-backed driver; enterprise can
swap in its own (e.g. a central key service) via the container.
"""

from __future__ import annotations

import abc
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


class ApiKeyStore(abc.ABC):
    @abc.abstractmethod
    def create(self, user_id: str, name: str) -> GeneratedApiKey:
        """Issue a new key for the user and return the one-time plaintext + metadata."""
        ...

    @abc.abstractmethod
    def verify(self, plaintext: str) -> Optional[str]:
        """Return the owning user_id for a valid, non-revoked key, else None."""
        ...

    @abc.abstractmethod
    def list_for_user(self, user_id: str) -> list[ApiKeyInfo]:
        """List a user's keys (metadata only)."""
        ...

    @abc.abstractmethod
    def revoke(self, user_id: str, key_id: str) -> bool:
        """Revoke one of the user's keys. Return False if it wasn't found."""
        ...
