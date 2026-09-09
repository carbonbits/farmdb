"""
URL and media-type helpers for the map API.

OGC documents are held together by links, so every document has to be able to
name the others absolutely. Building them from the request means the API
describes itself correctly behind a proxy or on a different port without any
configured base URL.
"""

from __future__ import annotations

from fastapi import Request

from core.geo.layers import Layer
from features.geo.models.ogc import Link

PREFIX = "/v1/maps"

JSON = "application/json"
GEOJSON = "application/geo+json"
MVT = "application/vnd.mapbox-vector-tile"
XML = "text/xml"

# The one tile matrix set we serve: the standard web mercator slippy-map scheme
# every web map already speaks.
TILE_MATRIX_SET = "WebMercatorQuad"


def absolute(request: Request, path: str) -> str:
    """An absolute URL for a path under this API, as the caller reached us."""
    return str(request.base_url).rstrip("/") + path


def collection_links(request: Request, layer: Layer) -> list[Link]:
    """The links that hang off one collection: itself, its items, its tiles."""
    base = f"{PREFIX}/collections/{layer.name}"

    return [
        Link(
            href=absolute(request, base),
            rel="self",
            type=JSON,
            title=layer.title,
        ),
        Link(
            href=absolute(request, f"{base}/items"),
            rel="items",
            type=GEOJSON,
            title=f"{layer.title} as GeoJSON",
        ),
        Link(
            href=absolute(request, f"{base}/tiles"),
            rel="http://www.opengis.net/def/rel/ogc/1.0/tilesets-vector",
            type=JSON,
            title=f"{layer.title} as vector tiles",
        ),
    ]
