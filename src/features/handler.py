"""
The base every feature handler extends.

A feature handler is one request's worth of work: the router resolves transport
concerns — path, body, dependencies — and hands them here, so the rules stay
readable and testable without a client. That makes this a different tier from
core/handler.py, whose handlers are pieces of a service's own machinery and are
constructed by that service; this one is constructed per request by a route.

It carries the AuthzService, because authorization is the one dependency every
feature handler shares. Geo cannot pin a fixed permission with
require_permission the way the field router does — the permission depends on
the layer, which is only known once the request is read — so the check happens
inside the handler, and `require` is the single place it goes through. Keeping
the service on the base means a handler asks for the permission it needs and
nothing else plumbs authz through call after call.

The user id stays an argument rather than a second field: handlers reach it as
a Principal, and some as a bare user_id already resolved upstream, so `require`
takes whichever the caller holds.
"""

from abc import abstractmethod

from core.authz.service import AuthzService
from core.handler import Handler
from features.geo.permissions import ensure_permission


class FeatureHandler(Handler):
    def __init__(self, authz: AuthzService) -> None:
        super().__init__()
        self._authz = authz

    @property
    @abstractmethod
    def handler_signature(self) -> str:
        """Each handler must define its unique signature."""
        ...

    async def require(self, user_id: str, permission: str) -> None:
        """Raise 403 unless the user holds `permission`."""
        await ensure_permission(self._authz, user_id, permission)
