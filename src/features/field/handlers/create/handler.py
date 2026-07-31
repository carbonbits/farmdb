"""
createField handler.

Transport-agnostic business logic, called by the REST router. Persists a field
scoped to the authenticated user and returns the canonical model.
"""

from __future__ import annotations

import duckdb
from ulid import ULID

from features.field.handlers.create.input import CreateFarmFieldInput
from features.field.models.field import FarmField


async def create_field(
    input_: CreateFarmFieldInput,
    conn: duckdb.DuckDBPyConnection,
    user_id: str,
) -> FarmField:
    field_id = str(ULID())

    conn.execute(
        """
        INSERT INTO v1.fields (id, name, description, user_id)
        VALUES (?, ?, ?, ?)
        """,
        [field_id, input_.name, input_.description, user_id],
    )

    row = conn.execute(
        """
        SELECT id, name, description
        FROM v1.fields
        WHERE id = ?
        """,
        [field_id],
    ).fetchone()

    return FarmField(id=row[0], name=row[1], description=row[2])
