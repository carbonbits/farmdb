import pytest_asyncio
from httpx import ASGITransport, AsyncClient


@pytest_asyncio.fixture
async def auth_client(tmp_path, monkeypatch):
    """An AsyncClient wired to an isolated, migrated DB and a valid bearer token."""
    from config.settings import settings

    monkeypatch.setattr(settings, "database_path", str(tmp_path / "test.db"))

    from core.storage.database import DB
    from core.storage.migrations.runner import apply_migrations

    DB.disconnect()
    DB.connect()
    apply_migrations(DB.get_connection())

    # Seed a user and mint an access token for it.
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

    DB.disconnect()
