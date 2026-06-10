"""
ConfigService.

Thin accessor over the v1.configuration key/value table. Centralises reads and
writes of app-level configuration so callers don't hand-roll SQL.
"""

from __future__ import annotations

from typing import Callable, Optional

from core.service import Service
from core.storage.database import db


class ConfigService(Service):
    @property
    def service_signature(self) -> str:
        return "config_svc"

    def get(self, key: str) -> Optional[str]:
        """Return the value for key, or None if it is not set."""
        row = (
            db()
            .execute(
                "SELECT value FROM v1.configuration WHERE key = ?",
                [key],
            )
            .fetchone()
        )
        return row[0] if row else None

    def set(self, key: str, value: str, created_by: Optional[str] = None) -> None:
        """Insert or update a configuration value."""
        db().execute(
            """
            INSERT INTO v1.configuration (key, value, created_by)
            VALUES (?, ?, ?)
            ON CONFLICT (key) DO UPDATE
                SET value = excluded.value, updated_at = now()
            """,
            [key, value, created_by],
        )

    def get_or_create(self, key: str, default_factory: Callable[[], str]) -> str:
        """Return the value for key, creating it from default_factory if absent."""
        existing = self.get(key)
        if existing is not None:
            return existing

        value = default_factory()
        self.set(key, value)
        return value
