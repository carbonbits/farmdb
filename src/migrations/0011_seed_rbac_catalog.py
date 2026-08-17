"""
Migration: seed_rbac_catalog

Expands the minimal RBAC seed from 0010 into the full permission catalog and
role set the Access-control UI manages: 8 permission groups (~22 permissions,
each with a human description) and 7 roles with explicit grants.

Design source: "Wakulima Access Control" — permission keys are dotted
(fields.view, crops.log, …) and grouped for display.

Columns added:
  - v1.permissions.group_name  — display grouping ("group" is a reserved word)
  - v1.roles.display_name      — human label ("Farm manager"); name stays machine-safe
  - v1.roles.is_system         — shipped with the edition
  - v1.roles.is_locked         — permissions fixed; clone to customise

The existing "owner" role (seeded in 0010, and auto-granted to every new user
by AuthService) is upgraded in place: it keeps its current
create_field/create_crop/list_fields grants so existing route gates keep
working, and additionally receives the entire new catalog — it is the
all-permissions role. No foreign keys, per convention.
"""

import duckdb
from ulid import ULID

# DuckDB auto-commits DDL, so the ALTER TABLE statements below cannot run inside
# the runner's wrapping transaction ("another transaction has altered this
# table"). Apply non-atomically, like 0007_drop_fields_geom. The catalog/role
# seeding is written idempotently so a re-run after a partial failure is safe.
atomic = False

# (key, group, description)
PERMISSIONS = [
    ("fields.view", "Fields & mapping", "View fields, maps and boundaries"),
    ("fields.edit", "Fields & mapping", "Draw and edit field boundaries"),
    ("fields.delete", "Fields & mapping", "Archive or delete a field"),
    ("crops.view", "Crops & plantings", "View plantings and crop plans"),
    ("crops.log", "Crops & plantings", "Log plantings, sprays and harvests"),
    ("crops.plan", "Crops & plantings", "Manage crop plans and rotations"),
    ("livestock.view", "Livestock", "View herds and animal records"),
    ("livestock.log", "Livestock", "Record health, weights and movements"),
    ("inventory.view", "Inventory & stores", "View stock levels"),
    ("inventory.adjust", "Inventory & stores", "Issue stock and record adjustments"),
    ("inventory.purchase", "Inventory & stores", "Raise purchase orders"),
    ("finance.view", "Finance", "View costs, revenue and margins"),
    ("finance.record", "Finance", "Record payments and invoices"),
    ("finance.export", "Finance", "Export financial reports"),
    ("tasks.view", "Tasks & labour", "See tasks assigned to them"),
    ("tasks.assign", "Tasks & labour", "Create and assign tasks to others"),
    ("labour.rates", "Tasks & labour", "Manage worker rates and payroll lines"),
    ("users.invite", "Access control", "Invite and deactivate users"),
    ("roles.manage", "Access control", "Create roles and edit permissions"),
    ("audit.view", "Access control", "Read the audit log"),
    ("api.tokens", "System", "Issue and revoke API tokens"),
    ("backup.run", "System", "Run and restore backups"),
    ("plugins.manage", "System", "Install and configure plugins"),
]

ALL_KEYS = [p[0] for p in PERMISSIONS]

