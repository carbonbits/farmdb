"""
Migration: create_crops_table

field_id is nullable for now.

"""

import duckdb


def up(conn: duckdb.DuckDBPyConnection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.crops (
            id          TEXT        PRIMARY KEY,
            field_id    TEXT,
            name        TEXT        NOT NULL,
            variety     TEXT,
            description TEXT,
            created_by  TEXT        NOT NULL,
            is_active   BOOLEAN     NOT NULL DEFAULT true,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_crops_field_id
        ON v1.crops(field_id)
    """)

    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_crops_created_by
        ON v1.crops(created_by)
    """)
