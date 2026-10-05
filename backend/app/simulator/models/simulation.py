from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid
from pydantic import BaseModel, Field

class SimulationState(str, Enum):
    STOPPED = "STOPPED"
    STARTING = "STARTING"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    STOPPING = "STOPPING"

class SimulationEventType(str, Enum):
    SIMULATION_STARTED = "SIMULATION_STARTED"
    SIMULATION_PAUSED = "SIMULATION_PAUSED"
    SIMULATION_RESUMED = "SIMULATION_RESUMED"
    SIMULATION_STOPPED = "SIMULATION_STOPPED"
    SIMULATION_RESET = "SIMULATION_RESET"
    NODE_CREATED = "NODE_CREATED"
    NODE_STATUS_CHANGED = "NODE_STATUS_CHANGED"

class SimulationEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    simulationId: str
    eventType: SimulationEventType
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    simulationTime: float = 0.0
    nodeId: Optional[str] = None
    source: str = "SYSTEM"
    metadata: Dict[str, Any] = Field(default_factory=dict)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        from_attributes = True

class SimulationStatusResponse(BaseModel):
    enabled: bool
    state: SimulationState
    speed: float
    nodeCount: int
    activeNodes: int
    simulationTime: float
