from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.ml.models.ml_model import MLModel, TrainingJob

class ModelTrainRequest(BaseModel):
    datasetId: str
    algorithm: str = "RandomForest"
    modelName: str
    description: Optional[str] = ""
    parameters: Dict[str, Any] = Field(default_factory=lambda: {
        "n_estimators": 100,
        "max_depth": None,
        "min_samples_split": 2,
        "min_samples_leaf": 1,
        "max_features": "sqrt",
        "class_weight": None,
        "random_state": 42
    })

class ModelTrainResponse(BaseModel):
    success: bool
    jobId: Optional[str] = None
    modelId: Optional[str] = None
    status: Optional[str] = None
    message: Optional[str] = None

class JobResponse(BaseModel):
    success: bool
    data: Optional[TrainingJob] = None
    message: Optional[str] = None

class JobListResponse(BaseModel):
    success: bool
    data: List[TrainingJob] = Field(default_factory=list)

class ModelListResponse(BaseModel):
    success: bool
    data: List[MLModel] = Field(default_factory=list)

class ModelResponse(BaseModel):
    success: bool
    data: Optional[MLModel] = None
    message: Optional[str] = None

class ConfusionMatrixResponse(BaseModel):
    success: bool
    classes: List[str] = Field(default_factory=list)
    raw_matrix: List[List[int]] = Field(default_factory=list)
    normalized_matrix: List[List[float]] = Field(default_factory=list)
    message: Optional[str] = None
