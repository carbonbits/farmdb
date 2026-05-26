from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from enum import Enum

from config.utils import get_version_from_pyproject


class Environment(str, Enum):
    DEV = "dev"
    PROD = "prod"

class Settings(BaseSettings):
    environment: Environment = Environment.DEV
    version: Optional[str] = get_version_from_pyproject()
    database_path: Optional[str] = "farm.db"

    # Platform API OpenFGA authz checks
    platform_api_url: str = "https://api.carbonbits.work"
    cf_access_client_id: Optional[str] = None
    cf_access_client_secret: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()