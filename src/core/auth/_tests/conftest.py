import pytest_asyncio
from duckling import init_duckling_sync
from httpx import ASGITransport, AsyncClient


@pytest_asyncio.fixture
async def api_client(tmp_path, monkeypatch):
    """Plain client on an isolated, migrated DB.

    No bearer token is attached: the auth-router tests drive the full
    credential lifecycle themselves (register/login issue their own tokens),
    and the httpx cookie jar persists the httpOnly access cookie across
    requests just like a browser would.
    """
    from config.settings import settings

    monkeypatch.setattr(settings, "database_path", str(tmp_path / "test.db"))

    from core.storage.database import DB
    from core.storage.migrations.runner import apply_migrations

    DB.disconnect()
    DB.connect()
    apply_migrations(DB.get_connection())
    # ASGITransport doesn't run lifespan, so wire Duckling here.
    init_duckling_sync(connection=DB.get_connection())

    from main import application

    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        yield client

    DB.disconnect()
