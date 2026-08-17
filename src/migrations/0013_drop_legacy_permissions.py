"""
Migration: drop_legacy_permissions

The field and crop routes originally gated on ad-hoc permissions
(create_field, create_crop, list_fields) seeded in 0010. Those routes now use
the design taxonomy instead:

    list_fields  -> fields.view
    create_field -> fields.edit
    create_crop  -> crops.log

So the three legacy permissions are dead. This removes them and their role
grants, leaving the catalog exactly matching the Access-control design (no
stray "Other" group). DML only, so the migration runs atomically.
"""

import duckdb

LEGACY = ["create_field", "create_crop", "list_fields"]


def up(conn: duckdb.DuckDBPyConnection) -> None:
    """Apply the migration."""
    placeholders = ", ".join("?" for _ in LEGACY)
    # Drop role grants first, then the permissions themselves.
    conn.execute(
        f"""
        DELETE FROM v1.role_permissions
        WHERE permission_id IN (
            SELECT id FROM v1.permissions WHERE name IN ({placeholders})
        )
        """,
        LEGACY,
    )
    conn.execute(
        f"DELETE FROM v1.permissions WHERE name IN ({placeholders})",
        LEGACY,
    )
