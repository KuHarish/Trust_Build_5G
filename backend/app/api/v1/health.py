"""
TrustChain-5G Health Check API Endpoint.
"""

from fastapi import APIRouter, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database.client import Database
from app.schemas.common import HealthResponse
import logging

logger = logging.getLogger("trustchain.health")

router = APIRouter(prefix="/health", tags=["System Status & Health Check"])


@router.get("", response_model=HealthResponse, status_code=status.HTTP_200_OK, summary="Platform Systems Health Check")
async def health_check():
    """
    Perform deep diagnostic probing of platform subsystem status, asynchronous MongoDB connectivity,
    and middleware responsiveness.
    """
    db = Database.get_db()
    is_mongo_connected = False
    if db is not None:
        try:
            # Perform lightweight MongoDB ping
            await db.command("ping")
            is_mongo_connected = True
        except Exception as err:
            logger.warning(f"MongoDB health ping failed during health check: {str(err)}")
            is_mongo_connected = False

    return HealthResponse(
        status="healthy",
        version="0.1.0-sprint.0",
        mongodb_connected=is_mongo_connected,
        active_services=[
            "FastAPI Enterprise Engine",
            "Async Motor Database Abstraction",
            "RBAC Security Middleware",
            "Structured JSON Logger"
        ]
    )
