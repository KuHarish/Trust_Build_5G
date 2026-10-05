from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class ExperimentCreateRequest(BaseModel):
    name: str = Field(..., example="Base comparison")
    description: Optional[str] = None
    datasetId: str
    centralizedModelId: str
    federatedModelId: str
    randomSeed: Optional[int] = 42

class MetricDifferences(BaseModel):
    centralizedMetric: float
    federatedMetric: float
    absoluteDifference: float
    relativeDifference: float

class ComparisonResponse(BaseModel):
    experimentId: str
    status: str
    centralizedMetrics: Optional[Dict[str, float]]
    federatedMetrics: Optional[Dict[str, float]]
    metricDifferences: Optional[Dict[str, MetricDifferences]]
    communicationInformation: Optional[Dict[str, Any]]
    
class ExperimentSummary(BaseModel):
    experimentId: str
    name: str
    status: str
    centralizedModelId: str
    federatedModelId: str
    completedAt: Optional[float]
