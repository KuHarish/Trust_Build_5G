import os
import uuid
import pandas as pd
import logging
from typing import List, Dict, Any
from app.ml.models.dataset import Dataset
from app.ml.schemas.dataset import DatasetRegistrationRequest, DatasetProcessRequest, DatasetStatisticsResponse
from app.ml.repositories.ml_repository import ml_repository
from app.ml.preprocessing.pipeline import PreprocessingPipeline

logger = logging.getLogger("trustchain.ml.dataset_service")

DATA_DIR = os.path.join(os.getcwd(), "datasets")
PROCESSED_DIR = os.path.join(os.getcwd(), "data", "processed")

os.makedirs(PROCESSED_DIR, exist_ok=True)

class DatasetService:
    async def register_dataset(self, req: DatasetRegistrationRequest) -> Dataset:
        dataset_id = str(uuid.uuid4())
        
        # Check file exists
        full_path = req.filePath
        if not os.path.isabs(full_path):
            full_path = os.path.join(DATA_DIR, req.filePath)
            
        status = "REGISTERED"
        if not os.path.exists(full_path):
            logger.warning(f"File {full_path} not found. Dataset registered but unavailable.")
            status = "FAILED"
        else:
            status = "UPLOADED"
            
        dataset = Dataset(
            datasetId=dataset_id,
            name=req.name,
            version=req.version,
            description=req.description,
            source=req.source,
            filePath=full_path,
            format=req.format,
            labelColumn=req.labelColumn,
            status=status
        )
        
        if status == "UPLOADED":
            # Basic validation reading header
            try:
                if req.format.upper() == "CSV":
                    df = pd.read_csv(full_path, nrows=5)
                    dataset.featureCount = len(df.columns)
                    if req.labelColumn not in df.columns:
                        dataset.status = "FAILED"
                        dataset.description += " (Label column not found)"
                elif req.format.upper() == "PARQUET":
                    df = pd.read_parquet(full_path)
                    dataset.featureCount = len(df.columns)
            except Exception as e:
                logger.error(f"Error validating dataset: {e}")
                dataset.status = "FAILED"
        
        return await ml_repository.register_dataset(dataset)

    async def list_datasets(self) -> List[Dataset]:
        return await ml_repository.list_datasets()

    async def get_dataset(self, dataset_id: str) -> Dataset:
        return await ml_repository.get_dataset(dataset_id)

    async def process_dataset(self, dataset_id: str, config: DatasetProcessRequest) -> DatasetStatisticsResponse:
        dataset = await ml_repository.get_dataset(dataset_id)
        if not dataset:
            return DatasetStatisticsResponse(success=False, datasetId=dataset_id)
            
        if not os.path.exists(dataset.filePath):
            await ml_repository.update_dataset_status(dataset_id, "FAILED")
            return DatasetStatisticsResponse(success=False, datasetId=dataset_id)

        await ml_repository.update_dataset_status(dataset_id, "PROCESSING")
        
        try:
            # Load dataset
            if dataset.format.upper() == "CSV":
                df = pd.read_csv(dataset.filePath)
            else:
                df = pd.read_parquet(dataset.filePath)
                
            pipeline = PreprocessingPipeline(config)
            train_df, val_df, test_df, stats = pipeline.process(df, dataset.labelColumn)
            
            # Save splits
            train_path = os.path.join(PROCESSED_DIR, f"{dataset_id}_train.csv")
            val_path = os.path.join(PROCESSED_DIR, f"{dataset_id}_val.csv")
            test_path = os.path.join(PROCESSED_DIR, f"{dataset_id}_test.csv")
            
            train_df.to_csv(train_path, index=False)
            val_df.to_csv(val_path, index=False)
            test_df.to_csv(test_path, index=False)
            
            # Update metadata
            extra = {
                "rowCount": stats["totalSamples"],
                "featureCount": stats["features"],
                "classCount": stats["classes"]
            }
            await ml_repository.update_dataset_status(dataset_id, "READY", extra)
            
            # Ideally we would save the statistics directly to Mongo as well.
            # But returning it for the UI response.
            response = DatasetStatisticsResponse(
                success=True,
                datasetId=dataset_id,
                **stats
            )
            return response
            
        except Exception as e:
            logger.error(f"Processing failed for dataset {dataset_id}: {e}")
            await ml_repository.update_dataset_status(dataset_id, "FAILED")
            return DatasetStatisticsResponse(success=False, datasetId=dataset_id)

dataset_service = DatasetService()
