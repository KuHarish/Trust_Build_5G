"""
TrustChain-5G Alerts & Analytics Collections Domain Models.

Defines schemas for live cybersecurity operational alerts and high-level platform telemetry analytics.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from app.models.attack import SeverityLevel


class AlertStatus(str, Enum):
    NEW = "New"
    ACKNOWLEDGED = "Acknowledged"
    IN_PROGRESS = "In Progress"
    MITIGATED = "Mitigated"
    DISMISSED = "Dismissed"


class AlertModel(BaseModel):
    """
    MongoDB schema representing operational incidents in the 'Alerts' collection.
    """
    alert_id: str = Field(..., alias="_id", description="Unique incident identifier (e.g. ALRT-2026-902)")
    title: str = Field(..., description="Concise headline of alert event (e.g., 'Anomalous SYN Flood Surge on Core Router 4')")
    description: str = Field(..., description="Detailed diagnostic synopsis of detected network risk")
    severity: SeverityLevel = Field(default=SeverityLevel.HIGH, description="Priority urgency ranking")
    status: AlertStatus = Field(default=AlertStatus.NEW, description="Workflow tracking status")
    affected_node_id: Optional[str] = Field(default=None, description="Linked network node ID")
    related_attack_id: Optional[str] = Field(default=None, description="Linked threat investigation code from AttackLogs")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Time of initial alarm triggering")
    resolved_at: Optional[datetime] = Field(default=None, description="Time of incident mitigation completion")
    assigned_to: Optional[str] = Field(default=None, description="Username of cybersecurity analyst overseeing resolution")

    class Config:
        populate_by_name = True
        from_attributes = True
