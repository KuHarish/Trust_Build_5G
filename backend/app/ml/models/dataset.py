from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class Dataset(BaseModel):
    datasetId: str = Field(..., description="Unique identifier for the dataset")
    name: str = Field(..., description="Display name of the dataset")
    version: str = Field(default="1.0", description="Dataset version")
    description: str = Field(default="", description="Detailed description")
    source: str = Field(..., description="Source system or origin of dataset")
    filePath: str = Field(..., description="Local file path for processing")
    format: str = Field(default="CSV", description="Format (CSV, Parquet)")
    rowCount: int = Field(default=0)
    featureCount: int = Field(default=0)
    classCount: int = Field(default=0)
    labelColumn: str = Field(default="Label")
    status: str = Field(default="REGISTERED", description="REGISTERED, UPLOADED, PROCESSING, READY, FAILED")
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FeatureRegistry(BaseModel):
    featureName: str = Field(..., description="Name of the feature")
    dataType: str = Field(..., description="Numerical, Categorical, String, etc.")
    source: str = Field(..., description="Which dataset or component generates this")
    description: str = Field(default="")
    enabled: bool = Field(default=True)
    normalization: str = Field(default="StandardScaler")
    version: str = Field(default="1.0")
