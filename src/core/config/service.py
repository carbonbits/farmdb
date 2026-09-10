"""
ConfigService.

Thin accessor over the v1.configuration key/value table. Centralises reads and
writes of app-level configuration so callers don't hand-roll SQL.

Reads and writes go through the Configuration document, whose primary key is
aliased onto the `key` column. The synchronous duckling calls are deliberate:
they run straight on the shared connection, where the async ones hop through
asyncio.to_thread and would race the way core/authz/service.py describes.
"""

from typing import Callable, Optional

from duckling import DocumentAlreadyExists

from core.config.models import Configuration
from core.service import Service
from utils.time import now_utc


class ConfigService(Service):
    @property
    def service_signature(self) -> str:
        return "config_svc"

    def get(self, key: str) -> Optional[str]:
        """Return the value for key, or None if it is not set."""
        row = Configuration.get_sync(key)

        return row.value if row else None

    def get_row(self, key: str) -> Optional[Configuration]:
        """Return the whole row for key, for callers that need its timestamps."""
        return Configuration.get_sync(key)

    def set(self, key: str, value: str, created_by: Optional[str] = None) -> None:
        """Insert or update a configuration value."""
        existing = Configuration.get_sync(key)

        if existing is None:
            try:
                Configuration(id=key, value=value, created_by=created_by).insert_sync()

                return
            except DocumentAlreadyExists:
                # Written between the read and the insert. Fall through and
                # update it, so two processes booting at once cannot turn a
                # first-boot default into a crash.
                existing = Configuration.get_sync(key)

        existing.value = value
        existing.updated_at = now_utc()
        existing.save_sync()

    def get_or_create(self, key: str, default_factory: Callable[[], str]) -> str:
        """Return the value for key, creating it from default_factory if absent."""
        existing = self.get(key)
        if existing is not None:
            return existing

        value = default_factory()
        self.set(key, value)
        return value
