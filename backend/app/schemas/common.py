"""
TrustChain-5G API Schemas and Transfer Validations.

Defines standardized Pydantic data transfer objects (DTOs) for API request payloads,
token authentication exchanges, and generic API status acknowledgments.
"""

from datetime import datetime, timezone
from typing import Any, Optional, List, Dict
from pydantic import BaseModel, Field


class APIResponse(BaseModel):
    """Standardized wrapper for consistent API JSON responses."""
    success: bool = True
    message: str = "Operation completed successfully."
    data: Optional[Any] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PaginatedResponse(BaseModel):
    """Standardized wrapper for paginated collection queries."""
    success: bool = True
    total_count: int = 0
    page: int = 1
    page_size: int = 20
    data: List[Any] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TokenPayload(BaseModel):
    """Schema representing JWT bearer credentials issued upon login."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400  # seconds in 24h
    role: str = "Viewer"
    username: str = "user@trustchain5g.org"
    avatar_url: Optional[str] = None


class LoginRequest(BaseModel):
    """Input validation schema for user login authentication requests."""
    username_or_email: str = Field(..., description="User electronic mail address or handle")
    password: str = Field(..., min_length=6, description="Account passphrase")
    requested_role_demo: Optional[str] = Field(default=None, description="Optional role selector for Sprint 0 mock authentication demonstrations")


class HealthResponse(BaseModel):
    """Schema representing platform subsystem health status diagnostic."""
    status: str = "healthy"
    version: str = "0.1.0-sprint.0"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    mongodb_connected: bool = False
    active_services: List[str] = Field(default_factory=lambda: ["API Engine", "JWT Auth Foundation", "Motor Asynchronous DB Interface"])


class VersionResponse(BaseModel):
    """Schema representing versioning and sprint milestone metadata."""
    project_name: str = "TrustChain-5G"
    sprint_identifier: str = "Sprint 0 – Project Foundation & Architecture"
    api_version: str = "v1"
    release_date: str = "2026-07-27"
    modules_ready: Dict[str, str] = Field(
        default_factory=lambda: {
            "network_simulation": "Scaffold Ready (Future Sprint)",
            "ml_intrusion_detection": "Scaffold Ready (Future Sprint)",
            "federated_learning": "Scaffold Ready (Future Sprint)",
            "adaptive_trust_engine": "Scaffold Ready (Future Sprint)",
            "blockchain_storage": "Scaffold Ready (Future Sprint)",
            "security_controller": "Scaffold Ready (Future Sprint)"
        }
    )
