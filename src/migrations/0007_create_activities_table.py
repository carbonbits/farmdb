"""
Migration create_activities_table

Audit log for all meaningful farm actions.

monetary_value and cost_centre are nullable now farmdb EE will populate
them for profitability reporting without a breaking schema change.
"""

import duckdb


def up(conn: duckdb.DuckDBPyConnection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.activities (
            id             TEXT         PRIMARY KEY,
            actor_id       TEXT         NOT NULL,
            actor_email    TEXT         NOT NULL,
            action         TEXT         NOT NULL,
            entity_type    TEXT         NOT NULL,
            entity_id      TEXT         NOT NULL,
            description    TEXT         NOT NULL,
            metadata       JSON,
            monetary_value DECIMAL(12, 4),
            cost_centre    TEXT,
            created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

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
