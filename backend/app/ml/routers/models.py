from fastapi import APIRouter, HTTPException, Depends
from app.ml.schemas.ml_model import (
    ModelTrainRequest, ModelTrainResponse, JobResponse, JobListResponse,
    ModelListResponse, ModelResponse, ConfusionMatrixResponse
)
from app.ml.services.model_training_service import model_training_service
from app.ml.services.model_registry_service import model_registry_service
from app.ml.repositories.ml_repository import ml_repository

router = APIRouter(prefix="", tags=["ML Models & Training"])

# TRAINING JOBS
@router.post("/models/train", response_model=ModelTrainResponse)
async def train_model(req: ModelTrainRequest):
    try:
        job_id, model_id = await model_training_service.start_training_job(req)
        return ModelTrainResponse(success=True, jobId=job_id, modelId=model_id, status="PENDING")
    except Exception as e:
        return ModelTrainResponse(success=False, message=str(e))

@router.get("/training/jobs", response_model=JobListResponse)
async def list_jobs():
    jobs = await ml_repository.list_jobs()
    return JobListResponse(success=True, data=jobs)

@router.get("/training/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = await ml_repository.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse(success=True, data=job)

# MODEL REGISTRY
@router.get("/models", response_model=ModelListResponse)
async def list_models():
    models = await ml_repository.list_models()
    return ModelListResponse(success=True, data=models)

@router.get("/models/{model_id}", response_model=ModelResponse)
async def get_model(model_id: str):
    model = await ml_repository.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return ModelResponse(success=True, data=model)

@router.get("/models/{model_id}/metrics")
async def get_model_metrics(model_id: str):
    model = await ml_repository.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"success": True, "data": model.metrics}

@router.get("/models/{model_id}/confusion-matrix", response_model=ConfusionMatrixResponse)
async def get_confusion_matrix(model_id: str):
    # To return the matrix, we need to evaluate it or use cached if we saved it
    # We didn't save the raw matrix to the DB (it can be large), so we compute it on the fly
    try:
        _, cm_data = await model_registry_service.evaluate_on_test(model_id)
        return ConfusionMatrixResponse(
            success=True, 
            classes=cm_data["classes"], 
            raw_matrix=cm_data["raw_matrix"], 
            normalized_matrix=cm_data["normalized_matrix"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/models/{model_id}/evaluate")
async def evaluate_model(model_id: str):
    try:
        metrics, _ = await model_registry_service.evaluate_on_test(model_id)
        return {"success": True, "data": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/models/{model_id}/activate")
async def activate_model(model_id: str):
    try:
        res = await model_registry_service.activate_model(model_id)
        return {"success": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/models/{model_id}/archive")
async def archive_model(model_id: str):
    try:
        res = await model_registry_service.archive_model(model_id)
        return {"success": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
