"""
Migration: add_user_id_to_fields

Adds user_id column to fields table to associate fields with authenticated users.
"""

import duckdb


def up(conn: duckdb.DuckDBPyConnection) -> None:
    """Apply the migration."""
    conn.execute("""
        ALTER TABLE v1.fields
        ADD COLUMN user_id TEXT REFERENCES v1.users(id)
    """)

    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_fields_user_id
        ON v1.fields(user_id)
    """)
