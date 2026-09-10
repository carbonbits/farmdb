import secrets
from enum import Enum
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

from .utils import get_version_from_pyproject


class Environment(str, Enum):
    DEV = "dev"
    PROD = "prod"


class Settings(BaseSettings):
    environment: Environment = Environment.DEV
    version: Optional[str] = get_version_from_pyproject()
    database_path: Optional[str] = "farm.db"

    # JWT Configuration
    jwt_secret_key: str = secrets.token_urlsafe(32)
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 30

    # WebAuthn Configuration
    # A passkey ceremony is checked against the origin the browser reports. That
    # is the API's own origin in normal use, because the API serves the app; set
    # WEBAUTHN_ORIGIN to the Next dev server's origin to work on passkeys from
    # `pnpm dev`.
    webauthn_rp_id: str = "localhost"
    webauthn_rp_name: str = "FarmDB"
    webauthn_origin: str = "http://localhost:5700"

    # Browser origins allowed to call this API cross-origin. Nothing needs it
    # when the API serves the app, which is why the list is empty by default;
    # add an origin to reach the API from a web app served elsewhere.
    cors_origins: list[str] = []

    # Geospatial Configuration
    # The storage CRS, as an SRID for the geometry column and as the URI the OGC
    # documents quote. The default is CRS84 — EPSG:4326 with longitude first,
    # the axis order GeoJSON uses and therefore the order this API speaks.
    geo_srid: int = 4326
    geo_crs: str = "http://www.opengis.net/def/crs/OGC/1.3/CRS84"

    # API Server
    # Where main.py binds when it runs the app itself. api_reload left unset
    # follows the environment — autoreload in dev, never in prod — so the usual
    # case needs no .env entry; set API_RELOAD=false to hold it off in dev.
    api_host: str = "0.0.0.0"
    api_port: int = 5700
    api_reload: Optional[bool] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def is_dev(self) -> bool:
        return self.environment is Environment.DEV

    @property
    def should_reload(self) -> bool:
        """Whether uvicorn watches the source tree and restarts on a change."""
        return self.is_dev if self.api_reload is None else self.api_reload


settings = Settings()
