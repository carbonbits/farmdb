"""
Fixtures for the metadata tests.

The shared client fixtures migrate a database but never run the app's lifespan,
so on them nothing has minted a farm id. `booted_client` writes it the way
startup does — the state every real request arrives in — leaving the plain
`auth_client` to stand for an instance that has not booted.
"""

import pytest_asyncio
from ulid import ULID


@pytest_asyncio.fixture
async def booted_client(auth_client):
    """An authenticated client on an instance whose farm id has been minted."""
    from core.config.service import ConfigService

    ConfigService().set("farmId", str(ULID()))

    yield auth_client
