"""
The WMS 1.3.0 capabilities document.

This is what a desktop GIS reads when you paste the WMS URL into it: what the
service is called, which operations it answers, and which layers it holds with
their extents. It is built from the layer registry, so a layer registered by the
enterprise edition appears here without this file changing.

Built with ElementTree rather than string formatting so layer titles and
descriptions are escaped properly — they are farm-authored text.

GetMap is advertised because the WMS schema requires it, even though this build
answers it with a 501 until a rasterizer is chosen. GetFeatureInfo is optional
in the schema and is left out entirely rather than advertised and refused.
"""

from __future__ import annotations

from typing import Optional, Sequence
from xml.etree import ElementTree as ET

from core.geo.layers import Layer
from core.geo.models import Bbox

WMS_VERSION = "1.3.0"

# CRS:84 is longitude/latitude, the order this API speaks everywhere. EPSG:4326
# is advertised too because clients ask for it by name; note that in WMS 1.3.0
# EPSG:4326 means latitude first, which is a trap for whoever implements GetMap.
CRS_LIST = ("CRS:84", "EPSG:4326", "EPSG:3857")

# What we claim to cover when a layer holds nothing yet.
WORLD: Bbox = (-180.0, -90.0, 180.0, 90.0)

LayerExtents = Sequence[tuple[Layer, Optional[Bbox]]]


def build(*, wms_url: str, title: str, abstract: str, layers: LayerExtents) -> bytes:
    """The capabilities document as UTF-8 XML."""
    root = ET.Element(
        "WMS_Capabilities",
        {
            "version": WMS_VERSION,
            "xmlns": "http://www.opengis.net/wms",
            "xmlns:xlink": "http://www.w3.org/1999/xlink",
        },
    )

    service = ET.SubElement(root, "Service")
    _text(service, "Name", "WMS")
    _text(service, "Title", title)
    _text(service, "Abstract", abstract)
    _online_resource(service, wms_url)

    capability = ET.SubElement(root, "Capability")
    request = ET.SubElement(capability, "Request")
    _operation(request, "GetCapabilities", "text/xml", wms_url)
    _operation(request, "GetMap", "image/png", wms_url)

    exception = ET.SubElement(capability, "Exception")
    _text(exception, "Format", "XML")

    root_layer = ET.SubElement(capability, "Layer")
    _text(root_layer, "Title", title)

    for crs in CRS_LIST:
        _text(root_layer, "CRS", crs)

    _bounds(root_layer, _union(bbox for _layer, bbox in layers))

    for layer, bbox in layers:
        # queryable="0": GetFeatureInfo is not implemented, so nothing here can
        # be clicked for attributes.
        element = ET.SubElement(root_layer, "Layer", {"queryable": "0"})
        _text(element, "Name", layer.name)
        _text(element, "Title", layer.title)
        _text(element, "Abstract", layer.description)
        _bounds(element, bbox or WORLD)

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def exception_report(code: str, message: str, locator: Optional[str] = None) -> bytes:
    """An OGC ServiceExceptionReport, the error shape a WMS client understands."""
    root = ET.Element(
        "ServiceExceptionReport",
        {"version": WMS_VERSION, "xmlns": "http://www.opengis.net/ogc"},
    )

    attributes = {"code": code}

    if locator is not None:
        attributes["locator"] = locator

    ET.SubElement(root, "ServiceException", attributes).text = message

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def _text(parent: ET.Element, tag: str, value: str) -> ET.Element:
    element = ET.SubElement(parent, tag)
    element.text = value

    return element


def _online_resource(parent: ET.Element, url: str) -> None:
    # The xlink prefix is declared once on the root element.
    ET.SubElement(parent, "OnlineResource", {"xlink:href": url})


def _operation(request: ET.Element, name: str, fmt: str, url: str) -> None:
    operation = ET.SubElement(request, name)
    _text(operation, "Format", fmt)
    http = ET.SubElement(ET.SubElement(operation, "DCPType"), "HTTP")
    _online_resource(ET.SubElement(http, "Get"), url)


def _bounds(layer_element: ET.Element, bbox: Bbox) -> None:
    """The two bounding boxes every named layer needs, geographic then CRS-tagged."""
    minx, miny, maxx, maxy = bbox

    geographic = ET.SubElement(layer_element, "EX_GeographicBoundingBox")
    _text(geographic, "westBoundLongitude", str(minx))
    _text(geographic, "eastBoundLongitude", str(maxx))
    _text(geographic, "southBoundLatitude", str(miny))
    _text(geographic, "northBoundLatitude", str(maxy))

    ET.SubElement(
        layer_element,
        "BoundingBox",
        {
            "CRS": "CRS:84",
            "minx": str(minx),
            "miny": str(miny),
            "maxx": str(maxx),
            "maxy": str(maxy),
        },
    )


def _union(boxes) -> Bbox:
    """The box around every layer that has one, or the world if none do."""
    present = [box for box in boxes if box is not None]

    if not present:
        return WORLD

    return (
        min(box[0] for box in present),
        min(box[1] for box in present),
        max(box[2] for box in present),
        max(box[3] for box in present),
    )
