"""
TrustChain-5G Module 2: Edge Server & Feature Extraction - Event & Statistics Validation Schemas.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, field_validator
from app.edge.models.event import CommunicationEvent, EventProtocol, EventStatus

class EventCreateRequest(BaseModel):
    sourceNodeId: str = Field(..., min_length=1, description="Source node ID or name")
    destinationNodeId: str = Field(..., min_length=1, description="Destination node ID or name")
    protocol: EventProtocol = Field(default=EventProtocol.TCP)
    packetSize: float = Field(default=512.0, ge=64.0, le=65535.0)
    payloadSize: Optional[float] = Field(default=None)
    hopCount: int = Field(default=1, ge=1, le=32)
    ttl: int = Field(default=64, ge=32, le=128)
    bandwidth: float = Field(default=100.0, ge=10.0, le=10000.0)
    latency: float = Field(default=15.0, ge=0.1, le=1000.0)
    jitter: float = Field(default=1.0, ge=0.0, le=100.0)
    signalStrength: float = Field(default=-65.0, ge=-120.0, le=-10.0)
    transmissionTime: Optional[float] = Field(default=None)
    status: EventStatus = Field(default=EventStatus.SUCCESS)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("destinationNodeId")
    def check_not_self_communication(cls, v: str, info) -> str:
        source = info.data.get("sourceNodeId")
        if source and source.lower() == v.lower():
            raise ValueError("Self-communication loop detected: sourceNodeId and destinationNodeId must be distinct entities.")
        return v

class EventListResponse(BaseModel):
    success: bool = True
    total_count: int
    data: List[CommunicationEvent]

class EventSingleResponse(BaseModel):
    success: bool = True
    data: CommunicationEvent

class EdgeStatisticsResponse(BaseModel):
    totalEvents: int
    eventsPerSecond: float
    averagePacketSize: float
    averageLatency: float
    averageBandwidth: float
    protocolDistribution: Dict[str, int]
    activeNodes: int
    averageSignalStrength: float
    success: bool = True
