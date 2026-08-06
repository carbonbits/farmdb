"""
Migration: create_rbac_tables

Basic RBAC: roles and permissions, plus groups that bundle roles for
bulk assignment. A user's effective permissions are the union of
permissions from roles assigned directly (user_roles) and roles granted
through group membership (user_groups -> group_roles).

No foreign keys (per convention): *_id columns are plain id columns.

Seeds an "owner" role covering every permission gated today (create_crop,
create_field, list_fields). New users are granted "owner" on creation
(see AuthService.create_user) since there is no invite/admin flow yet.
"""

import duckdb
from ulid import ULID


def up(conn: duckdb.DuckDBPyConnection) -> None:
    """Apply the migration."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.roles (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.permissions (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.role_permissions (
            id TEXT PRIMARY KEY,
            role_id TEXT NOT NULL,
            permission_id TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.groups (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.group_roles (
            id TEXT PRIMARY KEY,
            group_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.user_roles (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.user_groups (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            group_id TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON v1.role_permissions(role_id)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id "
        "ON v1.role_permissions(permission_id)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_group_roles_group_id ON v1.group_roles(group_id)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON v1.user_roles(user_id)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON v1.user_groups(user_id)"
    )

    # Seed: "owner" role covering every permission gated today.
    owner_role_id = str(ULID())
    conn.execute(
        "INSERT INTO v1.roles (id, name, description) VALUES (?, 'owner', ?)",
        [owner_role_id, "Full access to all farm operations"],
    )

    permission_names = ["create_crop", "create_field", "list_fields"]
    for name in permission_names:
        permission_id = str(ULID())
        conn.execute(
            "INSERT INTO v1.permissions (id, name) VALUES (?, ?)",
            [permission_id, name],
        )
        conn.execute(
            "INSERT INTO v1.role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)",
            [str(ULID()), owner_role_id, permission_id],
        )
