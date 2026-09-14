import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from core.storage.database import DB
from main import application


@pytest_asyncio.fixture
async def client(tmp_path, monkeypatch):
    """Unauthenticated client (no bearer token), for testing the auth gate.

    Uses an isolated DB so the test never contends for the shared farm.db lock.
    """
    from config.settings import settings

    monkeypatch.setattr(settings, "database_path", str(tmp_path / "unauth.db"))
    DB.disconnect()
    DB.connect()
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as ac:
        yield ac
    DB.disconnect()


@pytest.mark.asyncio
async def test_create_field_requires_authorization(client):
    response = await client.post(
        "/v1/fields/",
        json={"name": "North Field", "description": "Primary wheat field"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_fields_requires_authorization(client):
    response = await client.get("/v1/fields/")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_field(auth_client):
    response = await auth_client.post(
        "/v1/fields/",
        json={"name": "North Field", "description": "Primary wheat field"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "North Field"
    assert data["description"] == "Primary wheat field"
    assert "id" in data


@pytest.mark.asyncio
async def test_cookie_auth(api_client):
    # Register issues an httpOnly access cookie; the cookie jar reuses it.
    reg = await api_client.post(
        "/v1/auth/register",
        json={"email": "cookie@example.com", "password": "supersecret123"},
    )
    assert reg.status_code == 200
    assert reg.cookies.get("farmdb_access_token")

    # No Authorization header — authentication rides on the cookie alone.
    resp = await api_client.get("/v1/fields/")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_list_fields(auth_client):
    await auth_client.post("/v1/fields/", json={"name": "North Field"})
    await auth_client.post("/v1/fields/", json={"name": "South Field"})

    response = await auth_client.get("/v1/fields/")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    names = {field["name"] for field in data}
    assert {"North Field", "South Field"} <= names


@pytest.mark.asyncio
async def test_list_fields_denied_without_permission(auth_client):
    from core.authz.models import Role, UserRole

    role = await Role.find_one(Role.name == "administrator")
    await UserRole.find(UserRole.role_id == role.id).delete()

    response = await auth_client.get("/v1/fields/")
    assert response.status_code == 403


# A field and its boundary, created in one call.
#
# The polygon below is 0.01 x 0.01 degrees just south of the equator, which is
# about 1.11km x 1.11km: 123.06 hectares, checked against the ellipsoid by hand.
# It is worth asserting to two decimal places, because the wrong coordinate
# order in the area SQL answers 99 ha here and looks plausible while doing it.
# The farm outline is drawn first: a field is a subdivision of a farm, and
# there is nowhere to put one until the farm has an edge.

FARM = {
    "type": "Polygon",
    "coordinates": [
        [[36.79, -1.30], [36.79, -1.27], [36.82, -1.27], [36.82, -1.30], [36.79, -1.30]]
    ],
}
BOUNDARY = {
    "type": "Polygon",
    "coordinates": [
        [[36.80, -1.29], [36.80, -1.28], [36.81, -1.28], [36.81, -1.29], [36.80, -1.29]]
    ],
}
OUTSIDE = {
    "type": "Polygon",
    "coordinates": [
        [[36.50, -1.29], [36.50, -1.28], [36.51, -1.28], [36.51, -1.29], [36.50, -1.29]]
    ],
}


async def _draw_farm(client) -> str:
    resp = await client.post("/v1/maps/collections/farm/items", json={"geometry": FARM})
    assert resp.status_code == 201, resp.text

    return resp.json()["id"]


async def _revoke(permission: str) -> None:
    """Take one permission off every role the tester holds."""
    from core.storage.database import db

    db().execute(
        """
        DELETE FROM v1.role_permissions
        WHERE permission_id IN (SELECT id FROM v1.permissions WHERE name = ?)
        """,
        [permission],
    )


@pytest.mark.asyncio
async def test_create_field_with_a_boundary(auth_client):
    await _draw_farm(auth_client)

    resp = await auth_client.post(
        "/v1/fields/",
        json={"name": "North Field", "geometry": BOUNDARY},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()

    assert body["name"] == "North Field"
    assert body["geometry"]["type"] == "Polygon"
    # Measured on the ellipsoid, so the answer is hectares of ground rather
    # than degrees squared.
    assert body["area_ha"] == pytest.approx(123.06, abs=0.01)


@pytest.mark.asyncio
async def test_the_boundary_is_one_shape_tagged_with_its_field(auth_client):
    await _draw_farm(auth_client)
    created = await auth_client.post(
        "/v1/fields/", json={"name": "North Field", "geometry": BOUNDARY}
    )
    field_id = created.json()["id"]

    shapes = await auth_client.get("/v1/maps/collections/fields/items")
    features = shapes.json()["features"]

    assert len(features) == 1
    assert features[0]["properties"]["field_id"] == field_id
    # The name lives on the field record, so it is not copied onto the shape
    # where a rename could leave it stale.
    assert "name" not in features[0]["properties"]


@pytest.mark.asyncio
async def test_a_field_without_a_boundary_reports_none(auth_client):
    resp = await auth_client.post("/v1/fields/", json={"name": "Unmapped"})

    assert resp.status_code == 200, resp.text
    assert resp.json()["geometry"] is None
    assert resp.json()["area_ha"] is None


@pytest.mark.asyncio
async def test_listing_fields_carries_boundaries(auth_client):
    await _draw_farm(auth_client)
    await auth_client.post("/v1/fields/", json={"name": "Mapped", "geometry": BOUNDARY})
    await auth_client.post("/v1/fields/", json={"name": "Unmapped"})

    resp = await auth_client.get("/v1/fields/")
    fields = {f["name"]: f for f in resp.json()}

    assert fields["Mapped"]["geometry"]["type"] == "Polygon"
    assert fields["Mapped"]["area_ha"] == pytest.approx(123.06, abs=0.01)
    assert fields["Unmapped"]["geometry"] is None
    assert fields["Unmapped"]["area_ha"] is None


@pytest.mark.asyncio
async def test_a_boundary_needs_the_farm_drawn_first(auth_client):
    resp = await auth_client.post(
        "/v1/fields/", json={"name": "Premature", "geometry": BOUNDARY}
    )

    assert resp.status_code == 400
    assert "outline" in resp.json()["detail"]

    # Nothing was written: not the shape, and not the field either.
    assert (await auth_client.get("/v1/fields/")).json() == []


@pytest.mark.asyncio
async def test_a_boundary_outside_the_farm_is_refused(auth_client):
    await _draw_farm(auth_client)

    resp = await auth_client.post(
        "/v1/fields/", json={"name": "Elsewhere", "geometry": OUTSIDE}
    )

    assert resp.status_code == 400
    assert "inside the farm outline" in resp.json()["detail"]
    assert (await auth_client.get("/v1/fields/")).json() == []


@pytest.mark.asyncio
async def test_drawing_a_boundary_needs_the_boundary_permission(auth_client):
    """fields.edit names a field; fields.geometry draws one. A caller with only
    the first may still create the record."""
    await _draw_farm(auth_client)
    await _revoke("fields.geometry")

    denied = await auth_client.post(
        "/v1/fields/", json={"name": "North Field", "geometry": BOUNDARY}
    )
    assert denied.status_code == 403
    assert denied.json()["detail"] == "Permission denied: fields.geometry"

    # Refused before the field row was written, so there is no half-made field.
    assert (await auth_client.get("/v1/fields/")).json() == []

    allowed = await auth_client.post("/v1/fields/", json={"name": "North Field"})
    assert allowed.status_code == 200, allowed.text
