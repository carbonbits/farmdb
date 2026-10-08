"""The shared start-up that the API and the CLI both run before any work."""

import pytest

from config.settings import settings
from core.config.service import ConfigService
from core.startup import start_core, stop_core
from core.storage.database import DB
from core.storage.migrations.runner import apply_migrations


@pytest.fixture
def migrated_database(tmp_path, monkeypatch):
    """An isolated database with every migration applied, closed again."""
    monkeypatch.setattr(settings, "database_path", str(tmp_path / "test.db"))
    DB.disconnect()
    DB.connect()
    apply_migrations(DB.get_connection())
    DB.disconnect()
    yield
    DB.disconnect()


@pytest.mark.asyncio
async def test_start_core_gives_the_farm_an_id(migrated_database):
    await start_core()
    farm_id = ConfigService().get("farmId")
    stop_core()

    assert farm_id


@pytest.mark.asyncio
async def test_start_core_keeps_the_same_farm_id(migrated_database):
    await start_core()
    first_farm_id = ConfigService().get("farmId")
    stop_core()

    await start_core()
    second_farm_id = ConfigService().get("farmId")
    stop_core()

    assert second_farm_id == first_farm_id
