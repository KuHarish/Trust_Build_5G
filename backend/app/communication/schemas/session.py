"""
TrustChain-5G Module 3 Communication Session Pydantic API Schemas.
"""
from typing import List, Optional
from pydantic import BaseModel, Field
from app.communication.models.session import CommunicationSession, SessionStatus
from app.edge.models.event import EventProtocol


class SessionListResponse(BaseModel):
    """Paginated array response wrapper for active and closed communication sessions."""
    success: bool = Field(default=True, description="Request completion flag")
    count: int = Field(..., description="Number of sessions returned in current page")
    totalCount: int = Field(..., description="Total matching sessions in storage")
    data: List[CommunicationSession] = Field(..., description="Array of communication session objects")


class SessionDetailResponse(BaseModel):
    """Single entity response wrapper for session property inspections."""
    success: bool = Field(default=True, description="Request completion flag")
    data: CommunicationSession = Field(..., description="Communication session object details")
