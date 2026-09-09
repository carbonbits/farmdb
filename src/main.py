from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from duckling import init_duckling
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from ulid import ULID

from apps.api.middleware.spa import SPAMiddleware, spa_directory
from apps.api.utilities import api_tags_metadata
from config.settings import settings
from core.auth.router import router as auth_router
from core.authz.router import router as authz_router
from core.config.service import ConfigService
from core.storage.database import DB
from features.apikey.router import router as api_keys_router
from features.crop.router import router as crops_router
from features.field.router import router as fields_router
from features.geo.router import router as maps_router
from utils.errors import install_error_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    DB.connect()
    # Bind Duckling to the shared connection. No document_models: schemas are
    # owned by the migration runner, so we skip Duckling's auto CREATE TABLE.
    await init_duckling(connection=DB.get_connection())
    # A stable farmId, created on first boot and left alone after.
    ConfigService().get_or_create("farmId", lambda: str(ULID()))
    yield
    DB.disconnect()


application = FastAPI(
    title="FarmDB",
    description="Profesional farm management tooling",
    terms_of_service="https://farmdb.io/terms/",
    version=settings.version,
    lifespan=lifespan,
    openapi_tags=api_tags_metadata,
)

application.include_router(fields_router)
application.include_router(api_keys_router)
application.include_router(auth_router)
application.include_router(authz_router)
application.include_router(crops_router)
application.include_router(maps_router)
application.add_middleware(SPAMiddleware)

# Services raise plain errors so they stay usable away from HTTP; this is where
# they become status codes, for every feature at once.
install_error_handlers(application)

if (spa_directory / "_next").exists():
    application.mount(
        "/_next", StaticFiles(directory=spa_directory / "_next"), name="next-static"
    )

if __name__ == "__main__":
    reload = settings.should_reload

    uvicorn.run(
        "main:application" if reload else application,
        host=settings.api_host,
        port=settings.api_port,
        reload=reload,
        reload_dirs=[str(Path(__file__).parent)] if reload else None,
    )
