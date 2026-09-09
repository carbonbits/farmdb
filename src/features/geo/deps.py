"""
Request-scoped wiring for the map API.

GeospatialService takes a connection so a request can hand it the cursor it
already holds. Building it here rather than inside core keeps FastAPI out of
core.geo, which is the whole point of the split: a CLI command constructs the
same service with no dependency injection at all.
"""

from __future__ import annotations

from typing import Annotated

import duckdb
from fastapi import Depends

from core.geo.service import GeospatialService
from core.storage.database import db


def geo_service(
    conn: Annotated[duckdb.DuckDBPyConnection, Depends(db)],
) -> GeospatialService:
    return GeospatialService(conn=conn)


Geo = Annotated[GeospatialService, Depends(geo_service)]
