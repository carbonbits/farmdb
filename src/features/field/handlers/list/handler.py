"""
listFields handler.

Transport-agnostic business logic, called by the REST router. Returns the
authenticated user's fields.
"""

from __future__ import annotations

import duckdb

from features.field.models.field import FarmField


async def list_fields(
    conn: duckdb.DuckDBPyConnection,
    user_id: str,
) -> list[FarmField]:
    rows = conn.execute(
        """
        SELECT id, name, description
        FROM v1.fields
        WHERE user_id = ?
        ORDER BY created_at
        """,
        [user_id],
    ).fetchall()

    return [FarmField(id=row[0], name=row[1], description=row[2]) for row in rows]
