"""
Where domain errors become HTTP responses.

Registered once on the app. Services raise the kinds in core.errors, this turns
them into status codes, and no handler has to remember to translate: every route
in every feature answers the same way, including routes nobody has written yet.
"""

from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from core.errors import (
    Conflict,
    DomainError,
    Invalid,
    NotFound,
    PermissionDenied,
    Unauthenticated,
)

# Keyed by the kinds in core.errors, never by the concrete errors features raise.
# That is the whole point of the indirection: a feature adds an error by
# subclassing a kind, and this table stays the length it is.
_STATUS: dict[type[DomainError], int] = {
    Invalid: status.HTTP_400_BAD_REQUEST,
    Unauthenticated: status.HTTP_401_UNAUTHORIZED,
    PermissionDenied: status.HTTP_403_FORBIDDEN,
    NotFound: status.HTTP_404_NOT_FOUND,
    Conflict: status.HTTP_409_CONFLICT,
}


def status_for(exc: Exception) -> int:
    """
    The status code for an error, taken from the nearest kind it inherits.

    Walking the MRO is what lets an error be both specific and answerable:
    core.geo's UnknownLayer is a GeoError for callers that catch geo failures as
    a group, and a NotFound for us. An error that inherits two kinds gets the
    first one Python resolves, which is the leftmost base — so list the kind you
    want rendered first.
    """
    for ancestor in type(exc).__mro__:
        if ancestor in _STATUS:
            return _STATUS[ancestor]
    # A DomainError naming no kind is a bug in whatever raised it, not bad input.
    return status.HTTP_500_INTERNAL_SERVER_ERROR


async def _handle(request: Request, exc: Exception) -> JSONResponse:
    # The detail key matches what HTTPException produces, so a client sees one
    # error shape whether the failure came from a service or from a route.
    return JSONResponse(status_code=status_for(exc), content={"detail": str(exc)})


def install_error_handlers(app: FastAPI) -> None:
    """Teach the app to answer every DomainError, present and future."""
    # Starlette looks handlers up along the exception's MRO, so registering the
    # base catches every subclass without enumerating them.
    app.add_exception_handler(DomainError, _handle)
