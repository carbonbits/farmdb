"""
Authorization — DuckDB-backed RBAC via duckling.

A user's effective permissions are the union of permissions granted by
roles assigned directly (UserRole) and roles granted through group
membership (UserGroup -> GroupRole). `require_permission` is the FastAPI
dependency routes use; it resolves the principal and raises 403 when the
permission is missing, so call sites need only one dependency.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import Depends, HTTPException, status

from ulid import ULID

from core.auth.principal import Principal
from core.auth.resolver import require_principal
from core.authz.models import Group, Permission, Role
from core.storage.database import db


def _new_id() -> str:
    return str(ULID())


class AuthzService:
    async def can(self, user_id: str, action: str) -> bool:
        # Single raw query on a private cursor. Kept off duckling deliberately:
        # duckling dispatches every query through asyncio.to_thread on one
        # shared connection, so concurrent authorization checks would race.
        row = db().execute(
            """
            SELECT 1
            FROM v1.permissions p
            JOIN v1.role_permissions rp ON rp.permission_id = p.id
            WHERE p.name = ?
              AND rp.role_id IN (
                SELECT role_id FROM v1.user_roles WHERE user_id = ?
                UNION
                SELECT gr.role_id
                FROM v1.user_groups ug
                JOIN v1.group_roles gr ON gr.group_id = ug.group_id
                WHERE ug.user_id = ?
              )
            LIMIT 1
            """,
            [action, user_id, user_id],
        ).fetchone()
        return row is not None

    # Read models for the Access-control admin API. Raw SQL keeps the joins and
    # aggregate counts straightforward; mutations still go through duckling below.

    def list_permissions(self) -> list[dict]:
        """The full permission catalog, ordered for grouped display."""
        rows = db().execute(
            """
            SELECT name, group_name, description
            FROM v1.permissions
            ORDER BY group_name NULLS LAST, name
            """
        ).fetchall()
        return [{"name": r[0], "group": r[1], "description": r[2]} for r in rows]

    def list_roles(self) -> list[dict]:
        """Every role with its permission keys and how many people hold it."""
        roles = db().execute(
            """
            SELECT id, name, display_name, description, is_system, is_locked
            FROM v1.roles
            ORDER BY is_system DESC, name
            """
        ).fetchall()
        return [self._role_summary(r) for r in roles]

    def get_role(self, role_id: str) -> dict | None:
        """One role with its permission keys and the members holding it."""
        row = db().execute(
            """
            SELECT id, name, display_name, description, is_system, is_locked
            FROM v1.roles WHERE id = ?
            """,
            [role_id],
        ).fetchone()
        if not row:
            return None

        summary = self._role_summary(row)
        members = db().execute(
            """
            SELECT u.id, u.email, u.display_name
            FROM v1.user_roles ur
            JOIN v1.users u ON u.id = ur.user_id
            WHERE ur.role_id = ?
            ORDER BY u.display_name NULLS LAST, u.email
            """,
            [role_id],
        ).fetchall()
        summary["members"] = [
            {"id": m[0], "email": m[1], "display_name": m[2]} for m in members
        ]
        return summary

    def get_role_by_name(self, name: str) -> dict | None:
        row = db().execute(
            """
            SELECT id, name, display_name, description, is_system, is_locked
            FROM v1.roles WHERE name = ?
            """,
            [name],
        ).fetchone()
        return self._role_summary(row) if row else None

    def _role_summary(self, row: tuple) -> dict:
        role_id = row[0]
        permissions = [
            p[0]
            for p in db().execute(
                """
                SELECT p.name
                FROM v1.role_permissions rp
                JOIN v1.permissions p ON p.id = rp.permission_id
                WHERE rp.role_id = ?
                ORDER BY p.name
                """,
                [role_id],
            ).fetchall()
        ]
        member_count = db().execute(
            "SELECT count(*) FROM v1.user_roles WHERE role_id = ?", [role_id]
        ).fetchone()[0]
        return {
            "id": role_id,
            "name": row[1],
            "display_name": row[2],
            "description": row[3],
            "is_system": bool(row[4]),
            "is_locked": bool(row[5]),
            "permissions": permissions,
            "member_count": member_count,
        }

    async def set_role_permissions(
        self, role_id: str, permission_names: list[str]
    ) -> None:
        """Replace a role's entire permission set with `permission_names`."""
        conn = db()
        conn.execute(
            "DELETE FROM v1.role_permissions WHERE role_id = ?", [role_id]
        )
        for name in permission_names:
            perm = conn.execute(
                "SELECT id FROM v1.permissions WHERE name = ?", [name]
            ).fetchone()
            if perm is None:
                continue
            conn.execute(
                "INSERT INTO v1.role_permissions (id, role_id, permission_id) "
                "VALUES (?, ?, ?)",
                [_new_id(), role_id, perm[0]],
            )

    async def remove_role_from_user(self, user_id: str, role_id: str) -> None:
        db().execute(
            "DELETE FROM v1.user_roles WHERE user_id = ? AND role_id = ?",
            [user_id, role_id],
        )

    def get_user_roles(self, user_id: str) -> list[dict]:
        """The roles a user holds directly (for display on /me)."""
        rows = db().execute(
            """
            SELECT r.id, r.name, r.display_name
            FROM v1.user_roles ur
            JOIN v1.roles r ON r.id = ur.role_id
            WHERE ur.user_id = ?
            ORDER BY r.is_system DESC, r.name
            """,
            [user_id],
        ).fetchall()
        return [{"id": r[0], "name": r[1], "display_name": r[2]} for r in rows]

    def get_user_permissions(self, user_id: str) -> list[str]:
        """A user's effective permission names — the union across roles held
        directly and roles granted through group membership."""
        rows = db().execute(
            """
            SELECT DISTINCT p.name
            FROM v1.permissions p
            JOIN v1.role_permissions rp ON rp.permission_id = p.id
            WHERE rp.role_id IN (
                SELECT role_id FROM v1.user_roles WHERE user_id = ?
                UNION
                SELECT gr.role_id
                FROM v1.user_groups ug
                JOIN v1.group_roles gr ON gr.group_id = ug.group_id
                WHERE ug.user_id = ?
            )
            ORDER BY p.name
            """,
            [user_id, user_id],
        ).fetchall()
        return [r[0] for r in rows]

    def list_users_with_roles(self) -> list[dict]:
        """All users, each with the roles they directly hold."""
        users = db().execute(
            """
            SELECT id, email, display_name, is_active
            FROM v1.users
            ORDER BY display_name NULLS LAST, email
            """
        ).fetchall()
        result = []
        for u in users:
            roles = db().execute(
                """
                SELECT r.id, r.name, r.display_name
                FROM v1.user_roles ur
                JOIN v1.roles r ON r.id = ur.role_id
                WHERE ur.user_id = ?
                ORDER BY r.is_system DESC, r.name
                """,
                [u[0]],
            ).fetchall()
            result.append(
                {
                    "id": u[0],
                    "email": u[1],
                    "display_name": u[2],
                    "is_active": bool(u[3]),
                    "roles": [
                        {"id": r[0], "name": r[1], "display_name": r[2]} for r in roles
                    ],
                }
            )
        return result

    # Management — used for seeding/tests and the Access-control admin API.
    # All raw SQL on a private cursor (never duckling) so these are safe to run
    # from concurrent requests. Idempotent inserts preserve prior semantics.

    async def create_role(
        self,
        name: str,
        description: str | None = None,
        display_name: str | None = None,
    ) -> Role:
        conn = db()
        row = conn.execute(
            "SELECT id, name, description, created_at, display_name, is_system, "
            "is_locked FROM v1.roles WHERE name = ?",
            [name],
        ).fetchone()
        if row is None:
            role_id = _new_id()
            conn.execute(
                "INSERT INTO v1.roles (id, name, description, display_name) "
                "VALUES (?, ?, ?, ?)",
                [role_id, name, description, display_name],
            )
            return Role(
                id=role_id, name=name, description=description, display_name=display_name
            )
        return Role(
            id=row[0], name=row[1], description=row[2], created_at=row[3],
            display_name=row[4], is_system=bool(row[5]), is_locked=bool(row[6]),
        )

    async def create_permission(
        self, name: str, description: str | None = None
    ) -> Permission:
        conn = db()
        row = conn.execute(
            "SELECT id, name, description, created_at, group_name "
            "FROM v1.permissions WHERE name = ?",
            [name],
        ).fetchone()
        if row is None:
            perm_id = _new_id()
            conn.execute(
                "INSERT INTO v1.permissions (id, name, description) VALUES (?, ?, ?)",
                [perm_id, name, description],
            )
            return Permission(id=perm_id, name=name, description=description)
        return Permission(
            id=row[0], name=row[1], description=row[2], created_at=row[3],
            group_name=row[4],
        )

    async def create_group(self, name: str, description: str | None = None) -> Group:
        conn = db()
        row = conn.execute(
            "SELECT id, name, description, created_at FROM v1.groups WHERE name = ?",
            [name],
        ).fetchone()
        if row is None:
            group_id = _new_id()
            conn.execute(
                "INSERT INTO v1.groups (id, name, description) VALUES (?, ?, ?)",
                [group_id, name, description],
            )
            return Group(id=group_id, name=name, description=description)
        return Group(id=row[0], name=row[1], description=row[2], created_at=row[3])

    async def grant_permission_to_role(self, role_id: str, permission_id: str) -> None:
        self._link_once(
            "role_permissions", role_id=role_id, permission_id=permission_id
        )

    async def add_role_to_group(self, group_id: str, role_id: str) -> None:
        self._link_once("group_roles", group_id=group_id, role_id=role_id)

    async def assign_role_to_user(self, user_id: str, role_id: str) -> None:
        self._link_once("user_roles", user_id=user_id, role_id=role_id)

    async def add_user_to_group(self, user_id: str, group_id: str) -> None:
        self._link_once("user_groups", user_id=user_id, group_id=group_id)

    def _link_once(self, table: str, **cols: str) -> None:
        """Insert a join-table row unless the same combination already exists."""
        conn = db()
        where = " AND ".join(f"{c} = ?" for c in cols)
        values = list(cols.values())
        existing = conn.execute(
            f"SELECT 1 FROM v1.{table} WHERE {where} LIMIT 1", values
        ).fetchone()
        if existing is not None:
            return
        columns = ", ".join(["id", *cols.keys()])
        placeholders = ", ".join(["?"] * (len(cols) + 1))
        conn.execute(
            f"INSERT INTO v1.{table} ({columns}) VALUES ({placeholders})",
            [_new_id(), *values],
        )


@lru_cache
def get_authz_service() -> AuthzService:
    return AuthzService()


def require_permission(action: str):
    """FastAPI dependency: resolve the principal and enforce `action`, or raise 403."""

    async def _dependency(
        principal: Annotated[Principal, Depends(require_principal)],
        authz: Annotated[AuthzService, Depends(get_authz_service)],
    ) -> Principal:
        if not await authz.can(principal.user_id, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {action}",
            )
        return principal

    return _dependency
