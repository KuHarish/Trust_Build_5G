from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone

class NodeSecurityState(BaseModel):
    nodeId: str
    currentState: str = "ACTIVE" # ACTIVE, MONITORED, WARNED, RATE_LIMITED, QUARANTINED, BLOCKED
    previousState: str = "ACTIVE"
    changedBy: str = "SYSTEM"
    sourceDecisionId: Optional[str] = None
    sourceActionId: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reason: Optional[str] = None
