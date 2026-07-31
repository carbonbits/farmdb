import pytest_asyncio
from duckling import init_duckling_sync
from httpx import ASGITransport, AsyncClient


def _setup_db(tmp_path, monkeypatch):
    """Point the app at an isolated, migrated database."""
    from config.settings import settings

    monkeypatch.setattr(settings, "database_path", str(tmp_path / "test.db"))

    from core.storage.database import DB
    from core.storage.migrations.runner import apply_migrations

    DB.disconnect()
    DB.connect()
    apply_migrations(DB.get_connection())
    # ASGITransport doesn't run lifespan, so wire Duckling here.
    init_duckling_sync(connection=DB.get_connection())


@pytest_asyncio.fixture
async def auth_client(tmp_path, monkeypatch):
    """Client with a valid bearer token against an isolated, migrated DB."""
    _setup_db(tmp_path, monkeypatch)

    from core.auth.service import AuthService

    auth_service = AuthService()
    user = auth_service.create_user(email="tester@example.com", display_name="Tester")
    access_token, _refresh, _expires = auth_service.create_tokens(user)

    from main import application

    async with AsyncClient(
        transport=ASGITransport(app=application),
        base_url="http://test",
        headers={"Authorization": f"Bearer {access_token}"},
    ) as client:
        yield client

    from core.storage.database import DB

    DB.disconnect()


@pytest_asyncio.fixture
async def api_client(tmp_path, monkeypatch):
    """Plain client on a migrated DB — no bearer; cookies persist across requests."""
    _setup_db(tmp_path, monkeypatch)

    from main import application

    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        yield client

    from core.storage.database import DB

    DB.disconnect()
