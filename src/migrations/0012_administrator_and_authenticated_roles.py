"""
Migration: administrator_and_authenticated_roles

Reworks the top of the role hierarchy for the new registration model:

  * The all-access system role seeded as "owner" (0010/0011) is renamed to
    "administrator" (display "Administrator"). Same role id, so every existing
    grant and assignment carries over — it simply keeps all permissions.
  * A new baseline system role "authenticated" (display "Authenticated User")
    is added with no permissions. It exists only to distinguish a signed-in
    user from an anonymous one; the first registrant becomes the Administrator
    and every subsequent registrant gets this role (see AuthService).

Only DML here (no schema changes), so the migration runs atomically.
"""

import duckdb
from ulid import ULID


def up(conn: duckdb.DuckDBPyConnection) -> None:
    """Apply the migration."""
    # Rename owner -> administrator in place (preserves id, grants, assignments).
    conn.execute(
        """
        UPDATE v1.roles
        SET name = 'administrator',
            display_name = 'Administrator',
            is_system = TRUE,
            is_locked = TRUE
        WHERE name = 'owner'
        """
    )

    # Baseline "Authenticated User" role — a marker for signed-in users, no
    # permissions by default. System, but editable so an operator may later
    # grant an org-wide baseline if they choose.
    exists = conn.execute(
        "SELECT id FROM v1.roles WHERE name = 'authenticated'"
    ).fetchone()
    if not exists:
        conn.execute(
            """
            INSERT INTO v1.roles (id, name, description, display_name, is_system, is_locked)
            VALUES (?, 'authenticated', ?, 'Authenticated User', TRUE, FALSE)
            """,
            [
                str(ULID()),
                "Baseline role for any signed-in user. Grants nothing on its own; "
                "the Administrator assigns further roles.",
            ],
        )
