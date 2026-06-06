"""
Migration: create_configurations_table
"""

import duckdb


def up(conn: duckdb.DuckDBPyConnection) -> None:
    """Apply the migration."""

    # Create configuration key-value store table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.configuration (
            key TEXT PRIMARY KEY,
            value TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
        )
    """)
