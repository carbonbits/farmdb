"""
Principal resolution.

`PrincipalResolver` is the injectable port that turns an incoming request into a
Principal, regardless of credential type. The open-core driver understands bearer
JWTs and session cookies; API keys are recognised but not yet backed by a store.
Enterprise builds can register a different resolver (e.g. SSO/OIDC) via the
container without touching call sites.

`require_principal` is the FastAPI dependency endpoints use; it pulls the resolver
from the app container and raises 401 when no valid credential is present.
"""

from __future__ import annotations

import abc
from typing import Optional

from fastapi import HTTPException, Request, status
from wireup import injectable
from wireup.integration.fastapi import get_app_container

from core.auth.apikeys.base import API_KEY_PREFIX, ApiKeyStore
from core.auth.cookies import ACCESS_COOKIE_NAME
from core.auth.principal import Principal
from core.auth.service import AuthService


class PrincipalResolver(abc.ABC):
    @abc.abstractmethod
    async def resolve(self, request: Request) -> Optional[Principal]:
        """Resolve the calling principal, or None if unauthenticated."""
        ...


@injectable(as_type=PrincipalResolver)
class DefaultPrincipalResolver(PrincipalResolver):
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


async def require_principal(request: Request) -> Principal:
    """FastAPI dependency: resolve the principal or raise 401."""
    container = get_app_container(request.app)
    resolver = await container.get(PrincipalResolver)

    principal = await resolver.resolve(request)
    if principal is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return principal
