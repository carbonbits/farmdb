"""
Migration: create_api_keys_table

Per-account API keys for direct (non-browser) API access. Keys are shown once at
creation; only a sha256 hash of the full key is stored (the key is high-entropy,
so a fast hash is sufficient and allows O(1) lookup on verify). `prefix` is a
short, non-secret fragment kept for display ("which key").

No foreign keys (per convention): user_id is a plain id column.
"""

import duckdb


def up(conn: duckdb.DuckDBPyConnection) -> None:
    """Apply the migration."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.api_keys (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            name TEXT,
            prefix TEXT,
            key_hash TEXT UNIQUE NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMPTZ,
            revoked BOOLEAN DEFAULT FALSE
        )
    """)

    conn.execute("CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON v1.api_keys(user_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON v1.api_keys(key_hash)")