# (name, display_name, description, is_system, is_locked, permission_keys)
# "*" means every catalog permission.
ROLES = [
    (
        "manager",
        "Farm manager",
        "Runs day-to-day operations across every module. No system administration.",
        True,
        False,
        [
            "fields.view", "fields.edit", "crops.view", "crops.log", "crops.plan",
            "livestock.view", "livestock.log", "inventory.view", "inventory.adjust",
            "inventory.purchase", "finance.view", "finance.record", "tasks.view",
            "tasks.assign", "labour.rates", "users.invite", "audit.view",
        ],
    ),
    (
        "agronomist",
        "Agronomist",
        "Plans crops and rotations and reviews field records. No financial access.",
        False,
        False,
        [
            "fields.view", "fields.edit", "crops.view", "crops.log", "crops.plan",
            "inventory.view", "tasks.view", "tasks.assign",
        ],
    ),
    (
        "supervisor",
        "Field supervisor",
        "Assigns and closes tasks and records field activity for a crew.",
        False,
        False,
        [
            "fields.view", "crops.view", "crops.log", "livestock.view", "livestock.log",
            "inventory.view", "inventory.adjust", "tasks.view", "tasks.assign",
        ],
    ),
    (
        "worker",
        "Field worker",
        "Logs work against assigned tasks from the mobile app.",
        False,
        False,
        ["fields.view", "crops.view", "crops.log", "livestock.log", "tasks.view"],
    ),
    (
        "accountant",
        "Accountant",
        "Costs, revenue and exports. Read-only on production records.",
        False,
        False,
        [
            "fields.view", "crops.view", "inventory.view", "inventory.purchase",
            "finance.view", "finance.record", "finance.export", "labour.rates",
        ],
    ),
    (
        "viewer",
        "Read only",
        "Sees everything, changes nothing. For auditors, lenders and extension officers.",
        True,
        True,
        [
            "fields.view", "crops.view", "livestock.view", "inventory.view",
            "finance.view", "tasks.view", "audit.view",
        ],
    ),
]


def up(conn: duckdb.DuckDBPyConnection) -> None:
    """Apply the migration."""
    # 1. Schema: display grouping on permissions; system/locked + label on roles.
    conn.execute("ALTER TABLE v1.permissions ADD COLUMN IF NOT EXISTS group_name TEXT")
    conn.execute("ALTER TABLE v1.roles ADD COLUMN IF NOT EXISTS display_name TEXT")
    conn.execute(
        "ALTER TABLE v1.roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE"
    )
    conn.execute(
        "ALTER TABLE v1.roles ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE"
    )

    # 2. Seed the permission catalog (idempotent: skip keys already present).
    for name, group, description in PERMISSIONS:
        exists = conn.execute(
            "SELECT id FROM v1.permissions WHERE name = ?", [name]
        ).fetchone()
        if exists:
            conn.execute(
                "UPDATE v1.permissions SET group_name = ?, description = ? WHERE name = ?",
                [group, description, name],
            )
        else:
            conn.execute(
                "INSERT INTO v1.permissions (id, name, description, group_name) "
                "VALUES (?, ?, ?, ?)",
                [str(ULID()), name, description, group],
            )

    def perm_id(name: str) -> str:
        return conn.execute(
            "SELECT id FROM v1.permissions WHERE name = ?", [name]
        ).fetchone()[0]

    def grant(role_id: str, permission_key: str) -> None:
        already = conn.execute(
            "SELECT id FROM v1.role_permissions WHERE role_id = ? AND permission_id = ?",
            [role_id, perm_id(permission_key)],
        ).fetchone()
        if not already:
            conn.execute(
                "INSERT INTO v1.role_permissions (id, role_id, permission_id) "
                "VALUES (?, ?, ?)",
                [str(ULID()), role_id, perm_id(permission_key)],
            )

    # 3. Upgrade the existing "owner" role in place → the all-permissions role.
    owner_id = conn.execute(
        "SELECT id FROM v1.roles WHERE name = 'owner'"
    ).fetchone()[0]
    conn.execute(
        "UPDATE v1.roles SET display_name = 'Owner', is_system = TRUE, is_locked = TRUE, "
        "description = ? WHERE id = ?",
        [
            "Full control of this instance, including access control, API tokens and backups.",
            owner_id,
        ],
    )
    for key in ALL_KEYS:
        grant(owner_id, key)

    # 4. Seed the remaining roles and their grants.
    for name, display_name, description, is_system, is_locked, keys in ROLES:
        existing = conn.execute(
            "SELECT id FROM v1.roles WHERE name = ?", [name]
        ).fetchone()
        if existing:
            role_id = existing[0]
            conn.execute(
                "UPDATE v1.roles SET display_name = ?, description = ?, "
                "is_system = ?, is_locked = ? WHERE id = ?",
                [display_name, description, is_system, is_locked, role_id],
            )
        else:
            role_id = str(ULID())
            conn.execute(
                "INSERT INTO v1.roles (id, name, description, display_name, "
                "is_system, is_locked) VALUES (?, ?, ?, ?, ?, ?)",
                [role_id, name, description, display_name, is_system, is_locked],
            )
        for key in keys:
            grant(role_id, key)
