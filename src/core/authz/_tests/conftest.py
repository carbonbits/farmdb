import pytest_asyncio
from duckling import init_duckling_sync


@pytest_asyncio.fixture
async def migrated_db(tmp_path, monkeypatch):
    """An isolated, migrated database with duckling bound to it."""
    from config.settings import settings

    monkeypatch.setattr(settings, "database_path", str(tmp_path / "test.db"))

    from core.storage.database import DB
    from core.storage.migrations.runner import apply_migrations

    DB.disconnect()
    DB.connect()
    apply_migrations(DB.get_connection())
    init_duckling_sync(connection=DB.get_connection())

    yield

    DB.disconnect()
