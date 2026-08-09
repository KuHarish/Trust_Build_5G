"""
TrustChain-5G Module 3: Adaptive Trust Evaluation Engine
Trust History & Historical Interaction MongoDB Domain Models
"""
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any

class HistoricalInteraction(BaseModel):
    """
    MongoDB persistence document schema for 'historical_interactions' collection.
    Maintains a ledger of peer-to-peer session communication statistics.
    """
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    interactionId: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique interaction ID")
    sourceNode: str = Field(..., description="Initiating node ID")
    destinationNode: str = Field(..., description="Target node ID")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Ledger snapshot time")
    
    protocol: str = Field(..., description="Communication protocol evaluated")
    packetsSent: int = Field(default=0, description="Count of outbound packets")
    packetsReceived: int = Field(default=0, description="Count of inbound packets")
    successfulPackets: int = Field(default=0, description="Packets successfully verified")
    failedPackets: int = Field(default=0, description="Packets dropped or corrupt")
    latency: float = Field(default=0.0, description="Observed round-trip latency")
    sessionDuration: float = Field(default=0.0, description="Total elapsed session time in seconds")
    
    interactionStatus: str = Field(default="COMPLETED", description="Disposition state of the peer interaction")


class TrustEvaluationHistory(BaseModel):
    """
    MongoDB persistence document schema for 'trust_evaluations' collection.
    Immutable snapshot ledger recording a node's periodic evaluation trajectory.
    """
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    evaluationId: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique evaluation snapshot ID")
    nodeId: str = Field(..., description="UUID of the evaluated network node")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Evaluation snapshot time")
    
    behaviorScore: float = Field(..., description="Calculated behavioral telemetry score (0.0-1.0)")
    historicalInteractionScore: float = Field(..., description="Calculated peer history score (0.0-1.0)")
    securityComplianceScore: float = Field(..., description="Calculated security posture score (0.0-1.0)")
    
    trustScore: Optional[float] = Field(default=None, description="Final merged trust score")
    trustLevel: str = Field(..., description="Categorical trust string")
    
    # Delta and Explanations
    previousTrustScore: Optional[float] = Field(default=None, description="Previous evaluation score")
    trustDelta: float = Field(default=0.0, description="Numerical shift")
    reason: str = Field(..., description="Generated human-readable explanation")
    
    # Algorithm Snapshot Weights
    behaviorWeight: float = Field(default=0.40, description="Weight used in calculation")
    historicalWeight: float = Field(default=0.30, description="Weight used in calculation")
    complianceWeight: float = Field(default=0.30, description="Weight used in calculation")
    
    configurationId: Optional[str] = Field(default=None, description="Config document ID reference")
    metricsSnapshot: Dict[str, Any] = Field(default_factory=dict, description="Raw feature metrics at time of evaluation")
