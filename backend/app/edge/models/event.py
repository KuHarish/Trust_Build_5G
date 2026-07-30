"""
TrustChain-5G Module 2: Edge Server & Feature Extraction - Communication Event Domain Models.
Represents 3GPP and IoT network traffic transmissions between virtual simulated nodes.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any
from pydantic import BaseModel, Field
import uuid

class EventProtocol(str, Enum):
    TCP = "TCP"
    UDP = "UDP"
    HTTP = "HTTP"
    HTTPS = "HTTPS"
    ICMP = "ICMP"
    MQTT = "MQTT"
    COAP = "CoAP"

class EventStatus(str, Enum):
    SUCCESS = "SUCCESS"
    DROPPED = "DROPPED"
    DELAYED = "DELAYED"
    RETRANSMIT = "RETRANSMIT"

class CommunicationEvent(BaseModel):
    eventId: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique UUID for the communication event")
    sourceNodeId: str = Field(..., description="UUID or designation name of initiating node")
    destinationNodeId: str = Field(..., description="UUID or designation name of target recipient node")
    protocol: EventProtocol = Field(..., description="Transport or application protocol employed")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat(), description="ISO8601 UTC transmission timestamp")
    packetSize: float = Field(..., description="Total transmitted packet size in bytes (64-1500)")
    payloadSize: float = Field(..., description="Net data payload size in bytes")
    hopCount: int = Field(default=1, description="Number of network router routing hops traversed")
    ttl: int = Field(default=64, description="Time To Live remaining decrement count (32-128)")
    bandwidth: float = Field(..., description="Allocated channel bandwidth in Mbps (20-1000)")
    latency: float = Field(..., description="Measured packet transit round-trip latency in ms (5-100)")
    jitter: float = Field(..., description="Calculated packet delay variation in ms")
    signalStrength: float = Field(..., description="Received signal strength indicator in dBm (-30 to -100)")
    transmissionTime: float = Field(..., description="Calculated duration of physical bit transmission in ms")
    status: EventStatus = Field(default=EventStatus.SUCCESS, description="Delivery disposition outcome")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Supplementary protocol tags and simulation telemetry flags")
