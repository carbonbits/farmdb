import pytest


@pytest.fixture
def geo(tmp_path, monkeypatch):
    """A GeospatialService over an isolated, migrated database.

    No HTTP: the point of the split is that the store works without FastAPI, so
    the tests reach it the way a CLI command would. Duckling is bound because
    the store stamps each shape with the farmId, and ConfigService reads that
    through a Document — the one thing here that needs a session.
    """
    from config.settings import settings

    monkeypatch.setattr(settings, "database_path", str(tmp_path / "test.db"))

    from duckling import init_duckling_sync

    from core.storage.database import DB
    from core.storage.migrations.runner import apply_migrations

    DB.disconnect()
    DB.connect()
    apply_migrations(DB.get_connection())
    init_duckling_sync(connection=DB.get_connection())

    from core.geo.service import GeospatialService

    yield GeospatialService()

    DB.disconnect()
