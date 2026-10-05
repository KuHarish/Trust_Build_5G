from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import time

class Experiment(BaseModel):
    experimentId: str
    name: str
    description: Optional[str] = None
    datasetId: str
    centralizedModelId: str
    federatedModelId: str
    randomSeed: Optional[int] = 42
    testSetId: Optional[str] = None
    
    createdAt: float = Field(default_factory=time.time)
    completedAt: Optional[float] = None
    status: str = "CREATED" # CREATED, RUNNING, COMPLETED, FAILED
    
    # Store results here to avoid re-evaluating
    centralizedMetrics: Optional[Dict[str, Any]] = None
    federatedMetrics: Optional[Dict[str, Any]] = None
    metricDifferences: Optional[Dict[str, Any]] = None
    communicationInformation: Optional[Dict[str, Any]] = None
