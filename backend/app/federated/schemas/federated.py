from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class FederatedConfig(BaseModel):
    totalClients: int = Field(default=5, description="Total number of simulated edge clients")
    participationRate: float = Field(default=0.8, description="Fraction of clients participating per round")
    minimumClients: int = Field(default=3, description="Minimum clients required to start a round")
    trainingRounds: int = Field(default=3, description="Total number of FL rounds")
    localEpochs: int = Field(default=1, description="Number of local epochs per client")
    batchSize: int = Field(default=32, description="Local batch size")
    learningRate: float = Field(default=0.01, description="Local learning rate for SGD")
    partitionStrategy: str = Field(default="NON_IID", description="IID or NON_IID")
    randomSeed: int = Field(default=42, description="Random seed for reproducibility")
    aggregationStrategy: str = Field(default="FedAvg", description="Aggregation strategy")
    datasetId: str = Field(..., description="ID of the processed dataset to use")
    modelName: str = Field(default="FL-Model-v1", description="Base name for the global model")

class FederatedJobResponse(BaseModel):
    success: bool
    jobId: str
    status: str
    message: Optional[str] = None

class FederatedClientSchema(BaseModel):
    clientId: str
    status: str
    sampleCount: int
    localAccuracy: Optional[float] = None
    localLoss: Optional[float] = None
    localF1: Optional[float] = None
    lastTrainingTime: Optional[str] = None
    
class FederatedRoundSchema(BaseModel):
    roundId: str
    roundNumber: int
    status: str
    participatingClients: int
    droppedClients: int
    totalClientSamples: int
    globalMetrics: Dict[str, Any]
    startedAt: str
    completedAt: Optional[str] = None

class FederatedStatusResponse(BaseModel):
    success: bool
    jobId: Optional[str] = None
    status: str
    currentRound: int = 0
    totalRounds: int = 0
    activeClients: int = 0
    latestGlobalModel: Optional[str] = None
    latestMetrics: Dict[str, Any] = Field(default_factory=dict)
