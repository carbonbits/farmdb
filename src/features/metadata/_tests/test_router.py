"""
HTTP tests for the instance metadata endpoint (/v1/metadata).

The endpoint only reports, so the tests come in two halves: what a booted
instance says about itself, and what an instance with no farm id says — which
must be "none", with no id quietly created along the way.
"""

import pytest

from config.settings import settings


@pytest.mark.asyncio
async def test_metadata_requires_authentication(api_client):
    assert (await api_client.get("/v1/metadata")).status_code == 401


@pytest.mark.asyncio
async def test_metadata_reports_the_farm_and_the_build(booted_client):
    from core.config.service import ConfigService

    resp = await booted_client.get("/v1/metadata")
    assert resp.status_code == 200, resp.text
    body = resp.json()

    assert body["farm_id"] == ConfigService().get("farmId")
    assert body["created_at"]
    assert body["version"] == settings.version
    assert body["environment"] == settings.environment.value


@pytest.mark.asyncio
async def test_metadata_reads_the_farm_id_without_creating_one(auth_client):
    """Nothing has booted this instance, so there is no id to report — and the
    GET must not invent one."""
    from core.config.service import ConfigService

    resp = await auth_client.get("/v1/metadata")
    assert resp.status_code == 200, resp.text
    body = resp.json()

    assert body["farm_id"] is None
    assert body["created_at"] is None
    assert ConfigService().get("farmId") is None


@pytest.mark.asyncio
async def test_metadata_measures_the_database_file(booted_client):
    body = (await booted_client.get("/v1/metadata")).json()
    database = body["database"]

    assert database["path"] == settings.database_path
    # Migrated, so there is something on disk; the log may or may not exist yet.
    assert database["size_bytes"] > 0
    assert database["wal_bytes"] is None or database["wal_bytes"] >= 0


@pytest.mark.asyncio
async def test_metadata_survives_a_missing_database_file(booted_client, monkeypatch):
    """A path with no file behind it leaves a gap, not a 500."""
    monkeypatch.setattr(settings, "database_path", "/nonexistent/farm.db")

    body = (await booted_client.get("/v1/metadata")).json()

    assert body["farm_id"]
    assert body["database"] == {
        "path": "/nonexistent/farm.db",
        "size_bytes": None,
        "wal_bytes": None,
    }
