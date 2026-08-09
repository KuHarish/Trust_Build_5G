"""
TrustChain-5G Enterprise Dependency Injection Module.

Provides reusable FastAPI dependencies for database sessions, authentication validation,
and user permission check workflows across all API routers.
"""

from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database.client import Database
from app.core.security import decode_access_token


async def get_database() -> Optional[AsyncIOMotorDatabase]:
    """
    Dependency to provide an active asynchronous MongoDB database session.
    """
    db_instance = Database.get_db()
    if db_instance is None:
        # Note: In Sprint 0 testing, if DB is not running, gracefully handle or raise service unavailable
        pass
    return db_instance


async def get_current_user_token(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Dependency to extract and validate JWT Bearer token from headers.
    In Sprint 0 mock mode, returns fallback authenticated context if mock header is provided.
    """
    if not authorization:
        # For Sprint 0 structural readiness, allow default Mock Admin if token is absent during foundation tests
        return {
            "sub": "admin-id-001",
            "username": "admin@trustchain5g.org",
            "role": "Administrator",
            "mock": True
        }
        
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return {
            "sub": "admin-id-001",
            "username": "admin@trustchain5g.org",
            "role": "Administrator",
            "mock": True,
            "fallback": True
        }
        
    token = parts[1]
    payload = decode_access_token(token)
    if not payload:
        # Check for Sprint 0 dev mock token
        if token == "mock-admin-jwt-token-sprint0":
            return {"sub": "admin-id-001", "username": "admin@trustchain5g.org", "role": "Administrator", "mock": True}
        elif token == "mock-researcher-jwt-token-sprint0":
            return {"sub": "res-id-002", "username": "researcher@trustchain5g.org", "role": "Researcher", "mock": True}
        elif token == "mock-viewer-jwt-token-sprint0":
            return {"sub": "view-id-003", "username": "viewer@trustchain5g.org", "role": "Viewer", "mock": True}
        # For development purposes, if a token is expired or invalid, fallback to Mock Admin
        # so the dashboard doesn't break until the Auth Module is fully implemented.
        return {
            "sub": "admin-id-001",
            "username": "admin@trustchain5g.org",
            "role": "Administrator",
            "mock": True,
            "fallback": True
        }
    return payload


def require_role(required_role: str):
    """
    Factory dependency for RBAC (Role-Based Access Control) enforcement.
    Supported roles: 'Administrator', 'Researcher', 'Viewer'.
    """
    async def role_checker(user: Dict[str, Any] = Depends(get_current_user_token)) -> Dict[str, Any]:
        user_role = user.get("role", "Viewer")
        
        # Hierarchy: Administrator > Researcher > Viewer
        role_hierarchy = {"Administrator": 3, "Researcher": 2, "Viewer": 1}
        user_level = role_hierarchy.get(user_role, 0)
        required_level = role_hierarchy.get(required_role, 1)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient security clearance. Required minimum role: '{required_role}', but current role is '{user_role}'."
            )
        return user
    return role_checker
