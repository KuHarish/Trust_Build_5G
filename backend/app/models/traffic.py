"""
TrustChain-5G TrafficLogs & Packets Collections Domain Models.

Defines high-speed telemetry log structures and individual deep packet inspection schemas for network simulations.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ProtocolType(str, Enum):
    TCP = "TCP"
    UDP = "UDP"
    HTTP2 = "HTTP/2"
    QUIC = "QUIC"
    NGAP = "NGAP"                    # Next Generation Application Protocol (5G Core)
    PFCP = "PFCP"                    # Packet Forwarding Control Protocol
    ICMP = "ICMP"
    SCTP = "SCTP"


class PacketModel(BaseModel):
    """
    MongoDB schema representation for fine-grained documents in the 'Packets' collection.
    """
    packet_id: str = Field(..., alias="_id", description="Unique sequence token for individual analyzed dataframe")
    session_id: str = Field(..., description="Correlation ID tying packet to an overarching connection flow")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Precise capture epoch time")
    source_ip: str = Field(..., description="Originating node network address")
    destination_ip: str = Field(..., description="Target node network address")
    source_port: int = Field(..., description="Originating layer-4 port")
    destination_port: int = Field(..., description="Target layer-4 port")
    protocol: ProtocolType = Field(default=ProtocolType.TCP, description="Encapsulation network protocol")
    length_bytes: int = Field(default=64, description="Total size of packet in bytes")
    header_flags: Dict[str, bool] = Field(default_factory=lambda: {"SYN": False, "ACK": True, "FIN": False, "RST": False}, description="TCP/NGAP signaling flags")
    payload_hash: Optional[str] = Field(default=None, description="SHA-256 fingerprint of packet body for tampering verification")

    class Config:
        populate_by_name = True
        from_attributes = True


class TrafficLogModel(BaseModel):
    """
    MongoDB schema representing aggregated statistical window documents in the 'TrafficLogs' collection.
    """
    log_id: str = Field(..., alias="_id", description="Unique audit record identifier")
    node_id: str = Field(..., description="Foreign key referencing evaluated Node MAC or logical ID")
    window_start: datetime = Field(..., description="Beginning timestamp of aggregation sample window")
    window_end: datetime = Field(..., description="Termination timestamp of aggregation sample window")
    total_packets: int = Field(default=0, description="Aggregate volume of frames observed during window")
    total_bytes: int = Field(default=0, description="Aggregate volume of bytes transferred")
    active_connections: int = Field(default=0, description="Simultaneous concurrent transport streams")
    anomaly_probability: float = Field(default=0.01, description="Preliminary ML intrusion suspicion index (0.0 to 1.0)")
    is_malicious: bool = Field(default=False, description="Final classification tag after threat detection evaluation")

    class Config:
        populate_by_name = True
        from_attributes = True
