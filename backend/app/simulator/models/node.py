"""
TrustChain-5G Network Node Simulation Domain Model.
Defines entity representations, node operational states, and supported device categories for Module 1.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any
import uuid
from pydantic import BaseModel, Field, ConfigDict


class SimulationNodeType(str, Enum):
    """Supported virtual 5G edge, IoT, and gateway node classifications."""
    EDGE_IOT = "Edge / IoT Node"
    EDGE_PROCESSING = "Edge Processing Node"
    GATEWAY = "Gateway Node"
    AGGREGATION = "Aggregation Node"
    CORE_SERVER = "Core / Server Node"
    LEGACY_GATEWAY = "Gateway"
    LEGACY_EDGE_DEVICE = "Edge Device"

class SimulationNodeStatus(str, Enum):
    """Node operational states in simulated network landscape."""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    MAINTENANCE = "MAINTENANCE"
    BUSY = "BUSY"
    SLEEPING = "SLEEPING"


class SimulationNodeRelationship(BaseModel):
    targetId: str
    relationshipType: str = "CONNECTED_TO"


class SimulationNode(BaseModel):
    """
    MongoDB persistence document schema for simulated network nodes in 'nodes' collection.
    """
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Globally unique identifier (UUID) for node entity")
    nodeName: str = Field(..., description="Unique display designation for the network node")
    nodeType: SimulationNodeType = Field(..., description="Classification category of the simulated 5G entity")
    deviceCategory: str = Field(default="Standard 5G Entity", description="Broad functional device family")
    status: SimulationNodeStatus = Field(default=SimulationNodeStatus.ACTIVE, description="Current radio and operational status")
    simulationMode: bool = Field(default=True, description="Flag indicating if this is a simulated node")
    ipAddress: str = Field(..., description="Virtual IPv4 or IPv6 network assigned transport address")
    macAddress: str = Field(..., description="Virtual hardware layer interface MAC address")
    latitude: float = Field(..., description="Geographic latitude coordinate (-90.0 to 90.0)")
    longitude: float = Field(..., description="Geographic longitude coordinate (-180.0 to 180.0)")
    signalStrength: float = Field(default=-65.0, description="Observed radio receiver signal strength in dBm")
    bandwidth: float = Field(default=1000.0, description="Active channel transmission capacity in Mbps")
    latency: float = Field(default=5.0, description="Round-trip packet transmission latency in milliseconds")
    batteryLevel: float = Field(default=100.0, description="Available battery charge percentage (0.0 to 100.0)")
    firmwareVersion: str = Field(default="v1.0.0-5g", description="Active deployed firmware software package version")
    lastSeen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of latest telemetry check-in")
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp when node was first registered")
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of latest attribute modification")
    relationships: list[SimulationNodeRelationship] = Field(default_factory=list, description="Network topology connections")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Custom extensible telemetry specifications and hardware properties")
