"""
HTTP tests for the WMS entry point.

WMS is a KVP protocol, so the tests drive it the way a desktop GIS does: one URL
with query-string parameters, in whatever case the client feels like sending.
"""

from xml.etree import ElementTree as ET

import pytest

WMS = "/v1/maps/wms"
WMS_NS = "{http://www.opengis.net/wms}"
OGC_NS = "{http://www.opengis.net/ogc}"


async def _strip_admin() -> None:
    from core.authz.models import Role, UserRole

    role = await Role.find_one(Role.name == "administrator")
    await UserRole.find(UserRole.role_id == role.id).delete()


def _layer_names(xml: bytes) -> list[str]:
    root = ET.fromstring(xml)

    return [
        name.text
        for name in root.iter(f"{WMS_NS}Name")
        if name.text != "WMS"  # the Service name, not a layer
    ]


def _exception_code(xml: bytes) -> str:
    root = ET.fromstring(xml)

    return root.find(f"{OGC_NS}ServiceException").get("code")


@pytest.mark.asyncio
async def test_wms_requires_authentication(api_client):
    resp = await api_client.get(WMS, params={"REQUEST": "GetCapabilities"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_capabilities_describes_the_layers(auth_client):
    resp = await auth_client.get(
        WMS, params={"SERVICE": "WMS", "VERSION": "1.3.0", "REQUEST": "GetCapabilities"}
    )
    assert resp.status_code == 200, resp.text
    assert resp.headers["content-type"].startswith("text/xml")

    root = ET.fromstring(resp.content)
    assert root.tag == f"{WMS_NS}WMS_Capabilities"
    assert root.get("version") == "1.3.0"
    assert set(_layer_names(resp.content)) == {"fields", "infrastructure", "markers"}


@pytest.mark.asyncio
async def test_parameter_names_are_case_insensitive(auth_client):
    # QGIS sends lower case; the spec says names are case-insensitive.
    resp = await auth_client.get(
        WMS, params={"service": "wms", "request": "getcapabilities"}
    )
    assert resp.status_code == 200, resp.text
    assert ET.fromstring(resp.content).tag == f"{WMS_NS}WMS_Capabilities"


@pytest.mark.asyncio
async def test_capabilities_hide_layers_the_caller_cannot_view(auth_client):
    await _strip_admin()

    resp = await auth_client.get(WMS, params={"REQUEST": "GetCapabilities"})
    assert resp.status_code == 200
    assert _layer_names(resp.content) == []


@pytest.mark.asyncio
async def test_get_map_is_not_implemented_yet(auth_client):
    resp = await auth_client.get(
        WMS,
        params={
            "SERVICE": "WMS",
            "VERSION": "1.3.0",
            "REQUEST": "GetMap",
            "LAYERS": "fields",
            "CRS": "CRS:84",
            "BBOX": "36.8,-1.29,36.81,-1.28",
            "WIDTH": "256",
            "HEIGHT": "256",
            "FORMAT": "image/png",
        },
    )
    assert resp.status_code == 501
    assert _exception_code(resp.content) == "OperationNotSupported"


@pytest.mark.asyncio
async def test_missing_request_is_a_service_exception(auth_client):
    resp = await auth_client.get(WMS, params={"SERVICE": "WMS"})
    assert resp.status_code == 400
    assert _exception_code(resp.content) == "MissingParameterValue"


@pytest.mark.asyncio
async def test_another_service_is_refused(auth_client):
    resp = await auth_client.get(
        WMS, params={"SERVICE": "WFS", "REQUEST": "GetCapabilities"}
    )
    assert resp.status_code == 400
    assert _exception_code(resp.content) == "InvalidParameterValue"


@pytest.mark.asyncio
async def test_another_wms_version_is_refused(auth_client):
    resp = await auth_client.get(
        WMS, params={"REQUEST": "GetCapabilities", "VERSION": "1.1.1"}
    )
    assert resp.status_code == 400
    assert _exception_code(resp.content) == "InvalidParameterValue"
