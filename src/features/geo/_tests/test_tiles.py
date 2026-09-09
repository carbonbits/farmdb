"""
HTTP tests for the vector tile endpoint.

Tiles are addressed by z/x/y under a tile matrix set, so each test computes the
tile that contains a known coordinate (standard web-mercator slippy-map math)
and asks for it. Uses the shared auth_client / api_client fixtures; auth_client
holds the all-access administrator role until a test strips it.
"""

import math

import pytest

MVT_MEDIA_TYPE = "application/vnd.mapbox-vector-tile"

# A zoom at or above the full-detail cutoff, so shapes are not simplified away.
Z = 16
LON, LAT = 36.80, -1.29  # a point
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


def tile_url(
    collection: str, z: int, x: int, y: int, tms: str = "WebMercatorQuad"
) -> str:
    return f"/v1/maps/collections/{collection}/tiles/{tms}/{z}/{x}/{y}.mvt"


async def _create(client, collection: str, geometry: dict) -> None:
    resp = await client.post(
        f"/v1/maps/collections/{collection}/items", json={"geometry": geometry}
    )
    assert resp.status_code == 201, resp.text


async def _strip_admin() -> None:
    from core.authz.models import Role, UserRole

    role = await Role.find_one(Role.name == "administrator")
    await UserRole.find(UserRole.role_id == role.id).delete()


@pytest.mark.asyncio
async def test_tile_requires_authentication(api_client):
    x, y = _tile_xy(LON, LAT, Z)
    resp = await api_client.get(tile_url("markers", Z, x, y))
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_unknown_collection_returns_404(auth_client):
    x, y = _tile_xy(LON, LAT, Z)
    resp = await auth_client.get(tile_url("spaceships", Z, x, y))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_unknown_tile_matrix_set_returns_404(auth_client):
    x, y = _tile_xy(LON, LAT, Z)
    resp = await auth_client.get(tile_url("markers", Z, x, y, tms="WorldCRS84Quad"))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_tilesets_document_lists_the_matrix_set(auth_client):
    resp = await auth_client.get("/v1/maps/collections/markers/tiles")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert [t["tileMatrixSetId"] for t in body["tilesets"]] == ["WebMercatorQuad"]
    assert body["tilesets"][0]["links"][0]["href"].endswith(
        "/v1/maps/collections/markers/tiles/WebMercatorQuad/{z}/{x}/{y}.mvt"
    )


@pytest.mark.asyncio
async def test_point_tile_renders(auth_client):
    await _create(auth_client, "markers", POINT)
    x, y = _tile_xy(LON, LAT, Z)
    resp = await auth_client.get(tile_url("markers", Z, x, y))
    assert resp.status_code == 200
    assert resp.headers["content-type"] == MVT_MEDIA_TYPE
    assert len(resp.content) > 0
    assert resp.headers.get("etag")


@pytest.mark.asyncio
async def test_polygon_tile_renders(auth_client):
    await _create(auth_client, "fields", POLYGON)
    x, y = _tile_xy(INSIDE_LON, INSIDE_LAT, Z)
    resp = await auth_client.get(tile_url("fields", Z, x, y))
    assert resp.status_code == 200
    assert len(resp.content) > 0


@pytest.mark.asyncio
async def test_line_tile_renders(auth_client):
    await _create(auth_client, "infrastructure", LINE)
    x, y = _tile_xy(INSIDE_LON, INSIDE_LAT, Z)
    resp = await auth_client.get(tile_url("infrastructure", Z, x, y))
    assert resp.status_code == 200
    assert len(resp.content) > 0


@pytest.mark.asyncio
async def test_empty_tile_returns_204(auth_client):
    await _create(auth_client, "markers", POINT)
    # Tile 0/0 at this zoom is far from the feature (arctic north-west).
    resp = await auth_client.get(tile_url("markers", Z, 0, 0))
    assert resp.status_code == 204
    assert resp.content == b""


@pytest.mark.asyncio
async def test_conditional_request_returns_304(auth_client):
    await _create(auth_client, "markers", POINT)
    x, y = _tile_xy(LON, LAT, Z)
    first = await auth_client.get(tile_url("markers", Z, x, y))
    assert first.status_code == 200
    etag = first.headers["etag"]

    second = await auth_client.get(
        tile_url("markers", Z, x, y), headers={"If-None-Match": etag}
    )
    assert second.status_code == 304
    assert second.content == b""


@pytest.mark.asyncio
async def test_seasonless_collection_ignores_season(auth_client):
    await _create(auth_client, "markers", POINT)
    x, y = _tile_xy(LON, LAT, Z)
    # markers is season-less, so a season filter must not hide its features.
    resp = await auth_client.get(
        tile_url("markers", Z, x, y), params={"season": "2026-long-rains"}
    )
    assert resp.status_code == 200
    assert len(resp.content) > 0


@pytest.mark.asyncio
async def test_tile_denied_without_view(auth_client):
    await _create(auth_client, "markers", POINT)  # while still admin
    await _strip_admin()
    x, y = _tile_xy(LON, LAT, Z)
    resp = await auth_client.get(tile_url("markers", Z, x, y))
    assert resp.status_code == 403
