"""
Migration: drop_fields_geom

Contract phase of the geospatial expand/contract. Removes the now-unused
v1.fields.geom column; geometry lives in v1.geospatial and fields reference it
via geospatial_id (added in 0006).

Runs non-atomically (atomic = False). DuckDB 1.5.x will not drop an interior
column while indexes exist on later columns, and it does not observe
in-transaction index drops before the column drop. So the dependent indexes are
dropped and recreated around the column drop, with each statement auto-committing.
This is a metadata-only column drop, not a table rebuild.
"""

import duckdb

# Must run outside a transaction (see module docstring).
atomic = False


def up(conn: duckdb.DuckDBPyConnection) -> None:
    """Apply the migration."""
    conn.execute("INSTALL spatial")
    conn.execute("LOAD spatial")

    # idx_fields_user_id and idx_fields_geospatial_id sit on columns positioned
    # after geom, so they must be removed before the column can be dropped.
    conn.execute("DROP INDEX v1.idx_fields_user_id")
    conn.execute("DROP INDEX v1.idx_fields_geospatial_id")
    conn.execute("ALTER TABLE v1.fields DROP COLUMN geom")
    conn.execute("CREATE INDEX idx_fields_user_id ON v1.fields(user_id)")
    conn.execute("CREATE INDEX idx_fields_geospatial_id ON v1.fields(geospatial_id)")
