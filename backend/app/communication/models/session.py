"""
TrustChain-5G Module 3 Communication Session Domain Model.
Tracks interactive multi-packet transmission connections between registered network nodes.
"""
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.edge.models.event import EventProtocol


class SessionStatus(str, Enum):
    """Lifecycle statuses for simulated active node communication connections."""
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    TIMEOUT = "TIMEOUT"


class TrafficType(str, Enum):
    """Realistic network traffic profiles across 5G slicing and IoT application domains."""
    HEARTBEAT = "Heartbeat"
    TELEMETRY = "Telemetry"
    FILE_TRANSFER = "File Transfer"
    SENSOR_DATA = "Sensor Data"
    CONTROL_MESSAGES = "Control Messages"
    STATUS_UPDATES = "Status Updates"


class CommunicationSession(BaseModel):
    """
    MongoDB persistence document schema for simulated node connections in 'communication_sessions' collection.
    """
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    sessionId: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Globally unique UUID for the communication session")
    sourceNodeId: str = Field(..., description="Source network node designator")
    destinationNodeId: str = Field(..., description="Target network node designator")
    protocol: EventProtocol = Field(..., description="Transport layer communication protocol (TCP, UDP, HTTP, etc.)")
    trafficType: TrafficType = Field(default=TrafficType.TELEMETRY, description="Application traffic profile category")
    startTime: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat(), description="ISO timestamp of session ignition")
    endTime: Optional[str] = Field(default=None, description="ISO timestamp of session termination")
    status: SessionStatus = Field(default=SessionStatus.ACTIVE, description="Current connection operational state")
    bytesTransferred: int = Field(default=0, description="Cumulative volume of payload bytes sent across connection")
    packetsSent: int = Field(default=0, description="Total count of packets transmitted by source node")
    packetsReceived: int = Field(default=0, description="Total count of packets successfully received by destination node")
    averageLatency: float = Field(default=5.0, description="Running mean propagation latency in milliseconds")
    averageBandwidth: float = Field(default=500.0, description="Allocated channel throughput capacity in Mbps")
    signalStrength: float = Field(default=-65.0, description="Average RF receiver signal strength in dBm")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Extensible QoS properties and security telemetry")
