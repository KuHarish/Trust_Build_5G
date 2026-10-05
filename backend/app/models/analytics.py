"""
TrustChain-5G Analytics Collection Domain Model.

Defines time-series metrics schemas for historical trends across network traffic, attack volumes, and average trust quotients.
"""

from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class TimeSeriesDataPoint(BaseModel):
    """
    Individual timestamped scalar metric point.
    """
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Sample timestamp")
    value: float = Field(..., description="Captured scalar measurement")
    label: Optional[str] = Field(default=None, description="Supplementary dimension tag (e.g., 'Protocol: UDP')")


class AnalyticsMetricModel(BaseModel):
    """
    MongoDB schema representing aggregated analytical reports in the 'Analytics' collection.
    """
    metric_id: str = Field(..., alias="_id", description="Unique analytical summary token")
    metric_type: str = Field(..., description="Classification category (e.g., 'NETWORK_THROUGHPUT_24H', 'ATTACK_DISTRIBUTION_BY_TYPE', 'AVERAGE_CLUSTER_TRUST_SCORE')")
    time_window: str = Field(default="24h", description="Evaluated time frame (e.g., '1h', '24h', '7d', '30d')")
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Synthesis timestamp")
    summary_stats: Dict[str, float] = Field(
        default_factory=lambda: {"mean": 0.0, "peak": 0.0, "minimum": 0.0, "current": 0.0},
        description="Core descriptive statistical aggregates"
    )
    series: List[TimeSeriesDataPoint] = Field(default_factory=list, description="Ordered timeline datapoints for chart rendering")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Custom segmentation parameters")

    class Config:
        populate_by_name = True
        from_attributes = True
