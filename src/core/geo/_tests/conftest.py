import pytest

# An outline with room around the shapes the tests draw, which all sit near
# 36.80E 1.29S. Every contained layer is measured against this, so a test that
# wants to store a field asks for the `farm` fixture first — the same order an
# install does it in, because there is nowhere to put a field until the farm has
# an edge.
FARM = {
    "type": "Polygon",
    "coordinates": [
        [[36.79, -1.30], [36.79, -1.27], [36.82, -1.27], [36.82, -1.30], [36.79, -1.30]]
    ],
}


@pytest.fixture
def farm(geo):
    """The farm outline drawn, and the configuration pointing at it."""
    return geo.create(layer="farm", geometry=FARM)


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
