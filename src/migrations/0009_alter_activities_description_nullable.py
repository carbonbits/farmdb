"""
Migration: alter_activities_description_nullable

description is a display concern — the frontend constructs it from
structured fields. Making it nullable so the backend does not need
to generate it.

DuckDB does not support ALTER COLUMN DROP NOT NULL, and RENAME TABLE
fails when indexes exist. We drop indexes first, recreate the table
with the updated schema, then restore the indexes.
"""

import duckdb


def up(conn: duckdb.DuckDBPyConnection) -> None:
    conn.execute("DROP INDEX IF EXISTS v1.idx_activities_actor_id")
    conn.execute("DROP INDEX IF EXISTS v1.idx_activities_entity")
    conn.execute("DROP INDEX IF EXISTS v1.idx_activities_action")

    conn.execute("ALTER TABLE v1.activities RENAME TO activities_old")

    conn.execute("""
        CREATE TABLE v1.activities (
            id             TEXT         PRIMARY KEY,
            actor_id       TEXT         NOT NULL,
            actor_email    TEXT         NOT NULL,
            action         TEXT         NOT NULL,
            entity_type    TEXT         NOT NULL,
            entity_id      TEXT         NOT NULL,
            description    TEXT,
            metadata       JSON,
            monetary_value DECIMAL(12, 4),
            cost_centre    TEXT,
            created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        INSERT INTO v1.activities
        SELECT * FROM v1.activities_old
    """)

    conn.execute("DROP TABLE v1.activities_old")

    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_activities_actor_id
        ON v1.activities(actor_id)
    """)

    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_activities_entity
        ON v1.activities(entity_type, entity_id)
    """)

    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_activities_action
        ON v1.activities(action)
    """)
