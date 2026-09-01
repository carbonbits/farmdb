"""
HTTP tests for the vector tile endpoint.

Tiles are addressed by z/x/y, so each test computes the tile that contains a
known coordinate (standard web-mercator slippy-map math) and asks for it. Uses
the shared auth_client / api_client fixtures; auth_client holds the all-access
administrator role until a test strips it.
"""
import math

import pytest

MVT_MEDIA_TYPE = "application/vnd.mapbox-vector-tile"

# A zoom at or above the full-detail cutoff, so shapes are not simplified away.
Z = 16
LON, LAT = 36.80, -1.29          # a point
INSIDE_LON, INSIDE_LAT = 36.805, -1.285  # inside the polygon / on the line

POINT = {"type": "Point", "coordinates": [LON, LAT]}
POLYGON = {
    "type": "Polygon",
    "coordinates": [
        [[36.80, -1.29], [36.80, -1.28], [36.81, -1.28], [36.81, -1.29], [36.80, -1.29]]
    ],
}
LINE = {"type": "LineString", "coordinates": [[36.80, -1.29], [36.81, -1.28]]}


def _tile_xy(lon: float, lat: float, z: int) -> tuple[int, int]:
    """The x/y of the web-mercator tile containing lon/lat at zoom z."""
    n = 2**z
    x = int((lon + 180.0) / 360.0 * n)
    lat_rad = math.radians(lat)
    y = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return x, y


async def _create(client, layer: str, geometry: dict) -> None:
    resp = await client.post(
        "/v1/geo/features/", json={"layer": layer, "geometry": geometry}
    )
    assert resp.status_code == 201, resp.text


async def _strip_admin() -> None:
    from core.authz.models import Role, UserRole

    role = await Role.find_one(Role.name == "administrator")
    await UserRole.find(UserRole.role_id == role.id).delete()


@pytest.mark.asyncio
async def test_tile_requires_authentication(api_client):
    x, y = _tile_xy(LON, LAT, Z)
    resp = await api_client.get(f"/v1/tiles/markers/{Z}/{x}/{y}.mvt")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_unknown_layer_returns_404(auth_client):
    x, y = _tile_xy(LON, LAT, Z)
    resp = await auth_client.get(f"/v1/tiles/spaceships/{Z}/{x}/{y}.mvt")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_point_tile_renders(auth_client):
    await _create(auth_client, "markers", POINT)
    x, y = _tile_xy(LON, LAT, Z)
    resp = await auth_client.get(f"/v1/tiles/markers/{Z}/{x}/{y}.mvt")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == MVT_MEDIA_TYPE
    assert len(resp.content) > 0
    assert resp.headers.get("etag")


@pytest.mark.asyncio
async def test_polygon_tile_renders(auth_client):
    await _create(auth_client, "fields", POLYGON)
    x, y = _tile_xy(INSIDE_LON, INSIDE_LAT, Z)
    resp = await auth_client.get(f"/v1/tiles/fields/{Z}/{x}/{y}.mvt")
    assert resp.status_code == 200
    assert len(resp.content) > 0


@pytest.mark.asyncio
async def test_line_tile_renders(auth_client):
    await _create(auth_client, "infrastructure", LINE)
    x, y = _tile_xy(INSIDE_LON, INSIDE_LAT, Z)
    resp = await auth_client.get(f"/v1/tiles/infrastructure/{Z}/{x}/{y}.mvt")
    assert resp.status_code == 200
    assert len(resp.content) > 0


@pytest.mark.asyncio
async def test_empty_tile_returns_204(auth_client):
    await _create(auth_client, "markers", POINT)
    # Tile 0/0 at this zoom is far from the feature (arctic north-west).
    resp = await auth_client.get(f"/v1/tiles/markers/{Z}/0/0.mvt")
    assert resp.status_code == 204
    assert resp.content == b""


@pytest.mark.asyncio
async def test_conditional_request_returns_304(auth_client):
    await _create(auth_client, "markers", POINT)
    x, y = _tile_xy(LON, LAT, Z)
    first = await auth_client.get(f"/v1/tiles/markers/{Z}/{x}/{y}.mvt")
    assert first.status_code == 200
    etag = first.headers["etag"]

    second = await auth_client.get(
        f"/v1/tiles/markers/{Z}/{x}/{y}.mvt",
        headers={"If-None-Match": etag},
    )
    assert second.status_code == 304
    assert second.content == b""


@pytest.mark.asyncio
async def test_seasonless_layer_ignores_season(auth_client):
    await _create(auth_client, "markers", POINT)
    x, y = _tile_xy(LON, LAT, Z)
    # markers is season-less, so a season filter must not hide its features.
    resp = await auth_client.get(
        f"/v1/tiles/markers/{Z}/{x}/{y}.mvt", params={"season": "2026-long-rains"}
    )
    assert resp.status_code == 200
    assert len(resp.content) > 0


@pytest.mark.asyncio
async def test_tile_denied_without_view(auth_client):
    await _create(auth_client, "markers", POINT)  # while still admin
    await _strip_admin()
    x, y = _tile_xy(LON, LAT, Z)
    resp = await auth_client.get(f"/v1/tiles/markers/{Z}/{x}/{y}.mvt")
    assert resp.status_code == 403
