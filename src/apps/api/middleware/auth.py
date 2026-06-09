"""
Authorization gate for REST endpoints.

A coarse, path-based check applied at the application entrypoint: if a request
targets a protected prefix, it must carry an Authorization header. Per-endpoint
token verification and user resolution happen in the endpoints themselves.

To protect more endpoints later, add their path prefixes to PROTECTED_PREFIXES.
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

# REST path prefixes that require an Authorization header.
PROTECTED_PREFIXES = ("/v1/fields",)


class AuthHeaderMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        if path.startswith(PROTECTED_PREFIXES) and not request.headers.get("authorization"):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Not authenticated"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        return await call_next(request)
