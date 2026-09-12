"""
TrustChain-5G Sprint 1.4 - Real-Time Network Monitoring & System Integration Pydantic Schemas.
Defines data structures for overview KPIs, health indicators, activity streams, feature extraction feeds,
simulation command requests, and aggregated analytics charts.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class SystemOverview(BaseModel):
    totalNodes: int = Field(0, description="Total registered network entities")
    onlineNodes: int = Field(0, description="Count of online nodes")
    offlineNodes: int = Field(0, description="Count of offline or unreachable nodes")
    activeSessions: int = Field(0, description="Number of currently active communication circuits")
    packetsPerSecond: float = Field(0.0, description="Real-time traffic transmission rate")
    eventsPerSecond: float = Field(0.0, description="Edge Server event processing velocity")
    averageLatency: float = Field(0.0, description="Global average transit latency in ms")
    averageBandwidth: float = Field(0.0, description="Global average throughput bandwidth in Mbps")
    averageSignalStrength: float = Field(0.0, description="Average RF received power in dBm")
    featureExtractionRate: float = Field(0.0, description="Rate of mathematical feature extraction per second")

class HealthCriteria(BaseModel):
    availability: float = Field(100.0, description="Node online availability percentage")
    latency: float = Field(0.0, description="Average network latency in ms")
    packetLoss: float = Field(0.0, description="Estimated simulation packet loss percentage")
    bandwidthUtilization: float = Field(0.0, description="Average bandwidth channel utilization percentage")
    details: List[str] = Field(default_factory=list, description="Diagnostic notes on health determination")

class NetworkHealthStatus(BaseModel):
    status: str = Field("Healthy", description="Overall system state: Healthy, Warning, or Critical")
    healthScore: float = Field(100.0, description="Normalized health coefficient from 0.0 to 100.0")
    criteria: HealthCriteria

class ActivityEvent(BaseModel):
    eventId: str = Field(..., description="Unique event identifier")
    timestamp: str = Field(..., description="ISO timestamp of event occurrence")
    eventType: str = Field("INFO", description="Type category: NODE_CONNECT, PACKET_TX, SESSION, FEATURE_EXTRACT, ALERT")
    severity: str = Field("INFO", description="Operational severity: INFO, WARNING, CRITICAL (No attacks or ML)")
    sourceNode: Optional[str] = None
    destinationNode: Optional[str] = None
    protocol: Optional[str] = None
    description: str = Field(..., description="Human-readable operational ticker message")

class TrustEvent(BaseModel):
    eventId: str
    eventType: str = Field("TRUST_UPDATED", description="Event category: TRUST_UPDATED")
    nodeId: str
    previousTrust: Optional[float] = None
    currentTrust: float
    trustDelta: Optional[float] = None
    trustLevel: str
    timestamp: str
    reason: Optional[str] = None

class ExtractedFeatureItem(BaseModel):
    featureId: str = Field(..., description="Identifier for extracted feature block")
    protocol: str
    packetSize: float
    latency: float
    bandwidth: float
    signalStrength: float
    communicationCount: int
    transmissionTime: float
    extractionTime: str
    sourceNode: str
    destinationNode: str

class SimulationStatus(BaseModel):
    running: bool = Field(True, description="Whether simulation loops are executing")
    paused: bool = Field(False, description="Whether simulation loops are currently suspended")
    speedMultiplier: float = Field(1.0, description="Speed scaling factor multiplier")
    nodeCount: int = Field(0, description="Target or actual active simulation node count")
    packetFrequency: float = Field(3.5, description="Frequency in seconds between communication packets")
    communicationInterval: float = Field(4.0, description="Frequency in seconds between edge feature extractions")

class SimulationControlRequest(BaseModel):
    action: str = Field("START", description="Command: START, PAUSE, RESUME, RESET, TUNING")
    speedMultiplier: Optional[float] = Field(None, ge=0.1, le=10.0, description="Adjusted simulation speed multiplier")
    nodeCount: Optional[int] = Field(None, ge=2, le=500, description="Target virtual nodes to spawn or maintain")
    packetFrequency: Optional[float] = Field(None, ge=0.5, le=30.0, description="Updated communication packet interval in seconds")
    communicationInterval: Optional[float] = Field(None, ge=0.5, le=30.0, description="Updated edge extraction interval in seconds")

class DashboardOverviewResponse(BaseModel):
    success: bool = True
    data: SystemOverview

class DashboardHealthResponse(BaseModel):
    success: bool = True
    data: NetworkHealthStatus

class DashboardLiveResponse(BaseModel):
    success: bool = True
    overview: SystemOverview
    health: NetworkHealthStatus
    recentEvents: List[ActivityEvent]
    recentFeatures: List[ExtractedFeatureItem]
    recentTrustEvents: List[TrustEvent] = Field(default_factory=list)
    recentSecurityDecisions: List[Dict[str, Any]] = Field(default_factory=list)
    recentMitigationActions: List[Dict[str, Any]] = Field(default_factory=list)
    trustProfiles: List[Any] = Field(default_factory=list)
    activeSessionsCount: int
    simulationStatus: SimulationStatus

class ChartSeriesData(BaseModel):
    timestamps: List[str]
    values: List[float]

class DashboardStatisticsResponse(BaseModel):
    success: bool = True
    packetsPerSecondTrend: ChartSeriesData
    bandwidthUsageTrend: ChartSeriesData
    latencyTrend: ChartSeriesData
    signalStrengthTrend: ChartSeriesData
    protocolDistribution: Dict[str, int]
    communicationVolume: ChartSeriesData
