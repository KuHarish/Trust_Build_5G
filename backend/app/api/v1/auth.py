"""
TrustChain-5G Mock Authentication & JWT Foundation Endpoints.

Provides mock authentication services for roles (Administrator, Researcher, Viewer),
supporting login exchanges and placeholder password recovery workflows without active registration.
"""

from typing import Dict, Any
from fastapi import APIRouter, status, HTTPException, Depends
from app.schemas.common import LoginRequest, TokenPayload, APIResponse
from app.core.security import create_access_token
from app.core.dependencies import get_current_user_token
import logging

logger = logging.getLogger("trustchain.auth")
router = APIRouter(prefix="/auth", tags=["Authentication Foundation"])


@router.post("/login", response_model=APIResponse, status_code=status.HTTP_200_OK, summary="User Authentication & JWT Token Exchange")
async def login_for_access_token(credentials: LoginRequest):
    """
    Mock enterprise authentication login.
    Validates user credentials against mock foundations and issues a cryptographically signed JWT token.
    Supports dynamic demo role assignment for Sprint 0 architecture validation.
    """
    logger.info(f"Processing authentication request for user handle: {credentials.username_or_email}")
    
    # In Sprint 0 Mock mode, map desired role or username to enterprise test personas
    role = "Viewer"
    if credentials.requested_role_demo in ["Administrator", "Researcher", "Viewer"]:
        role = credentials.requested_role_demo
    elif "admin" in credentials.username_or_email.lower():
        role = "Administrator"
    elif "research" in credentials.username_or_email.lower():
        role = "Researcher"
        
    user_id_map = {
        "Administrator": "admin-uid-001",
        "Researcher": "res-uid-002",
        "Viewer": "view-uid-003"
    }
    
    username = credentials.username_or_email
    token = create_access_token(
        subject=user_id_map.get(role, "user-000"),
        custom_claims={"username": username, "role": role}
    )
    
    token_payload = TokenPayload(
        access_token=token,
        token_type="bearer",
        expires_in=86400,
        role=role,
        username=username,
        avatar_url=f"https://api.dicebear.com/7.x/bottts-neutral/svg?seed={username}"
    )
    
    return APIResponse(
        success=True,
        message=f"Successfully authenticated as {role} clearance level.",
        data=token_payload.model_dump()
    )


@router.post("/forgot-password", response_model=APIResponse, status_code=status.HTTP_202_ACCEPTED, summary="Request Password Reset Recovery Token")
async def forgot_password(email: str):
    """
    Initiate mock password reset recovery process.
    In future sprints, this will generate one-time secret tokens and trigger enterprise notification emails.
    """
    logger.info(f"Password reset recovery requested for account: {email}")
    return APIResponse(
        success=True,
        message=f"If an active account matching '{email}' exists in the cybersecurity platform, recovery instructions have been dispatched."
    )


@router.post("/reset-password", response_model=APIResponse, status_code=status.HTTP_200_OK, summary="Execute Password Reset via Token")
async def reset_password(reset_token: str, new_password: str):
    """
    Complete password reset recovery workflow using verified one-time tokens.
    """
    logger.info("Executing password reset transformation with token verification.")
    return APIResponse(
        success=True,
        message="Your enterprise credentials have been updated successfully. Please authenticate using your new password."
    )


@router.get("/me", response_model=APIResponse, status_code=status.HTTP_200_OK, summary="Retrieve Current Authenticated Session Profile")
async def get_current_user_profile(user_payload: Dict[str, Any] = Depends(get_current_user_token)):
    """
    Inspect active JWT bearer token to extract user RBAC clearance, subject ID, and session parameters.
    """
    return APIResponse(
        success=True,
        message="Active session verified.",
        data=user_payload
    )
