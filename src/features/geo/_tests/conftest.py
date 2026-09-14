"""
Fixtures for the map API's HTTP tests.

Everything a farm draws sits inside its outline, so a test that stores ground
draws the farm first — the same order an install does it in, and the reason
these tests ask for `farm_outline` alongside the client rather than posting a
field into thin air.

FARM has room around the shapes these tests use, which all sit near 36.80E
1.29S. Tests that check the unmapped case simply do not take the fixture.
"""

import pytest_asyncio

FARM = {
    "type": "Polygon",
    "coordinates": [
        [[36.79, -1.30], [36.79, -1.27], [36.82, -1.27], [36.82, -1.30], [36.79, -1.30]]
    ],
}


@pytest_asyncio.fixture
async def farm_outline(auth_client):
    """This farm's outline, drawn through the API. Returns its feature id."""
    resp = await auth_client.post(
        "/v1/maps/collections/farm/items", json={"geometry": FARM}
    )
    assert resp.status_code == 201, resp.text

    return resp.json()["id"]
