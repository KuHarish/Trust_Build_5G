"""
TrustChain-5G Module 3: Adaptive Trust Evaluation Engine
Trust Profile MongoDB Domain Model
"""
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class TrustProfile(BaseModel):
    """
    MongoDB persistence document schema for 'trust_profiles' collection.
    Tracks behavioral standing of each node in the network.
    """
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    trustProfileId: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Globally unique identifier")
    nodeId: str = Field(..., description="UUID of the network node this profile belongs to")
    
    # Trust Dimensions (0.0 to 1.0)
    behaviorScore: float = Field(default=1.0, description="Score based on physical/MAC telemetry behaviors")
    historicalInteractionScore: float = Field(default=1.0, description="Score based on past successful communications")
    securityComplianceScore: float = Field(default=1.0, description="Score based on security policy conformance")
    
    # Overall Trust Output
    currentTrustScore: Optional[float] = Field(default=None, description="Final aggregated trust score (0.0 to 1.0)")
    trustLevel: str = Field(default="UNKNOWN", description="Classification string representing the confidence interval")
    
    # Trust Score Delta Tracking
    previousTrustScore: Optional[float] = Field(default=None, description="The previous trust score before the latest cycle")
    trustDelta: float = Field(default=0.0, description="Mathematical difference between current and previous score")
    trustChange: str = Field(default="STABLE", description="Categorical change (IMPROVED, STABLE, DECREASED, CRITICAL_DECREASE)")
    evaluationReason: str = Field(default="Awaiting evaluation", description="Human-readable explanation of trust score shifts")
    
    # Metadata
    evaluationCount: int = Field(default=0, description="Total number of automated background evaluations completed")
    lastEvaluation: Optional[datetime] = Field(default=None, description="Timestamp of the most recent evaluation cycle")
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of profile genesis")
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of last data modification")
