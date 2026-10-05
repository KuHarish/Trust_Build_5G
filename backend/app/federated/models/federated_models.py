from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class FederatedClient(BaseModel):
    clientId: str
    clientName: str
    status: str = "IDLE"
    localDatasetId: str
    sampleCount: int = 0
    modelVersion: str = "1.0.0"
    featureVersion: str = "1.0"
    trainingStatus: str = "READY"
    lastTrainingTime: Optional[str] = None
    localMetrics: Dict[str, Any] = Field(default_factory=dict)
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FederatedRound(BaseModel):
    roundId: str
    jobId: str
    roundNumber: int
    globalModelVersion: str
    previousGlobalModelVersion: Optional[str] = None
    participatingClients: int = 0
    droppedClients: int = 0
    totalClientSamples: int = 0
    trainingStart: Optional[str] = None
    trainingEnd: Optional[str] = None
    aggregationDuration: float = 0.0
    globalMetrics: Dict[str, Any] = Field(default_factory=dict)
    status: str = "CREATED"
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FederatedJob(BaseModel):
    jobId: str
    config: Dict[str, Any]
    status: str = "STARTING"
    currentRound: int = 0
    totalRounds: int = 0
    currentStep: str = "INITIALIZING"
    participatingClients: int = 0
    completedClients: int = 0
    failedClients: int = 0
    latestGlobalModel: Optional[str] = None
    latestMetrics: Dict[str, Any] = Field(default_factory=dict)
    startedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    estimatedCompletion: Optional[str] = None
    error: Optional[str] = None
