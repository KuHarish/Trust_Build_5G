"""
TrustChain-5G Module 2 Schemas Package.
"""
from app.edge.schemas.event import (
    EventCreateRequest,
    EventListResponse,
    EventSingleResponse,
    EdgeStatisticsResponse,
)
from app.edge.schemas.feature import (
    FeatureListResponse,
    FeatureSingleResponse,
)

__all__ = [
    "EventCreateRequest",
    "EventListResponse",
    "EventSingleResponse",
    "EdgeStatisticsResponse",
    "FeatureListResponse",
    "FeatureSingleResponse",
]
