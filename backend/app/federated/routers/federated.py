from fastapi import APIRouter, HTTPException
from typing import List, Any
from app.federated.schemas.federated import FederatedConfig, FederatedJobResponse, FederatedStatusResponse, FederatedClientSchema, FederatedRoundSchema
from app.federated.services.federated_training_service import federated_training_service
from app.federated.repositories.federated_repository import federated_repository

router = APIRouter(prefix="", tags=["Federated Learning"])

@router.post("/start", response_model=FederatedJobResponse)
async def start_federated_training(config: FederatedConfig):
    try:
        job_id = await federated_training_service.start_federated_job(config)
        return FederatedJobResponse(success=True, jobId=job_id, status="STARTING")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status", response_model=FederatedStatusResponse)
async def get_federated_status():
    job = await federated_repository.get_active_job()
    if not job:
        return FederatedStatusResponse(success=True, status="IDLE")
        
    return FederatedStatusResponse(
        success=True,
        jobId=job.jobId,
        status=job.status,
        currentRound=job.currentRound,
        totalRounds=job.totalRounds,
        activeClients=job.participatingClients,
        latestGlobalModel=job.latestGlobalModel,
        latestMetrics=job.latestMetrics
    )

@router.get("/clients")
async def get_clients():
    clients = await federated_repository.list_clients()
    return {"success": True, "data": clients}

@router.get("/rounds")
async def get_rounds(jobId: str = None):
    # If jobId is provided, get for that job, else get for active job
    if not jobId:
        job = await federated_repository.get_active_job()
        if not job:
            return {"success": True, "data": []}
        jobId = job.jobId
        
    rounds = await federated_repository.list_rounds_for_job(jobId)
    return {"success": True, "data": rounds}

@router.post("/stop")
async def stop_federated_training():
    job = await federated_repository.get_active_job()
    if not job:
        raise HTTPException(status_code=400, detail="No active federated job to stop")
        
    job.status = "STOPPED"
    await federated_repository.save_job(job)
    return {"success": True, "message": "Federated training stop requested"}
