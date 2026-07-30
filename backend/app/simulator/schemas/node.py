"""
TrustChain-5G Network Node Management Request & Response Validation Schemas.
Enforces IP Address, MAC Address, Latitude/Longitude boundaries and required fields via Pydantic v2.
"""

import ipaddress
import re
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.simulator.models.node import SimulationNodeType, SimulationNodeStatus


MAC_ADDRESS_REGEX = re.compile(r"^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$")


class NodeBaseValidation(BaseModel):
    """Shared field validation helpers for node creation and modification."""
    
    @field_validator("ipAddress", mode="before", check_fields=False)
    @classmethod
    def validate_ip(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            try:
                # Validates both IPv4 and IPv6 strings
                ipaddress.ip_address(v.strip())
            except ValueError:
                raise ValueError("Invalid IP address format. Please provide a valid IPv4 or IPv6 address.")
            return v.strip()
        return v

    @field_validator("macAddress", mode="before", check_fields=False)
    @classmethod
    def validate_mac(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not MAC_ADDRESS_REGEX.match(v.strip()):
                raise ValueError("Invalid MAC address format. Expected pattern: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX.")
            return v.strip().upper()
        return v

    @field_validator("latitude", mode="before", check_fields=False)
    @classmethod
    def validate_latitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            if not (-90.0 <= float(v) <= 90.0):
                raise ValueError("Latitude must be between -90.0 and 90.0 degrees.")
            return float(v)
        return v

    @field_validator("longitude", mode="before", check_fields=False)
    @classmethod
    def validate_longitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            if not (-180.0 <= float(v) <= 180.0):
                raise ValueError("Longitude must be between -180.0 and 180.0 degrees.")
            return float(v)
        return v


class NodeCreate(NodeBaseValidation):
    """Payload schema for registering a new virtual 5G simulation node."""
    nodeName: str = Field(..., min_length=2, max_length=100, description="Unique human-readable node name")
    nodeType: SimulationNodeType
    deviceCategory: Optional[str] = Field(None, description="Optional device functional grouping")
    status: Optional[SimulationNodeStatus] = Field(default=SimulationNodeStatus.ONLINE)
    ipAddress: str = Field(..., description="Valid IPv4 or IPv6 string")
    macAddress: str = Field(..., description="Valid MAC address string")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    signalStrength: Optional[float] = Field(default=-65.0, ge=-130.0, le=-20.0)
    bandwidth: Optional[float] = Field(default=1000.0, ge=1.0, le=100000.0)
    latency: Optional[float] = Field(default=5.0, ge=0.1, le=5000.0)
    batteryLevel: Optional[float] = Field(default=100.0, ge=0.0, le=100.0)
    firmwareVersion: Optional[str] = Field(default="v1.0.0-5g")
    connections: Optional[int] = Field(default=0, ge=0)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class NodeUpdate(NodeBaseValidation):
    """Payload schema for modifying an existing simulation node."""
    nodeName: Optional[str] = Field(None, min_length=2, max_length=100)
    nodeType: Optional[SimulationNodeType] = None
    deviceCategory: Optional[str] = None
    status: Optional[SimulationNodeStatus] = None
    ipAddress: Optional[str] = None
    macAddress: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    signalStrength: Optional[float] = Field(None, ge=-130.0, le=-20.0)
    bandwidth: Optional[float] = Field(None, ge=1.0, le=100000.0)
    latency: Optional[float] = Field(None, ge=0.1, le=5000.0)
    batteryLevel: Optional[float] = Field(None, ge=0.0, le=100.0)
    firmwareVersion: Optional[str] = None
    connections: Optional[int] = Field(None, ge=0)
    metadata: Optional[Dict[str, Any]] = None


class NodeStatusPatch(BaseModel):
    """Payload schema for quickly toggling a node's operational state."""
    status: SimulationNodeStatus


class NodeStatisticsResponse(BaseModel):
    """Schema for overall simulated network node population telemetry summary."""
    totalNodes: int = Field(..., description="Total registered simulation nodes")
    onlineNodes: int = Field(..., description="Count of nodes actively online")
    offlineNodes: int = Field(..., description="Count of nodes currently offline or unreachable")
    nodeTypes: Dict[str, int] = Field(..., description="Frequency distribution across different 5G node types")
    averageSignalStrength: float = Field(..., description="Mean receiver signal strength in dBm across online entities")
