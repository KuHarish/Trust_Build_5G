from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid

class MitigationAction(BaseModel):
    actionId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nodeId: str
    decisionId: str
    decision: str # The action taken e.g. BLOCK, QUARANTINE
    correlationId: str
    
    # PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED, ROLLED_BACK
    status: str = "PENDING"
    
    # Audit integration
    blockchainTxId: Optional[str] = None
    
    # Lifecycle tracking
    executionAttempts: int = 0
    maxRetries: int = 1
    timeoutSeconds: int = 30
    executorType: Optional[str] = None
    
    previousState: Optional[str] = None
    resultingState: Optional[str] = None
    rollbackState: Optional[str] = None
    
    requestedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    startedAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    
    result: Optional[str] = None
    errorInformation: Optional[str] = None
