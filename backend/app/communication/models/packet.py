"""
TrustChain-5G Module 3 Packet Domain Model.
Represents discrete telemetry and file transfer packet frames transmitted inside active sessions.
"""
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.edge.models.event import EventProtocol, EventStatus
from app.communication.models.session import TrafficType


class Packet(BaseModel):
    """
    MongoDB persistence document schema for transmitted packet frames in 'packets' collection.
    Every generated packet is automatically mirrored into Module 2 Edge Server feature ingestion APIs.
    """
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    packetId: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Globally unique UUID for the frame")
    sessionId: str = Field(..., description="Parent CommunicationSession identifier")
    sourceNodeId: str = Field(..., description="Originating simulation node UUID or name")
    destinationNodeId: str = Field(..., description="Receiving simulation node UUID or name")
    sequenceNumber: int = Field(default=1, description="Incremental sequential packet counter within session")
    packetSize: int = Field(..., description="Total frame size in bytes (header + payload)")
    payloadSize: int = Field(..., description="Data payload volume in bytes")
    protocol: EventProtocol = Field(..., description="Transport layer communication protocol")
    trafficType: TrafficType = Field(default=TrafficType.TELEMETRY, description="Type of packet application payload")
    ttl: int = Field(default=64, description="Time to live routing hop limit")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat(), description="ISO timestamp of packet release")
    latency: float = Field(..., description="Transit latency measured in milliseconds")
    bandwidth: float = Field(..., description="Allocated channel bandwidth in Mbps")
    status: EventStatus = Field(default=EventStatus.SUCCESS, description="Transmission status (SUCCESS, DROPPED, DELAYED)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional header inspections and checksum parameters")
