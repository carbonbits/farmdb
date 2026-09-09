"""
Tests for the one place domain errors become HTTP responses.

The point of the handler is that a feature never registers anything, so the
tests raise errors declared here — errors utils.errors has never heard of — and
check they are answered anyway.
"""

import pytest
from fastapi import FastAPI, status
from httpx import ASGITransport, AsyncClient

from core.errors import (
    Conflict,
    DomainError,
    Invalid,
    NotFound,
    PermissionDenied,
    Unauthenticated,
)
from utils.errors import install_error_handlers, status_for


class Nameless(DomainError):
    """A domain error that forgot to name a kind."""


class MissingCow(NotFound):
    """The sort of error a feature written next year would raise."""


@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (Invalid("bad"), status.HTTP_400_BAD_REQUEST),
        (Unauthenticated("who?"), status.HTTP_401_UNAUTHORIZED),
        (PermissionDenied("no"), status.HTTP_403_FORBIDDEN),
        (NotFound("gone"), status.HTTP_404_NOT_FOUND),
        (Conflict("already"), status.HTTP_409_CONFLICT),
        (MissingCow("no cow 7"), status.HTTP_404_NOT_FOUND),
        (Nameless("?"), status.HTTP_500_INTERNAL_SERVER_ERROR),
    ],
)
def test_status_for_reads_the_kind(error, expected):
    assert status_for(error) == expected


def test_status_for_takes_the_leftmost_kind():
    """An error that inherits two kinds renders as the first one listed."""

    class Both(NotFound, Conflict):
        pass

    assert status_for(Both("x")) == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_handler_answers_an_error_it_was_never_told_about():
    app = FastAPI()
    install_error_handlers(app)

    @app.get("/cows/{cow_id}")
    async def _cow(cow_id: str):
        raise MissingCow(f"No cow with id {cow_id}")

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/cows/7")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    # Same shape HTTPException produces, so clients read one error format.
    assert response.json() == {"detail": "No cow with id 7"}
