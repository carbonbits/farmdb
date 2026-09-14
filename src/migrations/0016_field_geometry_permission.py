"""
Migration: field_geometry_permission

Splits drawing a boundary out of editing a field.

Until now one key, fields.edit, meant both "create and rename fields" and "draw
and reshape their boundaries". Those are different rights on a farm. A field's
edge is what every area, yield and cost per hectare is derived from, and moving
it silently reprices the season; naming a field does not. So the boundary gets
its own permission and the layer registry points at it (see 0015):

    fields.edit      the field record: create it, rename it, edit its details
    fields.geometry  the shape: draw, reshape or remove a boundary on the map

Who gets the new key: every role that already holds fields.edit. That preserves
what each role can do today — administrator, manager and agronomist drew
boundaries yesterday and still can — while making the right explicit, so a farm
that wants a hand to rename fields without moving fences now has somewhere to
say so. Nobody gains anything they did not already have.

DML only, so this runs inside the runner's transaction.
"""

import duckdb
from ulid import ULID

PERMISSION = (
    "fields.geometry",
    "Fields & mapping",
    "Draw, reshape and remove boundaries on the map",
)

# fields.edit stops covering the map, so its description stops claiming to.
EDIT_DESCRIPTION = "Create and rename fields, and edit their details"


def up(conn: duckdb.DuckDBPyConnection) -> None:
    """Apply the migration."""
    name, group, description = PERMISSION

    existing = conn.execute(
        "SELECT id FROM v1.permissions WHERE name = ?", [name]
    ).fetchone()

    if existing:
        permission_id = existing[0]
        conn.execute(
            "UPDATE v1.permissions SET group_name = ?, description = ? WHERE id = ?",
            [group, description, permission_id],
        )
    else:
        permission_id = str(ULID())
        conn.execute(
            "INSERT INTO v1.permissions (id, name, description, group_name) "
            "VALUES (?, ?, ?, ?)",
            [permission_id, name, description, group],
        )

    conn.execute(
        "UPDATE v1.permissions SET description = ? WHERE name = 'fields.edit'",
        [EDIT_DESCRIPTION],
    )

    # Every role holding fields.edit today keeps drawing boundaries tomorrow.
    holders = conn.execute(
        """
        SELECT rp.role_id
        FROM v1.role_permissions rp
        JOIN v1.permissions p ON p.id = rp.permission_id
        WHERE p.name = 'fields.edit'
        """
    ).fetchall()

    for (role_id,) in holders:
        already = conn.execute(
            "SELECT id FROM v1.role_permissions "
            "WHERE role_id = ? AND permission_id = ?",
            [role_id, permission_id],
        ).fetchone()

        if not already:
            conn.execute(
                "INSERT INTO v1.role_permissions (id, role_id, permission_id) "
                "VALUES (?, ?, ?)",
                [str(ULID()), role_id, permission_id],
            )
