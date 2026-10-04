from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.core.dependencies import get_current_user_token
from app.schemas.common import APIResponse
from app.simulator.services.simulation_service import simulation_service
from app.simulator.repositories.node_repository import node_repository
from app.simulator.models.simulation import SimulationStatusResponse, SimulationEvent
from app.simulator.models.node import SimulationNode

router = APIRouter(prefix="/simulation", tags=["Simulation Control"])

@router.get("/status", response_model=APIResponse, summary="Get simulation engine status")
async def get_simulation_status(user=Depends(get_current_user_token)):
    status_data = await simulation_service.getSimulationStatusAsync()
    return APIResponse(success=True, message="Simulation status retrieved", data=status_data.model_dump())

@router.post("/start", response_model=APIResponse, summary="Start simulation")
async def start_simulation(user=Depends(get_current_user_token)):
    await simulation_service.startSimulation()
    status_data = await simulation_service.getSimulationStatusAsync()
    return APIResponse(success=True, message="Simulation started", data=status_data.model_dump())

@router.post("/pause", response_model=APIResponse, summary="Pause simulation")
async def pause_simulation(user=Depends(get_current_user_token)):
    await simulation_service.pauseSimulation()
    status_data = await simulation_service.getSimulationStatusAsync()
    return APIResponse(success=True, message="Simulation paused", data=status_data.model_dump())

@router.post("/resume", response_model=APIResponse, summary="Resume simulation")
async def resume_simulation(user=Depends(get_current_user_token)):
    await simulation_service.resumeSimulation()
    status_data = await simulation_service.getSimulationStatusAsync()
    return APIResponse(success=True, message="Simulation resumed", data=status_data.model_dump())

@router.post("/stop", response_model=APIResponse, summary="Stop simulation")
async def stop_simulation(user=Depends(get_current_user_token)):
    await simulation_service.stopSimulation()
    status_data = await simulation_service.getSimulationStatusAsync()
    return APIResponse(success=True, message="Simulation stopped", data=status_data.model_dump())

@router.post("/reset", response_model=APIResponse, summary="Reset simulation and topology")
async def reset_simulation(user=Depends(get_current_user_token)):
    await simulation_service.resetSimulation()
    status_data = await simulation_service.getSimulationStatusAsync()
    return APIResponse(success=True, message="Simulation reset", data=status_data.model_dump())

from pydantic import BaseModel
class AttackTriggerRequest(BaseModel):
    attackerNodeId: str
    attackType: str = "DDoS"
    intensity: str = "MEDIUM"
    duration: int = 30

@router.post("/attack", response_model=APIResponse, summary="Trigger manual attack on a node")
async def trigger_simulation_attack(req: AttackTriggerRequest, user=Depends(get_current_user_token)):
    try:
        attack = await simulation_service.trigger_attack(
            attacker_node_id=req.attackerNodeId,
            attack_type=req.attackType,
            intensity=req.intensity,
            duration=req.duration
        )
        return APIResponse(success=True, message=f"Attack triggered on {req.attackerNodeId}", data=attack)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/nodes", response_model=APIResponse, summary="Get all simulation nodes")
async def get_simulation_nodes(user=Depends(get_current_user_token)):
    nodes = await node_repository.get_all()
    node_dicts = [n.model_dump(by_alias=True) for n in nodes]
    return APIResponse(success=True, message="Simulation nodes retrieved", data=node_dicts)

@router.get("/events", response_model=APIResponse, summary="Get simulation events")
async def get_simulation_events(limit: int = 100, user=Depends(get_current_user_token)):
    events = simulation_service.get_events()
    # Return latest N events
    recent = events[-limit:] if limit > 0 else events
    event_dicts = [e.model_dump(by_alias=True) for e in recent]
    return APIResponse(success=True, message="Simulation events retrieved", data=event_dicts)
