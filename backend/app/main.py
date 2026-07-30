"""
TrustChain-5G Backend Enterprise Application Entry Point.

Initializes FastAPI server instance with robust CORS, async MongoDB motor pooling,
request telemetry logging middleware, global error handling, and V1 API routing architecture.
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.client import Database
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.error_handling import GlobalErrorHandlingMiddleware, setup_exception_handlers
from app.api.v1 import api_router
from app.simulator.routers.nodes import router as simulator_nodes_router
from app.simulator.services.simulation_service import simulation_service
from app.edge.routers import edge_router
from app.edge.services import edge_simulation_service

# Initialize structured logging
logger = logging.getLogger("trustchain.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and teardown lifecycle management.
    Handles asynchronous MongoDB connection initialization and clean disconnection.
    """
    logger.info(f"Initializing {settings.PROJECT_NAME} ({settings.VERSION}) under [{settings.ENVIRONMENT}] mode...")
    # Attempt DB connection
    await Database.connect_to_mongo()
    # Start background 5G network & edge feature simulation daemons
    await simulation_service.start()
    await edge_simulation_service.start()
    logger.info("TrustChain-5G Server ready to accept incoming 5G telemetry and dashboard connections.")
    
    yield
    
    # Graceful server shutdown
    logger.info("Initiating elegant shutdown of TrustChain-5G backend engine...")
    await edge_simulation_service.stop()
    await simulation_service.stop()
    await Database.close_mongo_connection()
    logger.info("Shutdown lifecycle complete.")


def create_application() -> FastAPI:
    """
    Factory function synthesizing enterprise FastAPI platform instance.
    """
    app = FastAPI(
        title="TrustChain-5G Core Engine",
        description="Intelligent Cybersecurity Platform Architecture for Advanced 5G Communication Networks (Sprint 0 Deliverable)",
        version=settings.VERSION,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/api/v1/openapi.json"
    )

    # Configure CORS Middleware for React Vite Dashboard
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time-Ms"]
    )

    # Attach Enterprise Telemetry Logging and Error Defense Middleware
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(GlobalErrorHandlingMiddleware)
    setup_exception_handlers(app)

    # Mount V1 API Master Router
    app.include_router(api_router, prefix=settings.API_V1_STR)
    
    # Mount Sprint 1.1 Network Node Management Simulation Router directly under /api/nodes as specified
    app.include_router(simulator_nodes_router, prefix="/api/nodes")
    # Also include under v1 prefix for unified frontend client configurations
    app.include_router(simulator_nodes_router, prefix=f"{settings.API_V1_STR}/nodes-sim")

    # Mount Sprint 1.2 Edge Server & Feature Extraction Router directly under /api/edge
    app.include_router(edge_router, prefix="/api")
    app.include_router(edge_router, prefix=f"{settings.API_V1_STR}")

    @app.get("/", tags=["System Status & Health Check"], summary="Root API Gateway Welcome Endpoint")
    async def root_welcome():
        return {
            "platform": settings.PROJECT_NAME,
            "milestone": settings.SPRINT,
            "status": "Operational Foundation Online",
            "docs_url": "/docs",
            "health_check": f"{settings.API_V1_STR}/health",
            "version_api": f"{settings.API_V1_STR}/version"
        }

    return app


# Singleton ASGI application export for Uvicorn
app = create_application()


if __name__ == "__main__":
    import uvicorn
    logger.info("Launching standalone local Uvicorn development server on port 8000...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
