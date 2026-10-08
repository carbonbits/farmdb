"""The demo seed fills a demo instance once and leaves it alone after."""

import pytest
import pytest_asyncio

from config.settings import settings
from core.auth.service import AuthService
from core.authz.service import AuthzService
from core.startup import start_core, stop_core
from core.storage.database import DB, db
from core.storage.migrations.runner import apply_migrations
from features.demo import data
from features.demo.errors import DemoSeedRefused
from features.demo.seed import seed_demo

DEMO_PASSWORD = "demo-password-for-tests"


@pytest_asyncio.fixture
async def demo_instance(tmp_path, monkeypatch):
    """A migrated, started instance marked as a demo."""
    monkeypatch.setattr(settings, "database_path", str(tmp_path / "test.db"))
    monkeypatch.setattr(settings, "demo", True)
    monkeypatch.setattr(settings, "demo_password", DEMO_PASSWORD)
    DB.disconnect()
    DB.connect()
    apply_migrations(DB.get_connection())
    DB.disconnect()
    await start_core()
    yield
    stop_core()


# Whole queries, picked by name, so no SQL is ever built from text.
ROW_COUNT_QUERIES = {
    "users": "SELECT count(*) FROM v1.users",
    "fields": "SELECT count(*) FROM v1.fields",
    "crops": "SELECT count(*) FROM v1.crops",
    "geospatial": "SELECT count(*) FROM v1.geospatial",
    "activities": "SELECT count(*) FROM v1.activities",
}


def count_rows(table: str) -> int:
    return db().execute(ROW_COUNT_QUERIES[table]).fetchone()[0]


@pytest.mark.asyncio
async def test_refuses_when_not_a_demo(demo_instance, monkeypatch):
    monkeypatch.setattr(settings, "demo", False)
    with pytest.raises(DemoSeedRefused):
        await seed_demo()
    assert count_rows("users") == 0


@pytest.mark.asyncio
async def test_refuses_without_a_password(demo_instance, monkeypatch):
    monkeypatch.setattr(settings, "demo_password", None)
    with pytest.raises(DemoSeedRefused):
        await seed_demo()
    assert count_rows("users") == 0


@pytest.mark.asyncio
async def test_seeds_accounts_with_their_roles(demo_instance):
    await seed_demo()

    auth = AuthService()
    authz = AuthzService()
    for account in data.ACCOUNTS:
        user = auth.get_user_by_email(account.email)
        assert user is not None
        role_names = [role["name"] for role in authz.get_user_roles(user.id)]
        assert account.role in role_names
        assert auth.verify_password(user.id, DEMO_PASSWORD)


@pytest.mark.asyncio
async def test_seeds_the_farm(demo_instance):
    summary = await seed_demo()

    assert count_rows("fields") == len(data.FIELDS)
    assert count_rows("crops") == len(data.CROPS)
    assert "farm outline" in summary.created


@pytest.mark.asyncio
async def test_running_twice_creates_nothing_new(demo_instance):
    await seed_demo()
    counts_after_first_run = {
        table: count_rows(table)
        for table in ("users", "fields", "crops", "geospatial", "activities")
    }

    summary = await seed_demo()

    counts_after_second_run = {
        table: count_rows(table) for table in counts_after_first_run
    }
    assert counts_after_second_run == counts_after_first_run
    assert summary.created == []
