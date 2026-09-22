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
request all work on the same cursor. It stays optional because a handler is also
reachable without a service in hand — the layer registry is read by document
builders and by module-level helpers — and one of those gets a cursor of its own
on first use rather than making every caller plumb one through.
"""

from typing import Optional

import duckdb

from config.settings import settings
from core.handler import Handler
from core.storage.database import db


class GeoHandler(Handler):
    SRID = settings.geo_srid
    CRS = settings.geo_crs

    def __init__(self, conn: Optional[duckdb.DuckDBPyConnection] = None) -> None:
        super().__init__()
        self._conn = conn

    @property
    def conn(self) -> duckdb.DuckDBPyConnection:
        """The connection this handler works on, opening one if it has none."""
        if self._conn is None:
            self._conn = db()

        return self._conn
