"""
Migration: 0003_create_v1_farms_table
Creates the v1.farms table in the v1 schema.
"""
import duckdb


def up(conn: duckdb.DuckDBPyConnection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.farms (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            description TEXT,
            shortcode   TEXT,
            org_id      TEXT NOT NULL,
            created_by  TEXT NOT NULL,
            is_active   BOOLEAN NOT NULL DEFAULT TRUE,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)


def down(conn: duckdb.DuckDBPyConnection) -> None:
    conn.execute("DROP TABLE IF EXISTS v1.farms")