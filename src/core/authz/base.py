"""
Authorization check — placeholder pending RBAC.

Permissive stub: every check is allowed. To be replaced with a DuckDB-backed
RBAC implementation (roles/permissions tables) later; `can()`'s signature is
kept plain (user_id + action) rather than modeling relationship tuples, so
that swap doesn't require touching call sites.
"""

from __future__ import annotations

from functools import lru_cache


class AuthzService:
    async def can(self, user_id: str, action: str) -> bool:
        return True


@lru_cache
def get_authz_service() -> AuthzService:
    return AuthzService()
