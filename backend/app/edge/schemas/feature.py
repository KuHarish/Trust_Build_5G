"""
TrustChain-5G Module 2: Edge Server & Feature Extraction - Feature Validation & Response Schemas.
"""
from typing import List
from pydantic import BaseModel
from app.edge.models.feature import NetworkFeature

class FeatureListResponse(BaseModel):
    success: bool = True
    total_count: int
    data: List[NetworkFeature]

class FeatureSingleResponse(BaseModel):
    success: bool = True
    data: NetworkFeature
