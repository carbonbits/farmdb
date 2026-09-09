"""
The OGC API metadata documents: landing page, conformance, collections, tilesets.

These are the documents that let a client discover the API without being told
about it in advance — point QGIS or a web map at /v1/maps/ and it can walk the
links to the data. The shapes follow OGC API - Features and OGC API - Tiles;
what a collection means to us is a layer from the registry.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel

from core.geo.handler import GeoHandler
from core.geo.layers import Layer
from core.geo.models import Bbox

# The storage CRS as a URI, off the geo handler base that declares it once.
# Read here at import time because these are field defaults, not runtime lookups.
CRS = GeoHandler.CRS


class Link(BaseModel):
    """One link in an OGC document. rel says what the target is to this document."""

    href: str
    rel: str
    type: Optional[str] = None
    title: Optional[str] = None


class LandingPage(BaseModel):
    title: str
    description: str
    links: list[Link]


class ConformanceDeclaration(BaseModel):
    conformsTo: list[str]


class SpatialExtent(BaseModel):
    # A list of boxes, per the spec; we always report exactly one, and none at
    # all until a layer holds something.
    bbox: list[Bbox]
    crs: str = CRS


class Extent(BaseModel):
    spatial: Optional[SpatialExtent] = None


class Collection(BaseModel):
    """One layer, described the way an OGC client expects a collection."""

    id: str
    title: str
    description: str
    itemType: Literal["feature"] = "feature"
    crs: list[str] = [CRS]
    extent: Extent
    links: list[Link]
    # Ours, not the spec's: a client of this API benefits from knowing the
    # geometry class it must post and whether the layer is season-aware.
    geometryType: str
    seasonal: bool

    @classmethod
    def build(cls, layer: Layer, bbox: Optional[Bbox], links: list[Link]) -> Collection:
        return cls(
            id=layer.name,
            title=layer.title,
            description=layer.description,
            extent=Extent(
                spatial=SpatialExtent(bbox=[bbox]) if bbox is not None else None
            ),
            links=links,
            geometryType=layer.geometry_type,
            seasonal=layer.seasonal,
        )


class Collections(BaseModel):
    collections: list[Collection]
    links: list[Link]


class TileMatrixSetLink(BaseModel):
    tileMatrixSetId: str
    dataType: Literal["vector"] = "vector"
    links: list[Link]


class TileSets(BaseModel):
    tilesets: list[TileMatrixSetLink]
    links: list[Link]
