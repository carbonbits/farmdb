"""
Migration: create_geospatial_table

Introduces a dedicated table for geospatial metadata. Rather than each domain
table carrying its own geometry, all geospatial features (field boundaries,
fences, gates, the farm house, etc.) live in one place keyed by feature_type.
Domain tables reference a geospatial row by id.

This migration is purely additive (expand phase of expand/contract): it creates
v1.geospatial and adds v1.fields.geospatial_id. The legacy v1.fields.geom column
is left in place — it is simply no longer the source of truth. Removing it is
deferred to a later contract migration, after existing geometry is backfilled
into v1.geospatial and no code reads v1.fields.geom. Dropping it now would mean
rebuilding a table that may hold production data, which is not safe online.

No foreign keys are declared (per project convention): geospatial_id and farm_id
are plain id columns. farm_id is intentionally unconstrained because farm
ownership lives in the enterprise edition, not open core.
"""

import duckdb


def up(conn: duckdb.DuckDBPyConnection) -> None:
    """Apply the migration."""
    conn.execute("INSTALL spatial")
    conn.execute("LOAD spatial")

    # Central store of geospatial features for a farm. Fields are polygons; other
    # feature types (gates, the farm house) may be points or lines, so the column
    # is a generic GEOMETRY. `properties` carries freeform metadata for future
    # tooling such as 3D rendering. `srid` records the coordinate reference system
    # (WGS84 / EPSG:4326 by default).
    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.geospatial (
            id TEXT PRIMARY KEY,
            farm_id TEXT,
            feature_type TEXT NOT NULL,
            geometry GEOMETRY NOT NULL,
            properties JSON,
            srid INTEGER DEFAULT 4326,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT
        )
    """)

    conn.execute("CREATE INDEX IF NOT EXISTS idx_geospatial_farm_id ON v1.geospatial(farm_id)")
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_geospatial_feature_type ON v1.geospatial(feature_type)"
    )

    # Fields reference a geospatial row going forward. Additive only: geom stays.
    conn.execute("ALTER TABLE v1.fields ADD COLUMN geospatial_id TEXT")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_fields_geospatial_id ON v1.fields(geospatial_id)")
