"""
TrustChain-5G Enterprise Core Configuration Module.

Manages application settings loaded from environment variables using Pydantic Settings v2.
Ensures strong typing and validation for DB credentials, security tokens, and operational toggles.
"""

import json
from typing import Any, List, Optional, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Core Application Settings architecture for TrustChain-5G.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # General Settings
    PROJECT_NAME: str = "TrustChain-5G"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    VERSION: str = "0.1.0-sprint.0"
    SPRINT: str = "Sprint 0 - Foundation & Architecture"

    # MongoDB Architecture Settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "trustchain_5g"
    MONGODB_MIN_POOL_SIZE: int = 10
    MONGODB_MAX_POOL_SIZE: int = 100

    # Security & Authentication Foundation
    JWT_SECRET_KEY: str = Field(
        default="trustchain_5g_enterprise_secret_key_change_in_prod",
        description="Secret key for JWT token generation and validation"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 Hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS Origins Support
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse CORS origins from JSON string or comma-separated list if needed."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [v]
        elif isinstance(v, list):
            return v
        return []

    # Module Feature Flags (Sprint 0 - Set to False per requirement to NOT implement active logic yet)
    ENABLE_NETWORK_SIMULATION: bool = False
    ENABLE_ML_INTRUSION: bool = False
    ENABLE_FEDERATED_LEARNING: bool = False
    ENABLE_BLOCKCHAIN_STORAGE: bool = False
    ENABLE_TRUST_ENGINE: bool = False
    ENABLE_SECURITY_CONTROLLER: bool = False


# Instantiate singleton global configuration
settings = Settings()
