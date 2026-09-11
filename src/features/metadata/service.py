"""
MetadataService.

Collects the facts about a running instance that belong to no single feature:
which farm this is, what build is serving it, and how much disk the embedded
database has taken. The settings screen shows them and support asks for them
first, which is why they are one document instead of three lookups.

Each fact has its own small builder, so the next one — row counts, the last
backup, installed plugins — is a builder plus a field on FarmMetadata rather
than a rewrite of this one. A builder answers with None when the fact is not
available on this deployment; it never raises, and it never writes. Reporting is
all this service does: the farm id is minted once during startup, and reading it
here must not be what brings it into being.
"""

from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Optional

from config.settings import settings
from core.config.service import ConfigService
from core.service import Service
from features.metadata.schemas import DatabaseMetadata, FarmMetadata


class MetadataService(Service):
    def __init__(self, config: Optional[ConfigService] = None) -> None:
        super().__init__()
        self._config = config or ConfigService()

    @property
    def service_signature(self) -> str:
        return "metadata_svc"

    def collect(self) -> FarmMetadata:
        """Everything the API reports about this instance."""
        farm_id, created_at = self._identity()

        return FarmMetadata(
            farm_id=farm_id,
            created_at=created_at,
            version=settings.version,
            environment=settings.environment,
            database=self._database(),
        )

    def _identity(self) -> tuple[Optional[str], Optional[datetime]]:
        """The farm id as stored, and when it was written — this farm's birthday.

        Startup writes the id, so an instance that has booted always has one.
        Both values come back None rather than a fresh id if it is somehow
        absent: a farm id invented by a GET would be a different id on the next
        process, and a client trusting it would key its data to a ghost.
        """
        row = self._config.get_row("farmId")
        if row is None:
            self.logger.warning("farmId is not set; reporting metadata without it")
            return None, None

        return row.value, row.created_at

    def _database(self) -> DatabaseMetadata:
        """The embedded database's footprint on disk.

        DuckDB holds recent writes in a write-ahead log beside the database file
        until it checkpoints, so the file alone understates the total. Both are
        reported rather than summed, because they answer different questions:
        how large the farm's data is, and how much of it is waiting to be folded
        in. Either can be absent — an in-memory database has no file at all, and
        a checkpointed one has no log.
        """
        path = settings.database_path
        if not path:
            return DatabaseMetadata()

        database = Path(path)

        return DatabaseMetadata(
            path=str(database),
            size_bytes=_file_size(database),
            wal_bytes=_file_size(database.with_name(f"{database.name}.wal")),
        )


def _file_size(path: Path) -> Optional[int]:
    """The file's size in bytes, or None if it is not there to measure."""
    try:
        return path.stat().st_size
    except OSError:
        return None


@lru_cache
def get_metadata_service() -> MetadataService:
    return MetadataService()
