"""
TrustChain-5G Nodes Collection Domain Model.

Defines schemas for simulated and active 5G network entities (base stations, core elements, edge servers, devices).
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class NodeType(str, Enum):
    GNB = "gNodeB"                   # 5G Base Station
    UPF = "UPF"                      # User Plane Function
    AMF = "AMF"                      # Access & Mobility Management
    SMF = "SMF"                      # Session Management Function
    EDGE_SERVER = "EdgeServer"       # Multi-Access Edge Computing (MEC) node
    IOT_DEVICE = "IoTDevice"         # User Equipment / Smart Sensor
    CORE_ROUTER = "CoreRouter"       # Backbone Transport Router


class NodeStatus(str, Enum):
    ACTIVE = "Active"
    WARNING = "Warning"
    COMPROMISED = "Compromised"
    OFFLINE = "Offline"
    MAINTENANCE = "Maintenance"


class NodeModel(BaseModel):
    """
    MongoDB schema representation for documents in the 'Nodes' collection.
    """
    node_id: str = Field(..., alias="_id", description="Unique network node MAC or logical ID (e.g. GNB-001)")
    name: str = Field(..., description="Human-readable node designation (e.g. 'Tokyo Sector North gNodeB')")
    node_type: NodeType = Field(..., description="Architectural role within 5G core or edge network")
    status: NodeStatus = Field(default=NodeStatus.ACTIVE, description="Current operational and threat state")
    ip_address: str = Field(..., description="Assigned IPv4/IPv6 virtual or hardware network address")
    mac_address: Optional[str] = Field(default=None, description="Hardware layer MAC address")
    location: Dict[str, float] = Field(default_factory=lambda: {"lat": 0.0, "lng": 0.0}, description="Geographic positioning coordinates")
    bandwidth_mbps: float = Field(default=1000.0, description="Allocated link transmission capacity in Mbps")
    latency_ms: float = Field(default=1.5, description="Observed average round-trip packet latency in milliseconds")
    packet_loss_rate: float = Field(default=0.001, description="Percentage ratio of dropped vs transmitted frames")
    current_trust_score: float = Field(default=95.0, description="Real-time Adaptive Trust Engine evaluation (0 to 100)")
    last_ping: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of last telemetry heartbeat")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary radio or protocol hardware specifications")

    class Config:
        populate_by_name = True
        from_attributes = True
