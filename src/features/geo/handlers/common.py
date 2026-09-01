"""Shared read helpers for the geo feature handlers."""
from __future__ import annotations

import json

from features.geo.models.feature import GeoFeature

# The columns every read selects, in this order, so a row maps straight onto
# GeoFeature. ST_AsGeoJSON and the JSON properties column both come back as
# strings, so both are parsed here.
FEATURE_COLUMNS = "id, layer, season, ST_AsGeoJSON(geometry), properties"


def row_to_feature(row: tuple) -> GeoFeature:
    return GeoFeature(
        id=row[0],
        layer=row[1],
        season=row[2],
        geometry=json.loads(row[3]),
        properties=json.loads(row[4]) if row[4] else {},
    )
