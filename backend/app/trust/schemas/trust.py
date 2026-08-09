"""
TrustChain-5G Module 3: Adaptive Trust Evaluation Engine
API Pydantic Schemas
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.trust.models.profile import TrustProfile
from app.trust.models.history import TrustEvaluationHistory, HistoricalInteraction
from app.trust.models.compliance import SecurityCompliance
from app.trust.models.config import TrustConfiguration

class BehaviorMetrics(BaseModel):
    """
    Aggregated statistical summary of a node's physical and data-link behavioral telemetry.
    Generated on the fly from existing Network Features and Communication logs.
    """
    nodeId: str
    totalPacketsSent: int = 0
    totalPacketsReceived: int = 0
    successfulPackets: int = 0
    failedPackets: int = 0
    packetLossRate: float = 0.0
    averageLatency: float = 0.0
    averageJitter: float = 0.0
    averageBandwidth: float = 0.0
    communicationFrequency: float = 0.0
    activeSessions: int = 0
    completedSessions: int = 0
    averagePacketSize: float = 0.0
    averageSignalStrength: float = 0.0
    successfulCommunicationRate: float = 0.0
    lastCommunicationTime: Optional[datetime] = None


class TrustProfileResponse(BaseModel):
    success: bool = True
    data: TrustProfile


class TrustProfilesListResponse(BaseModel):
    success: bool = True
    total_count: int
    data: List[TrustProfile]


class BehaviorMetricsResponse(BaseModel):
    success: bool = True
    data: BehaviorMetrics


class TrustHistoryResponse(BaseModel):
    success: bool = True
    total_count: int
    data: List[TrustEvaluationHistory]


class ComplianceResponse(BaseModel):
    success: bool = True
    data: SecurityCompliance


class TrustStatistics(BaseModel):
    totalNodesEvaluated: int = 0
    trustedNodes: int = 0
    suspiciousNodes: int = 0
    maliciousNodes: int = 0
    averageTrustScore: float = 0.0
    highestTrustNode: Optional[str] = None
    lowestTrustNode: Optional[str] = None
    averageBehaviorScore: float = 0.0
    averageHistoricalInteractionScore: float = 0.0
    averageSecurityComplianceScore: float = 0.0
    trustImprovedCount: int = 0
    trustDecreasedCount: int = 0
    lastEvaluationTime: Optional[datetime] = None

class TrustStatisticsResponse(BaseModel):
    success: bool = True
    data: TrustStatistics

class ConfigurationResponse(BaseModel):
    success: bool = True
    data: TrustConfiguration
