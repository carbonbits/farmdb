"""
A database cursor with the DuckDB spatial extension loaded.

The spatial extension is installed by migration 0006, but LOAD is per
connection, and the running app does not load it on its own. The geo endpoints
need spatial functions (ST_GeomFromGeoJSON, ST_AsGeoJSON, ST_GeometryType,
ST_IsValid), so this dependency loads spatial once per request before any geo
handler runs. LOAD is a no-op when the extension is already loaded.
"""
from __future__ import annotations

import duckdb

from core.storage.database import db


def geo_db() -> duckdb.DuckDBPyConnection:
    conn = db()
    conn.execute("LOAD spatial")
    return conn
