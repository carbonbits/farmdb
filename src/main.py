from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from apps.api.middleware.spa import SPAMiddleware, spa_directory
from apps.api.utilities import api_tags_metadata
from config.settings import settings
from core.auth.router import router as auth_router
from core.storage.database import DB
from features.field.router import router as fields_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    DB.connect()
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
application.include_router(auth_router)
application.add_middleware(SPAMiddleware)

if spa_directory.exists():
    application.mount("/_next", StaticFiles(directory=spa_directory / "_next"), name="next-static")


if __name__ == "__main__":
    uvicorn.run(application, host="0.0.0.0", port=5700)
