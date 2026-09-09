"""
HTTP tests for the item routes under /v1/maps/collections/{cid}/items.

Covers the auth gate, CRUD round-trips for polygon/point/line, geometry
validation, the season-ignore behaviour of season-less collections, addressing
an item through the wrong collection, and the per-collection permission gates.
Uses the shared auth_client / api_client fixtures (see features/conftest.py);
auth_client is the first user in an isolated DB, so it holds the all-access
administrator role until a test strips it.
"""

import pytest

# Valid geometries, one per geometry class we support.
POLYGON = {
    "type": "Polygon",
    "coordinates": [
        [[36.80, -1.29], [36.80, -1.28], [36.81, -1.28], [36.81, -1.29], [36.80, -1.29]]
    ],
}
POINT = {"type": "Point", "coordinates": [36.80, -1.29]}
LINE = {"type": "LineString", "coordinates": [[36.80, -1.29], [36.81, -1.28]]}
# Self-intersecting ring: valid JSON, invalid geometry.
BOWTIE = {
    "type": "Polygon",
    "coordinates": [[[0, 0], [1, 1], [1, 0], [0, 1], [0, 0]]],
}


def items(collection: str) -> str:
    return f"/v1/maps/collections/{collection}/items"


def item(collection: str, feature_id: str) -> str:
    return f"{items(collection)}/{feature_id}"


async def _strip_admin() -> None:
    """Remove the tester's administrator grant so a denial can be tested."""
    from core.authz.models import Role, UserRole

    role = await Role.find_one(Role.name == "administrator")
    await UserRole.find(UserRole.role_id == role.id).delete()


# --- auth gate ---------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_requires_authentication(api_client):
    resp = await api_client.post(items("fields"), json={"geometry": POLYGON})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_list_requires_authentication(api_client):
    resp = await api_client.get(items("fields"))
    assert resp.status_code == 401


# --- create round-trips, one per geometry class ------------------------------


@pytest.mark.asyncio
async def test_create_and_get_polygon(auth_client):
    created = await auth_client.post(
        items("fields"), json={"geometry": POLYGON, "properties": {"name": "A1"}}
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["type"] == "Feature"
    assert body["layer"] == "fields"
    assert body["geometry"]["type"] == "Polygon"
    assert body["properties"] == {"name": "A1"}
    # GeoJSON responses say so, so a GeoJSON client can trust the payload.
    assert created.headers["content-type"].startswith("application/geo+json")
    feature_id = body["id"]

    fetched = await auth_client.get(item("fields", feature_id))
    assert fetched.status_code == 200
    assert fetched.json()["id"] == feature_id


@pytest.mark.asyncio
async def test_create_point_marker(auth_client):
    resp = await auth_client.post(items("markers"), json={"geometry": POINT})
    assert resp.status_code == 201, resp.text
    assert resp.json()["geometry"]["type"] == "Point"


@pytest.mark.asyncio
async def test_create_line_infrastructure(auth_client):
    resp = await auth_client.post(items("infrastructure"), json={"geometry": LINE})
    assert resp.status_code == 201, resp.text
    assert resp.json()["geometry"]["type"] == "LineString"


@pytest.mark.asyncio
async def test_body_may_not_name_a_collection(auth_client):
    # The collection is in the path; a body that also names one is a mistake.
    resp = await auth_client.post(
        items("fields"), json={"layer": "markers", "geometry": POLYGON}
    )
    assert resp.status_code == 422


# --- validation --------------------------------------------------------------


@pytest.mark.asyncio
async def test_geometry_class_must_match_collection(auth_client):
    # A point into the polygon-only fields collection is rejected.
    resp = await auth_client.post(items("fields"), json={"geometry": POINT})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_invalid_polygon_rejected_and_not_stored(auth_client):
    resp = await auth_client.post(items("fields"), json={"geometry": BOWTIE})
    assert resp.status_code == 400
    # Nothing persisted on failure.
    listed = await auth_client.get(items("fields"))
    assert listed.json()["features"] == []


@pytest.mark.asyncio
async def test_unknown_collection_is_404(auth_client):
    # The collection is part of the path now, so an unknown one is not found
    # rather than a bad request.
    resp = await auth_client.post(items("spaceships"), json={"geometry": POINT})
    assert resp.status_code == 404

    listed = await auth_client.get(items("spaceships"))
    assert listed.status_code == 404


@pytest.mark.asyncio
async def test_get_missing_returns_404(auth_client):
    resp = await auth_client.get(item("fields", "does-not-exist"))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_item_is_only_reachable_through_its_own_collection(auth_client):
    created = await auth_client.post(items("fields"), json={"geometry": POLYGON})
    feature_id = created.json()["id"]

    # Same id, wrong collection: not at this URL.
    resp = await auth_client.get(item("markers", feature_id))
    assert resp.status_code == 404

    deleted = await auth_client.delete(item("markers", feature_id))
    assert deleted.status_code == 404
    # And the real one survived the attempt.
    assert (await auth_client.get(item("fields", feature_id))).status_code == 200


# --- list + season behaviour -------------------------------------------------


@pytest.mark.asyncio
async def test_list_filters_by_collection(auth_client):
    await auth_client.post(items("fields"), json={"geometry": POLYGON})
    await auth_client.post(items("fields"), json={"geometry": POLYGON})
    await auth_client.post(items("markers"), json={"geometry": POINT})

    fields = await auth_client.get(items("fields"))
    assert len(fields.json()["features"]) == 2
    markers = await auth_client.get(items("markers"))
    assert len(markers.json()["features"]) == 1


@pytest.mark.asyncio
async def test_seasonless_collection_ignores_season(auth_client):
    await auth_client.post(items("infrastructure"), json={"geometry": LINE})
    # infrastructure is season-less, so a season filter must not hide it.
    resp = await auth_client.get(
        items("infrastructure"), params={"season": "2026-long-rains"}
    )
    assert resp.status_code == 200
    assert len(resp.json()["features"]) == 1


# --- update + delete ---------------------------------------------------------


@pytest.mark.asyncio
async def test_update_reshapes_and_preserves_id(auth_client):
    created = await auth_client.post(items("fields"), json={"geometry": POLYGON})
    feature_id = created.json()["id"]

    new_polygon = {
        "type": "Polygon",
        "coordinates": [
            [[36.0, -1.0], [36.0, -1.1], [36.1, -1.1], [36.1, -1.0], [36.0, -1.0]]
        ],
    }
    updated = await auth_client.put(
        item("fields", feature_id),
        json={"geometry": new_polygon, "properties": {"note": "reshaped"}},
    )
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["id"] == feature_id  # id preserved
    assert body["properties"] == {"note": "reshaped"}


@pytest.mark.asyncio
async def test_delete_then_get_is_404(auth_client):
    created = await auth_client.post(items("fields"), json={"geometry": POLYGON})
    feature_id = created.json()["id"]

    deleted = await auth_client.delete(item("fields", feature_id))
    assert deleted.status_code == 204

    fetched = await auth_client.get(item("fields", feature_id))
    assert fetched.status_code == 404


# --- permission gates --------------------------------------------------------


@pytest.mark.asyncio
async def test_create_denied_without_edit(auth_client):
    await _strip_admin()
    resp = await auth_client.post(items("fields"), json={"geometry": POLYGON})
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Permission denied: fields.edit"


@pytest.mark.asyncio
async def test_view_denied_without_view(auth_client):
    await _strip_admin()
    resp = await auth_client.get(items("fields"))
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Permission denied: fields.view"
