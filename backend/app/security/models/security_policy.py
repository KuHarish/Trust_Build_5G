from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid

class PolicyCondition(BaseModel):
    # Example: "trustLevel", "==", "MALICIOUS"
    # Example: "mlPrediction", "==", "ATTACK"
    # Example: "mlConfidence", ">=", 0.85
    field: str
    operator: str 
    value: Any

class PolicyRule(BaseModel):
    ruleId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    priority: int = 100 # Lower number = higher priority
    conditions: List[PolicyCondition]
    decisionAction: str # ALLOW, MONITOR, WARN, RATE_LIMIT, QUARANTINE, BLOCK
    severity: str = "LOW"

class PolicyThresholds(BaseModel):
    mlHighConfidence: float = 0.80
    mlLowConfidence: float = 0.60
    mlMaxAgeSeconds: int = 30
    trustMaxAgeSeconds: int = 30
    repeatedDetectionWindowSeconds: int = 300
    repeatedDetectionCount: int = 5

class SecurityPolicy(BaseModel):
    policyId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    version: int = 1
    # DRAFT, ACTIVE, INACTIVE, ARCHIVED
    status: str = "DRAFT"
    
    thresholds: PolicyThresholds = Field(default_factory=PolicyThresholds)
    rules: List[PolicyRule] = Field(default_factory=list)
    
    # Safe fallback if evidence is entirely missing or policy eval fails
    fallbackBehavior: str = "MONITOR"
    
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    activatedAt: Optional[datetime] = None
    deactivatedAt: Optional[datetime] = None
