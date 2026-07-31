"""
Principal resolution.

`PrincipalResolver` turns an incoming request into a Principal, regardless of
credential type: bearer JWTs, session cookies, or API keys.

`require_principal` is the FastAPI dependency endpoints use; it raises 401
when no valid credential is present.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, Request, status

from core.auth.apikeys.base import API_KEY_PREFIX
from core.auth.apikeys.store import ApiKeyStore, get_api_key_store
from core.auth.cookies import ACCESS_COOKIE_NAME
from core.auth.principal import Principal
from core.auth.service import AuthService


class PrincipalResolver:
    def __init__(self, api_keys: ApiKeyStore) -> None:
        self._auth = AuthService()
        self._api_keys = api_keys

    async def resolve(self, request: Request) -> Optional[Principal]:
        token, method = self._extract_credential(request)
        if not token:
            return None

        if token.startswith(API_KEY_PREFIX):
            return self._principal_from_api_key(token)

        return self._principal_from_jwt(token, method)

    def _principal_from_api_key(self, token: str) -> Optional[Principal]:
        user_id = self._api_keys.verify(token)
        if not user_id:
            return None

        return self._principal_for_user(user_id, "api_key")

    def _extract_credential(self, request: Request) -> tuple[Optional[str], str]:
        header = request.headers.get("authorization")
        if header and header.lower().startswith("bearer "):
            return header[7:].strip(), "bearer"

        cookie = request.cookies.get(ACCESS_COOKIE_NAME)
        if cookie:
            return cookie, "cookie"

        return None, ""

    def _principal_from_jwt(self, token: str, method: str) -> Optional[Principal]:
        payload = self._auth.verify_access_token(token)
        if not payload:
            return None

        return self._principal_for_user(payload["sub"], method)

    def _principal_for_user(self, user_id: str, method: str) -> Optional[Principal]:
        user = self._auth.get_user_by_id(user_id)
        if not user or not user.is_active:
            return None

        return Principal(user_id=user.id, email=user.email, auth_method=method)


@lru_cache
def get_principal_resolver() -> PrincipalResolver:
    return PrincipalResolver(get_api_key_store())


async def require_principal(
    request: Request,
    resolver: Annotated[PrincipalResolver, Depends(get_principal_resolver)],
) -> Principal:
    """FastAPI dependency: resolve the principal or raise 401."""
    principal = await resolver.resolve(request)
    if principal is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return principal
