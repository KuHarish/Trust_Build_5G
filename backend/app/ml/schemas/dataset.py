from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class DatasetRegistrationRequest(BaseModel):
    name: str
    version: Optional[str] = "1.0"
    description: Optional[str] = ""
    source: str
    filePath: str
    format: Optional[str] = "CSV"
    labelColumn: Optional[str] = "Label"

class DatasetProcessRequest(BaseModel):
    removeColumns: List[str] = Field(default_factory=list)
    handleMissing: str = Field(default="drop", description="drop, mean, median, mode")
    handleInfinite: str = Field(default="drop", description="drop, replace")
    removeDuplicates: bool = Field(default=True)
    encodeCategorical: bool = Field(default=True)
    scaleNumerical: bool = Field(default=True)
    scalerType: str = Field(default="StandardScaler", description="StandardScaler, MinMaxScaler")
    testSize: float = Field(default=0.15)
    valSize: float = Field(default=0.15)
    randomSeed: int = Field(default=42)

class DatasetStatisticsResponse(BaseModel):
    success: bool
    datasetId: str
    totalSamples: int = 0
    features: int = 0
    classes: int = 0
    classDistribution: Dict[str, int] = Field(default_factory=dict)
    trainingSamples: int = 0
    validationSamples: int = 0
    testingSamples: int = 0
    missingValues: int = 0
    duplicateRows: int = 0

class DatasetResponse(BaseModel):
    success: bool
    data: Any
    message: Optional[str] = None
