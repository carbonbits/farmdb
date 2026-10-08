"""
The steps the app takes before it does any work, shared by the API and the CLI.

A command that runs the app's own handlers, such as the demo seed, needs the
same database, Duckling binding and farm id the API sets up when it starts.
Keeping the steps in one place means the two cannot drift apart.
"""

from duckling import init_duckling
from ulid import ULID

from core.config.service import ConfigService
from core.storage.database import DB


async def start_core() -> None:
    """Open the database, bind Duckling to it and make sure the farm has an id."""
    DB.connect()
    # Bind Duckling to the shared connection. No document_models: schemas are
    # owned by the migration runner, so we skip Duckling's auto CREATE TABLE.
    await init_duckling(connection=DB.get_connection())
    # A stable farmId, created on first boot and left alone after.
    ConfigService().get_or_create("farmId", lambda: str(ULID()))


def stop_core() -> None:
    """Close the database."""
    DB.disconnect()
