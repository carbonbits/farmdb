"""
Open-core authorization driver.

Single-tenant: the authenticated principal owns their data, so every check is
allowed. Enterprise builds register a real policy-engine driver against the same
AuthzService interface (see PlatformAuthzService for the shape of an alternative).
"""

from __future__ import annotations

from wireup import injectable

from core.authz.base import AuthzService, AuthzTuple


@injectable(as_type=AuthzService)
class LocalAuthzService(AuthzService):
    async def can(self, tuple_: AuthzTuple, context: str, context_id: str) -> bool:
        return True
