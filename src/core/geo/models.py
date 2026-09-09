"""
What the store hands back.

GeoRecord is deliberately not a GeoJSON Feature: GeoJSON is a wire format that
the map API happens to speak, while a record is what any caller — a CLI command,
another feature's handler — gets when it reads a row. features/geo turns records
into GeoJSON at the edge.

Why this is not a duckling Document, when every other model in the project is:
v1.geospatial cannot be reached through the ORM in either direction, because
both ends of the geometry column need a spatial function.

  - Writing. duckling sends a dict field as json.dumps(...), and a JSON string
    into a GEOMETRY column raises "Failed to parse geometry: Unknown geometry
    type at offset 0". The insert has to say ST_GeomFromGeoJSON(?).
  - Reading. SELECT *, which is what find/get issue, returns GEOMETRY as WKB
    bytes, so a dict[str, Any] field fails validation. The read has to project
    ST_AsGeoJSON(geometry).

A Document that can neither insert, get nor find is a label rather than a model,
and declaring one would advertise four methods that corrupt or raise. So the
record is a plain pydantic model over the projection below, and the spatial SQL
stays in the handlers where it is visible. If duckling grows a geometry field
type, this is the file that changes.
"""

from __future__ import annotations

import json
from typing import Any

from pydantic import BaseModel, ConfigDict

# A bounding box in storage CRS order: min longitude, min latitude, max
# longitude, max latitude.
Bbox = tuple[float, float, float, float]

# The columns every read selects, in this order, so a row maps straight onto a
# GeoRecord. ST_AsGeoJSON and the JSON properties column both come back as
# strings, so both are parsed on the way out.
COLUMNS = "id, layer, season, ST_AsGeoJSON(geometry), properties"


class GeoRecord(BaseModel):
    """One row of v1.geospatial, as projected by COLUMNS."""

    model_config = ConfigDict(frozen=True)

    id: str
    layer: str
    season: str | None
    geometry: dict[str, Any]
    properties: dict[str, Any]

    @classmethod
    def from_row(cls, row: tuple) -> GeoRecord:
        return cls(
            id=row[0],
            layer=row[1],
            season=row[2],
            geometry=json.loads(row[3]),
            properties=json.loads(row[4]) if row[4] else {},
        )
