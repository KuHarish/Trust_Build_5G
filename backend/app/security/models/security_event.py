from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid

class SecurityEvent(BaseModel):
    eventId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    eventType: str # SECURITY_DECISION, MITIGATION_REQUESTED, MITIGATION_STARTED, MITIGATION_COMPLETED, MITIGATION_FAILED, NODE_SECURITY_STATE_CHANGE, POLICY_ACTIVATED, etc.
    correlationId: str
    nodeId: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sourceModule: str
    
    severity: Optional[str] = None
    decisionId: Optional[str] = None
    actionId: Optional[str] = None
    triggerEventId: Optional[str] = None
    predictionId: Optional[str] = None
    trustEvaluationId: Optional[str] = None
    policyId: Optional[str] = None
    policyVersion: Optional[int] = None
    
    decision: Optional[str] = None
    mitigationAction: Optional[str] = None
    previousSecurityState: Optional[str] = None
    newSecurityState: Optional[str] = None
    
    result: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None
    errorInformation: Optional[str] = None
    
    # Audit state
    auditStatus: str = "PENDING" # PENDING, CONFIRMED, FAILED
    blockchainTxId: Optional[str] = None
    retryCount: int = 0
