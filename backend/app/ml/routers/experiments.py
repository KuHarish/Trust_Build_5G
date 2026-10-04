from fastapi import APIRouter, HTTPException
from typing import List

from app.api.v1.endpoints import APIResponse
from app.ml.schemas.experiment import ExperimentCreateRequest, ComparisonResponse, ExperimentSummary
from app.ml.services.experiment_service import experiment_service
from app.ml.repositories.ml_repository import ml_repository

router = APIRouter(prefix="", tags=["Machine Learning Experiments"])

@router.post("", response_model=APIResponse)
async def create_experiment(req: ExperimentCreateRequest):
    try:
        exp = await experiment_service.create_experiment(req)
        return APIResponse(success=True, message="Experiment created", data={"experimentId": exp.experimentId})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{exp_id}/run", response_model=APIResponse)
async def run_experiment(exp_id: str):
    try:
        await experiment_service.run_experiment(exp_id)
        return APIResponse(success=True, message="Experiment started")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("", response_model=APIResponse)
async def list_experiments():
    exps = await ml_repository.list_experiments()
    data = [
        ExperimentSummary(
            experimentId=e.experimentId,
            name=e.name,
            status=e.status,
            centralizedModelId=e.centralizedModelId,
            federatedModelId=e.federatedModelId,
            completedAt=e.completedAt
        ).model_dump() for e in exps
    ]
    return APIResponse(success=True, data=data)

@router.get("/{exp_id}", response_model=APIResponse)
async def get_experiment(exp_id: str):
    exp = await ml_repository.get_experiment(exp_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
        
    return APIResponse(success=True, data=exp.model_dump())

@router.get("/comparison/{exp_id}", response_model=APIResponse)
async def get_experiment_comparison(exp_id: str):
    exp = await ml_repository.get_experiment(exp_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
        
    if exp.status != "COMPLETED":
        return APIResponse(success=False, message="Experiment not completed yet")
        
    res = ComparisonResponse(
        experimentId=exp.experimentId,
        status=exp.status,
        centralizedMetrics=exp.centralizedMetrics,
        federatedMetrics=exp.federatedMetrics,
        metricDifferences=exp.metricDifferences,
        communicationInformation=exp.communicationInformation
    )
    return APIResponse(success=True, data=res.model_dump())
