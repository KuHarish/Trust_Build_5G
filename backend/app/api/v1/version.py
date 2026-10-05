"""
TrustChain-5G Version API Endpoint.
"""

from fastapi import APIRouter, status
from app.schemas.common import VersionResponse
from app.core.config import settings

router = APIRouter(prefix="/version", tags=["System Status & Health Check"])


@router.get("", response_model=VersionResponse, status_code=status.HTTP_200_OK, summary="Retrieve Application Versioning & Sprint Milestone")
async def get_version():
    """
    Return platform versioning, active Sprint identifier, release timeline, and modular subsystem feature flags.
    """
    return VersionResponse(
        project_name=settings.PROJECT_NAME,
        sprint_identifier=settings.SPRINT,
        api_version=settings.API_V1_STR,
        release_date="2026-07-27",
        modules_ready={
            "network_simulation": "Scaffold Ready (Sprint 0 - No business logic)",
            "ml_intrusion_detection": "Scaffold Ready (Sprint 0 - No business logic)",
            "federated_learning": "Scaffold Ready (Sprint 0 - No business logic)",
            "adaptive_trust_engine": "Scaffold Ready (Sprint 0 - No business logic)",
            "blockchain_storage": "Scaffold Ready (Sprint 0 - No business logic)",
            "security_controller": "Scaffold Ready (Sprint 0 - No business logic)",
            "analytics_dashboard": "Scaffold Ready (Sprint 0 - Mock widgets)"
        }
    )
