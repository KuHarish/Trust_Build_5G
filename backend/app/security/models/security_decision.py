from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid

class SecurityDecision(BaseModel):
    decisionId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nodeId: str
    decision: str # ALLOW, MONITOR, WARN, RATE_LIMIT, QUARANTINE, BLOCK
    severity: str = "LOW" # LOW, MEDIUM, HIGH, CRITICAL
    reason: str
    
    # Context/Evidence at time of decision
    trustScore: Optional[float] = None
    trustLevel: Optional[str] = None
    mlPrediction: Optional[str] = None
    mlConfidence: Optional[float] = None
    attackCategory: Optional[str] = None
    
    policyId: Optional[str] = None
    policyVersion: Optional[int] = None
    triggerEventId: Optional[str] = None
    matchedRuleId: Optional[str] = None
    
    evidenceFreshness: Dict[str, str] = Field(default_factory=dict) # e.g. {"ML": "VALID", "TRUST": "STALE"}
    evidenceTimestamps: Dict[str, str] = Field(default_factory=dict) # e.g. {"ML": "2023-...", "TRUST": "2023-..."}
    explanation: Dict[str, Any] = Field(default_factory=dict)
    
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    isMitigated: bool = False # True if a MitigationAction was successfully launched for this decision
