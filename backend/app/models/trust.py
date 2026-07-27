"""
TrustChain-5G TrustScores & TrustHistory Collections Domain Models.

Defines schemas for the Adaptive Trust Engine to evaluate and historical track node reputation levels over time.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class TrustLevel(str, Enum):
    TRUSTED = "Trusted"              # Score >= 80
    MODERATE = "Moderate"            # Score 50 - 79
    UNTRUSTED = "Untrusted"          # Score < 50
    QUARANTINED = "Quarantined"      # Node isolated by Security Controller


class TrustScoreModel(BaseModel):
    """
    MongoDB schema representation for active reputation state in the 'TrustScores' collection.
    """
    score_id: str = Field(..., alias="_id", description="Unique trust record ID")
    node_id: str = Field(..., description="Target node undergoing trust evaluation")
    trust_score: float = Field(default=95.0, ge=0.0, le=100.0, description="Numerical trust quotient between 0 and 100")
    trust_level: TrustLevel = Field(default=TrustLevel.TRUSTED, description="Categorical classification of security posture")
    behavioral_factor: float = Field(default=0.98, description="Weighted metric from packet regularity and throughput compliance")
    cryptographic_factor: float = Field(default=1.00, description="Weighted metric from valid certificates and consensus participation")
    reputation_factor: float = Field(default=0.95, description="Historical weighted legacy reliability score")
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of most recent score calculation")
    evaluating_algorithm: str = Field(default="AdaptiveBayesian-v1", description="Identifier of calculation engine formula")

    class Config:
        populate_by_name = True
        from_attributes = True


class TrustHistoryModel(BaseModel):
    """
    MongoDB schema representing immutable time-series ledgers in the 'TrustHistory' collection.
    """
    history_id: str = Field(..., alias="_id", description="Unique historical event record identifier")
    node_id: str = Field(..., description="Target node ID")
    previous_score: float = Field(..., description="Score prior to adjustment")
    new_score: float = Field(..., description="Revised score following event")
    change_delta: float = Field(..., description="Mathematical difference (+/-) in reputation score")
    trigger_event: str = Field(..., description="Explanation of trigger (e.g., 'Anomalous DOS Traffic Pattern Detected' or 'Successful Federated Round Completion')")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of historical transition")
    blockchain_tx_hash: Optional[str] = Field(default=None, description="Cryptographic hash of corresponding Blockchain anchor confirmation")

    class Config:
        populate_by_name = True
        from_attributes = True
