"""
Migration: create_v1_schema
"""

import duckdb


def up(conn: duckdb.DuckDBPyConnection) -> None:
    """Apply the migration."""
    # Create v1 schema
    conn.execute("CREATE SCHEMA IF NOT EXISTS v1")
