import secrets
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from enum import Enum

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
    webauthn_rp_id: str = "localhost"
    webauthn_rp_name: str = "FarmDB"
    webauthn_origin: str = "http://localhost:5700"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
