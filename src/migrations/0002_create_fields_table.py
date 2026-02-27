"""
Migration: create_fields_table
"""

import duckdb


def up(conn: duckdb.DuckDBPyConnection) -> None:
    # Create configuration key-value store table
    conn.execute("""
        INSTALL spatial;

        LOAD spatial;

        CREATE TABLE IF NOT EXISTS v1.fields (
            id TEXT PRIMARY KEY,
            name TEXT,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            geom GEOMETRY
        )
    """)
