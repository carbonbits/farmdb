"""
The base every core.geo handler extends.

It carries the coordinate reference system policy, so no handler declares the
storage CRS again: everything in v1.geospatial is EPSG:4326 (WGS84
longitude/latitude), and reprojection happens in exactly one place — tile
rendering, which needs web mercator.

SRID is the geometry column's spatial reference; CRS is the URI the OGC
documents quote. Both are read once from the geospatial block in
config.settings; see it for what the default means.

The connection is the one the service owns, handed down so the handlers of a
request all work on the same cursor. LayerHandler is the exception that proves
it optional — the registry lives in memory and touches no database.
"""

from typing import Optional

import duckdb

from config.settings import settings
from core.handler import Handler


class GeoHandler(Handler):
    SRID = settings.geo_srid
    CRS = settings.geo_crs

    def __init__(self, conn: Optional[duckdb.DuckDBPyConnection] = None) -> None:
        super().__init__()
        self._conn = conn
