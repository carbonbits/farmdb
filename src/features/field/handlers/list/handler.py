"""
listFields handler.

Transport-agnostic business logic, called by the REST router. Returns the
authenticated user's fields, each with the boundary it encloses when one has
been drawn — the read itself lives in features/field/queries.py, which both
this and the create handler go through so a field means the same thing however
it was asked for.
"""

from __future__ import annotations

import duckdb

from features.field.models.field import FarmField
from features.field.queries import read_fields


async def list_fields(
    conn: duckdb.DuckDBPyConnection,
    user_id: str,
) -> list[FarmField]:
    return read_fields(conn, user_id)
