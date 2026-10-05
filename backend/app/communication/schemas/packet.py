"""
TrustChain-5G Module 3 Packet & Telemetry Statistics Pydantic API Schemas.
"""
from typing import List, Dict
from pydantic import BaseModel, Field
from app.communication.models.packet import Packet
from app.communication.models.session import CommunicationSession


class PacketListResponse(BaseModel):
    """Paginated array response wrapper for historical transmitted packets."""
    success: bool = Field(default=True, description="Request completion flag")
    count: int = Field(..., description="Number of packets in current batch")
    totalCount: int = Field(..., description="Total recorded packets in storage")
    data: List[Packet] = Field(..., description="Array of packet transmission records")


class PacketDetailResponse(BaseModel):
    """Single packet detail wrapper."""
    success: bool = Field(default=True, description="Request completion flag")
    data: Packet = Field(..., description="Packet object details")


class LiveTrafficFeedResponse(BaseModel):
    """Real-time streaming topology payload for active React Flow visualization edges and packet tickers."""
    success: bool = Field(default=True, description="Request completion flag")
    activeSessions: List[CommunicationSession] = Field(..., description="Currently operating live sessions for animated topology drawing")
    recentPackets: List[Packet] = Field(..., description="Latest transmitted packet stream for live tickers")


class CommunicationStatisticsResponse(BaseModel):
    """Global Communication Engine KPI metric aggregation response."""
    success: bool = Field(default=True, description="Request completion flag")
    activeSessions: int = Field(..., description="Total count of active open communication sessions")
    packetsPerSecond: float = Field(..., description="Real-time packet generation rate velocity")
    totalPackets: int = Field(..., description="Total count of packets generated since simulation ignition")
    averageSessionDuration: float = Field(..., description="Average session connection life duration in seconds")
    averageLatency: float = Field(..., description="Network-wide average transit latency in milliseconds")
    averageBandwidth: float = Field(..., description="Network-wide average channel bandwidth in Mbps")
    protocolDistribution: Dict[str, int] = Field(..., description="Frequency map of packet transmissions across supported protocols")
