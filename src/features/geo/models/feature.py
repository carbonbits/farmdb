"""
What the geo endpoints return: a GeoJSON-style Feature and FeatureCollection.

The geometry field is a GeoJSON geometry object exactly as DuckDB's
ST_AsGeoJSON produces it. layer and season are carried alongside so the map
knows which layer a shape belongs to and which season it applies to.
"""
from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel


class GeoFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    id: str
    layer: str
    season: Optional[str] = None
    geometry: dict[str, Any]
    properties: dict[str, Any]


class GeoFeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[GeoFeature]
