"""
What the items endpoints return: a GeoJSON-style Feature and FeatureCollection.

GeoJSON is a wire format, so it lives at the edge rather than in core.geo. The
geometry field is a GeoJSON geometry object exactly as DuckDB's ST_AsGeoJSON
produces it. layer and season are carried alongside so the map knows which
collection a shape belongs to and which season it applies to.
"""

from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel

from core.geo.models import GeoRecord


class GeoFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    id: str
    layer: str
    season: Optional[str] = None
    geometry: dict[str, Any]
    properties: dict[str, Any]

    @classmethod
    def from_record(cls, record: GeoRecord) -> GeoFeature:
        return cls(
            id=record.id,
            layer=record.layer,
            season=record.season,
            geometry=record.geometry,
            properties=record.properties,
        )


class GeoFeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[GeoFeature]

    @classmethod
    def from_records(cls, records: list[GeoRecord]) -> GeoFeatureCollection:
        return cls(features=[GeoFeature.from_record(record) for record in records])
