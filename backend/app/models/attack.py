"""
TrustChain-5G AttackLogs Collection Domain Model.

Defines schemas for simulated and detected cybersecurity threats, intrusions, and anomalous network behaviors.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AttackType(str, Enum):
    DDOS_SYN_FLOOD = "DDoS SYN Flood"
    MITM_SIGNALLING_INTERCEPTION = "MitM 5G Signalling Interception"
    ROGUE_BASE_STATION = "Rogue gNodeB Impersonation"
    FEDERATED_POISONING = "Federated Learning Model Poisoning"
    SIM_SWAP_HIJACK = "SIM Swap & Subscriber Hijacking"
    SLICE_RESOURCE_EXHAUSTION = "Network Slice Resource Exhaustion"
    UNAUTHORIZED_API_ACCESS = "Unauthorized Controller API Influx"
    BENIGN = "Benign Normal Activity"


class SeverityLevel(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    INFO = "Informational"


class AttackLogModel(BaseModel):
    """
    MongoDB schema representation for threat detection documents in the 'AttackLogs' collection.
    """
    attack_id: str = Field(..., alias="_id", description="Unique threat investigation log code (e.g. ATK-2026-001)")
    attack_type: AttackType = Field(..., description="Classified taxonomy of intrusion pattern")
    severity: SeverityLevel = Field(default=SeverityLevel.HIGH, description="Assessed impact on 5G network survivability")
    source_ip: Optional[str] = Field(default=None, description="Presumed attacker or compromised relay origin address")
    target_node_id: str = Field(..., description="Affected 5G network entity ID")
    detected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of alert generation")
    detector_module: str = Field(default="ML-RandomForest-Classifier", description="Subsystem responsible for threat flagging")
    confidence_score: float = Field(default=0.96, ge=0.0, le=1.0, description="Machine learning classification certainty ratio")
    mitigation_status: str = Field(default="Pending Auto-Quarantine", description="Current Security Controller intervention state")
    payload_sample: Optional[str] = Field(default=None, description="Truncated hexadecimal dump of suspicious dataframe payload")

    class Config:
        populate_by_name = True
        from_attributes = True
