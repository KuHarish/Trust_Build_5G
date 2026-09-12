from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class MLModel(BaseModel):
    modelId: str = Field(..., description="Unique model identifier")
    modelName: str = Field(..., description="Human readable name")
    algorithm: str = Field(default="RandomForest", description="Algorithm used")
    version: str = Field(..., description="Model version")
    datasetId: str = Field(..., description="Dataset used for training")
    datasetVersion: str = Field(default="1.0")
    featureVersion: str = Field(default="1.0")
    preprocessingVersion: str = Field(default="1.0")
    trainingDate: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    trainingSamples: int = Field(default=0)
    validationSamples: int = Field(default=0)
    testSamples: int = Field(default=0)
    parameters: Dict[str, Any] = Field(default_factory=dict)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    labelMapping: Dict[str, str] = Field(default_factory=dict)
    featureNames: List[str] = Field(default_factory=list)
    artifactPath: str = Field(..., description="Path to the saved model artifact directory")
    status: str = Field(default="TRAINED", description="TRAINED, EVALUATED, VALIDATED, ACTIVE, FAILED, ARCHIVED")
    isActive: bool = Field(default=False)
    trainingType: str = Field(default="CENTRALIZED", description="CENTRALIZED, FEDERATED")
    aggregationStrategy: Optional[str] = Field(default=None)
    clientCount: Optional[int] = Field(default=None)
    trainingRounds: Optional[int] = Field(default=None)
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TrainingJob(BaseModel):
    jobId: str = Field(..., description="Unique job identifier")
    modelId: str = Field(..., description="Associated model ID")
    datasetId: str = Field(..., description="Dataset used")
    status: str = Field(default="PENDING", description="PENDING, IN_PROGRESS, COMPLETED, FAILED")
    progress: int = Field(default=0, description="0 to 100")
    currentStep: str = Field(default="LOADING_DATASET")
    startedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completedAt: Optional[str] = None
    error: Optional[str] = None
    logs: List[str] = Field(default_factory=list)
