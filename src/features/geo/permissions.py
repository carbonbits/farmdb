"""
Permission check for the geo handlers.

The fields router can pin a fixed permission with require_permission, but geo
cannot: the permission depends on the layer, which is only known from the
request body or the stored row. So the router authenticates the caller with
require_principal, and the handler checks the layer's permission here, using
the same AuthzService.can that require_permission uses under the hood.
"""
from __future__ import annotations

from fastapi import HTTPException, status

from core.authz.service import AuthzService


async def ensure_permission(
    authz: AuthzService, user_id: str, permission: str
) -> None:
    """Raise 403 unless the user holds `permission`."""
    if not await authz.can(user_id, permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: {permission}",
        )
