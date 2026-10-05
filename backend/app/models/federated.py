"""
TrustChain-5G FederatedModels Collection Domain Model.

Defines schemas for distributed federated learning weights, aggregation rounds, and model integrity verifications.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class TrainingRoundStatus(str, Enum):
    INITIALIZED = "Initialized"
    COLLECTING_GRADIENTS = "Collecting Gradients"
    AGGREGATION_IN_PROGRESS = "Aggregation In Progress"
    COMPLETED = "Completed"
    FAILED = "Failed"


class FederatedModelRecord(BaseModel):
    """
    MongoDB schema representing AI threat detection model rounds in the 'FederatedModels' collection.
    """
    model_id: str = Field(..., alias="_id", description="Unique global iteration version ID (e.g. FL-MODEL-R042)")
    round_number: int = Field(..., description="Sequential collaborative training epoch index")
    architecture_name: str = Field(default="DeepAutoencoder-IntrusionDetector", description="Neutral net topological layout name")
    status: TrainingRoundStatus = Field(default=TrainingRoundStatus.COMPLETED, description="Operational state of federated aggregation round")
    global_weights_hash: str = Field(..., description="SHA-256 fingerprint of compiled global model parameters")
    participating_nodes_count: int = Field(default=0, description="Total count of edge servers contributing gradient updates")
    participating_node_ids: List[str] = Field(default_factory=list, description="Identifiers of contributing Edge Nodes")
    accuracy_metric: float = Field(default=0.978, description="Evaluated detection F1 accuracy on test benchmark dataset")
    false_positive_rate: float = Field(default=0.012, description="Evaluated false positive percentage on benign traffic")
    aggregation_algorithm: str = Field(default="FedAvg-Robust-Outlier-Rejection", description="Mathematical consensus formula applied")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Completion timestamp of model synthesis")

    class Config:
        populate_by_name = True
        from_attributes = True
