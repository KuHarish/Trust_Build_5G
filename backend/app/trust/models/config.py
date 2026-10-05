"""
TrustChain-5G Module 3: Adaptive Trust Evaluation Engine
Trust Configuration MongoDB Domain Model
"""
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional

class TrustConfiguration(BaseModel):
    """
    MongoDB persistence document schema for 'trust_configuration' collection.
    Manages active algorithmic weights and thresholds for the Evaluation Engine.
    """
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    configurationId: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique configuration ID")
    
    # Implementation Defaults (must sum to 1.0)
    behaviorWeight: float = Field(default=0.40, ge=0.0, le=1.0)
    historicalWeight: float = Field(default=0.30, ge=0.0, le=1.0)
    complianceWeight: float = Field(default=0.30, ge=0.0, le=1.0)
    
    # Classification Thresholds
    trustedThreshold: float = Field(default=0.70, ge=0.0, le=1.0)
    suspiciousThreshold: float = Field(default=0.40, ge=0.0, le=1.0)
    maliciousThreshold: float = Field(default=0.0, ge=0.0, le=1.0)
    
    evaluationIntervalSeconds: float = Field(default=10.0, ge=1.0, description="Daemon sleep cycle")
    
    enabled: bool = Field(default=True, description="Only one configuration can be active at a time")
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @model_validator(mode='after')
    def validate_rules(self) -> 'TrustConfiguration':
        # Rule 1: Weights must sum to 1.0
        total_weight = round(self.behaviorWeight + self.historicalWeight + self.complianceWeight, 4)
        if not (0.999 <= total_weight <= 1.001):
            raise ValueError(f"Configuration weights must sum exactly to 1.0. Current sum is {total_weight}.")
            
        # Rule 2: Threshold ordering validation
        if not (self.trustedThreshold > self.suspiciousThreshold):
            raise ValueError("trustedThreshold must be strictly greater than suspiciousThreshold.")
        if not (self.suspiciousThreshold >= self.maliciousThreshold):
            raise ValueError("suspiciousThreshold must be strictly greater than or equal to maliciousThreshold.")
            
        return self
