from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.ml.schemas.dataset import DatasetRegistrationRequest, DatasetProcessRequest, DatasetStatisticsResponse, DatasetResponse
from app.ml.models.dataset import Dataset, FeatureRegistry
from app.ml.services.dataset_service import dataset_service
from app.ml.repositories.ml_repository import ml_repository

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.post("/datasets/register", response_model=DatasetResponse)
async def register_dataset(req: DatasetRegistrationRequest):
    dataset = await dataset_service.register_dataset(req)
    if dataset.status == "FAILED":
        return DatasetResponse(success=False, data=dataset, message="Dataset registration failed or file not found")
    return DatasetResponse(success=True, data=dataset, message="Dataset registered successfully")

@router.get("/datasets", response_model=DatasetResponse)
async def list_datasets():
    datasets = await dataset_service.list_datasets()
    return DatasetResponse(success=True, data=datasets)

@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(dataset_id: str):
    dataset = await dataset_service.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return DatasetResponse(success=True, data=dataset)

@router.post("/datasets/{dataset_id}/process", response_model=DatasetStatisticsResponse)
async def process_dataset(dataset_id: str, config: DatasetProcessRequest):
    result = await dataset_service.process_dataset(dataset_id, config)
    if not result.success:
        raise HTTPException(status_code=400, detail="Processing failed. Check if file exists or label column is correct.")
    return result

@router.get("/features", response_model=DatasetResponse)
async def list_features():
    features = await ml_repository.list_features()
    return DatasetResponse(success=True, data=features)

@router.post("/features/register", response_model=DatasetResponse)
async def register_feature(feature: FeatureRegistry):
    res = await ml_repository.register_feature(feature)
    return DatasetResponse(success=True, data=res)
