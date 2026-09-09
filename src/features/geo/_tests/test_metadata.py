"""
HTTP tests for the discovery documents: landing page, conformance, collections.

These are what lets a client find its way around /v1/maps without being told
what is there, so the tests follow the same path a client would: land, read the
links, list the collections, look one up.
"""

import pytest

POLYGON = {
    "type": "Polygon",
    "coordinates": [
        [[36.80, -1.29], [36.80, -1.28], [36.81, -1.28], [36.81, -1.29], [36.80, -1.29]]
    ],
}


async def _strip_admin() -> None:
    from core.authz.models import Role, UserRole

    role = await Role.find_one(Role.name == "administrator")
    await UserRole.find(UserRole.role_id == role.id).delete()


def _rels(links: list[dict]) -> set[str]:
    return {link["rel"] for link in links}


@pytest.mark.asyncio
async def test_landing_page_requires_authentication(api_client):
    resp = await api_client.get("/v1/maps/")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_landing_page_links_to_the_rest(auth_client):
    resp = await auth_client.get("/v1/maps/")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert {"self", "conformance", "data", "service-desc"} <= _rels(body["links"])

    # Every link is absolute, so a client can follow it as given.
    assert all(link["href"].startswith("http") for link in body["links"])


@pytest.mark.asyncio
async def test_conformance_lists_classes(auth_client):
    resp = await auth_client.get("/v1/maps/conformance")
    assert resp.status_code == 200
    classes = resp.json()["conformsTo"]
    assert "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson" in classes


@pytest.mark.asyncio
async def test_collections_describe_the_registry(auth_client):
    resp = await auth_client.get("/v1/maps/collections")
    assert resp.status_code == 200, resp.text
    collections = {c["id"]: c for c in resp.json()["collections"]}
    assert {"fields", "infrastructure", "markers"} == set(collections)

    fields = collections["fields"]
    assert fields["itemType"] == "feature"
    assert fields["geometryType"] == "POLYGON"
    assert fields["seasonal"] is False
    assert {"self", "items"} <= _rels(fields["links"])
    # Nothing stored yet, so there is no extent to report.
    assert fields["extent"]["spatial"] is None


@pytest.mark.asyncio
async def test_collection_extent_follows_the_data(auth_client):
    await auth_client.post(
        "/v1/maps/collections/fields/items", json={"geometry": POLYGON}
    )

    resp = await auth_client.get("/v1/maps/collections/fields")
    assert resp.status_code == 200
    bbox = resp.json()["extent"]["spatial"]["bbox"][0]
    assert bbox == pytest.approx([36.80, -1.29, 36.81, -1.28])


@pytest.mark.asyncio
async def test_unknown_collection_is_404(auth_client):
    resp = await auth_client.get("/v1/maps/collections/spaceships")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_collections_hide_what_the_caller_cannot_view(auth_client):
    await _strip_admin()

    listed = await auth_client.get("/v1/maps/collections")
    assert listed.status_code == 200
    assert listed.json()["collections"] == []

    # Asking for one directly is still a refusal rather than a silent empty.
    resp = await auth_client.get("/v1/maps/collections/fields")
    assert resp.status_code == 403
