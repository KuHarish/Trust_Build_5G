import os
import uuid
import time
import logging
import pandas as pd
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Tuple
from sklearn.ensemble import RandomForestClassifier

from app.ml.models.ml_model import MLModel, TrainingJob
from app.ml.schemas.ml_model import ModelTrainRequest
from app.ml.repositories.ml_repository import ml_repository
from app.ml.services.model_artifact_service import model_artifact_service
from app.ml.services.model_evaluation_service import model_evaluation_service
from app.ml.services.dataset_service import ml_repository as dataset_repo # reuse to get dataset

logger = logging.getLogger("trustchain.ml.training_service")

PROCESSED_DIR = os.path.join(os.getcwd(), "data", "processed")

class ModelTrainingService:
    async def start_training_job(self, req: ModelTrainRequest) -> Tuple[str, str]:
        job_id = str(uuid.uuid4())
        model_id = str(uuid.uuid4())
        
        job = TrainingJob(
            jobId=job_id,
            modelId=model_id,
            datasetId=req.datasetId,
            status="PENDING",
            progress=0,
            currentStep="QUEUED"
        )
        
        # We will create the initial MLModel record
        model = MLModel(
            modelId=model_id,
            modelName=req.modelName,
            algorithm=req.algorithm,
            version="1.0.0", # Hardcoded initial version for now, versioning logic can handle bumps
            datasetId=req.datasetId,
            parameters=req.parameters,
            artifactPath="",
            status="TRAINING"
        )
        
        await ml_repository.save_job(job)
        await ml_repository.save_model(model)
        
        # Fire and forget background training
        asyncio.create_task(self._execute_training(job_id, req))
        
        return job_id, model_id

    async def _update_job(self, job_id: str, status: str, step: str, progress: int, error: str = None):
        job = await ml_repository.get_job(job_id)
        if job:
            job.status = status
            job.currentStep = step
            job.progress = progress
            if error:
                job.error = error
                job.logs.append(f"ERROR: {error}")
            job.logs.append(f"[{datetime.now(timezone.utc).isoformat()}] Step: {step}")
            if status in ["COMPLETED", "FAILED"]:
                job.completedAt = datetime.now(timezone.utc).isoformat()
            await ml_repository.save_job(job)

    async def _fail_job(self, job_id: str, error: str, model_id: str):
        logger.error(f"Job {job_id} failed: {error}")
        await self._update_job(job_id, "FAILED", "FAILED", 0, error)
        model = await ml_repository.get_model(model_id)
        if model:
            model.status = "FAILED"
            await ml_repository.save_model(model)

    async def _execute_training(self, job_id: str, req: ModelTrainRequest):
        job = await ml_repository.get_job(job_id)
        if not job:
            return
            
        model_id = job.modelId
        try:
            # 1. LOAD DATASET
            await self._update_job(job_id, "IN_PROGRESS", "LOADING_DATASET", 10)
            dataset = await dataset_repo.get_dataset(req.datasetId)
            if not dataset or dataset.status != "READY":
                raise ValueError("Dataset not found or not READY")
                
            train_path = os.path.join(PROCESSED_DIR, f"{req.datasetId}_train.csv")
            val_path = os.path.join(PROCESSED_DIR, f"{req.datasetId}_val.csv")
            test_path = os.path.join(PROCESSED_DIR, f"{req.datasetId}_test.csv")
            
            if not all([os.path.exists(p) for p in [train_path, val_path, test_path]]):
                raise FileNotFoundError("Processed dataset splits not found. Run preprocessing first.")
                
            train_df = pd.read_csv(train_path)
            val_df = pd.read_csv(val_path)
            test_df = pd.read_csv(test_path)
            
            # 2. PREPARING FEATURES
            await self._update_job(job_id, "IN_PROGRESS", "PREPARING_FEATURES", 20)
            
            # The pipeline appends '_normalized' to label col, or uses original if it didn't
            target_col = f"{dataset.labelColumn}_normalized"
            if target_col not in train_df.columns:
                target_col = dataset.labelColumn
                
            if target_col not in train_df.columns:
                raise ValueError(f"Label column {target_col} not found in processed data")
                
            X_train = train_df.drop(columns=[target_col])
            y_train = train_df[target_col]
            
            X_val = val_df.drop(columns=[target_col])
            y_val = val_df[target_col]
            
            X_test = test_df.drop(columns=[target_col])
            y_test = test_df[target_col]
            
            features = list(X_train.columns)
            
            # 3. TRAINING
            await self._update_job(job_id, "IN_PROGRESS", "TRAINING", 40)
            
            # Convert class_weight="None" string to None object
            params = dict(req.parameters)
            if params.get("class_weight") == "None" or not params.get("class_weight"):
                params["class_weight"] = None
                
            model = RandomForestClassifier(**params)
            
            start_time = time.time()
            # This is synchronous CPU bound, in a real production async app we'd use run_in_executor
            # But for local dev sprint 4.2 it's acceptable directly here.
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, model.fit, X_train, y_train)
            end_time = time.time()
            
            # 4. EVALUATING
            await self._update_job(job_id, "IN_PROGRESS", "VALIDATING", 70)
            # We evaluate on validation set to get metrics for the registry
            val_metrics, val_cm = model_evaluation_service.evaluate(model, X_val, y_val, {})
            
            # 5. SAVING MODEL
            await self._update_job(job_id, "IN_PROGRESS", "SAVING_MODEL", 85)
            
            ml_model = await ml_repository.get_model(model_id)
            
            ml_model.trainingSamples = len(X_train)
            ml_model.validationSamples = len(X_val)
            ml_model.testSamples = len(X_test)
            ml_model.metrics = val_metrics
            ml_model.featureNames = features
            ml_model.status = "EVALUATED"
            
            # We save the model artifacts
            artifact_path = model_artifact_service.save_artifact(
                model=model, 
                metadata=ml_model, 
                feature_schema={"features": features, "version": "1.0"}, 
                preprocessing_config={} # Assume loaded from dataset registry if needed
            )
            
            ml_model.artifactPath = artifact_path
            await ml_repository.save_model(ml_model)
            
            # 6. COMPLETED
            await self._update_job(job_id, "COMPLETED", "COMPLETED", 100)
            logger.info(f"Model {model_id} trained successfully in {end_time - start_time:.2f}s")
            
        except Exception as e:
            await self._fail_job(job_id, str(e), model_id)

model_training_service = ModelTrainingService()
