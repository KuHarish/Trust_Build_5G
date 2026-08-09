"""
TrustChain-5G Master V1 API Router Aggregator.

Bundles operational health diagnostics, authentication workflows, and modular cybersecurity endpoints.
"""

from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.version import router as version_router
from app.api.v1.auth import router as auth_router
from app.api.v1.endpoints import (
    nodes_router, traffic_router, attacks_router,
    blockchain_router, ml_router, federated_router, security_router, analytics_router
)

api_router = APIRouter()

# Include Operational Diagnostic Endpoints
api_router.include_router(health_router)
api_router.include_router(version_router)

# Include Authentication Foundation
api_router.include_router(auth_router)

# Include Cybersecurity Platform Module Placeholder Scaffolds
api_router.include_router(nodes_router)
api_router.include_router(traffic_router)
api_router.include_router(attacks_router)
api_router.include_router(blockchain_router)
api_router.include_router(ml_router)
api_router.include_router(federated_router)
api_router.include_router(security_router)
api_router.include_router(analytics_router)
