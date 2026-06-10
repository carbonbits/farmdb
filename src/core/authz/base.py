"""
Authorization port.

`AuthzService` is the interface the application depends on. Open core ships a
permissive single-tenant driver (LocalAuthzService); other drivers (e.g. the
external platform, or an enterprise policy engine) implement the same interface
and are swapped in via the DI container — no call site changes.
"""

from __future__ import annotations

import abc
from dataclasses import dataclass


@dataclass
class AuthzTuple:
    user: str  # e.g. "user:<user_id>"
    relation: str  # e.g. "create_field"
    object: str  # e.g. "user:<user_id>"


class AuthzService(abc.ABC):
    @abc.abstractmethod
    async def can(self, tuple_: AuthzTuple, context: str, context_id: str) -> bool:
        """Return True if the tuple is permitted within the given context."""
        ...
