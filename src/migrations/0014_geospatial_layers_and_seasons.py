"""
Migration: geospatial_layers_and_seasons

Adds two columns and two indexes to v1.geospatial so the table can hold many
kinds of shape and be searched quickly.

Columns:
  layer  TEXT  Groups features by kind (fields, sensors, infrastructure,
               reports). It is nullable in the database, but the feature API
               requires it, so every real row still gets one. Keeping it
               nullable means this migration only adds things and will not fail
               even if the table already has rows.
  season TEXT  The growing season a shape belongs to, for example
               '2026-long-rains'. It is left empty for things that do not
               change with the season, like fences and pipes.

Indexes:
  R-tree on geometry   Speeds up "which shapes fall inside this area" searches.
  (layer, season)      Speeds up the everyday reads that filter by layer and
                       sometimes by season.

There is no backfill. The original plan was to copy existing field boundaries
into layer='fields', but the old v1.fields.geom column that held those
boundaries was already removed in 0007_drop_fields_geom, and the table has no
rows to copy from. So there is nothing to backfill. New field boundaries get
layer='fields' set when they are created through the feature API.

This runs non-atomically (atomic = False). DuckDB commits schema changes on
their own, so ALTER and CREATE INDEX cannot run inside the runner's transaction,
the same reason as 0007 and 0011. Every statement is safe to run again if a
re-run is ever needed.
"""
import duckdb

atomic = False


def up(conn: duckdb.DuckDBPyConnection) -> None:
    """Apply the migration."""
    conn.execute("INSTALL spatial")
    conn.execute("LOAD spatial")

    # New columns. Nullable in the database; the feature API requires layer, so
    # every real row still gets one.
    conn.execute("ALTER TABLE v1.geospatial ADD COLUMN IF NOT EXISTS layer TEXT")
    conn.execute("ALTER TABLE v1.geospatial ADD COLUMN IF NOT EXISTS season TEXT")

    # Speeds up area searches (which shapes fall inside a given box).
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_geospatial_geometry "
        "ON v1.geospatial USING RTREE (geometry)"
    )

    # Speeds up the everyday reads that filter by layer, and sometimes season.
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_geospatial_layer_season "
        "ON v1.geospatial(layer, season)"
    )
