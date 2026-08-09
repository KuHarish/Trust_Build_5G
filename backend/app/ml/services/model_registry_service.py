import os
import pandas as pd
import logging
from typing import Dict, Any, Tuple
from app.ml.repositories.ml_repository import ml_repository
from app.ml.services.model_artifact_service import model_artifact_service
from app.ml.services.model_evaluation_service import model_evaluation_service

logger = logging.getLogger("trustchain.ml.registry_service")

PROCESSED_DIR = os.path.join(os.getcwd(), "data", "processed")

class ModelRegistryService:
    async def evaluate_on_test(self, model_id: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        ml_model = await ml_repository.get_model(model_id)
        if not ml_model:
            raise ValueError("Model not found")
            
        if ml_model.status not in ["EVALUATED", "VALIDATED", "ACTIVE"]:
            raise ValueError(f"Model cannot be evaluated in status {ml_model.status}")
            
        model, metadata, feature_schema, _ = model_artifact_service.load_artifact(model_id)
        
        test_path = os.path.join(PROCESSED_DIR, f"{ml_model.datasetId}_test.csv")
        if not os.path.exists(test_path):
            raise FileNotFoundError("Test dataset not found")
            
        test_df = pd.read_csv(test_path)
        
        # Determine target column
        # Ideally we read this from metadata, but fallback to logic
        target_col = None
        for col in test_df.columns:
            if "Label" in col or "Label_normalized" in col:
                target_col = col
        
        if not target_col:
            raise ValueError("Label column not found in test data")
            
        X_test = test_df.drop(columns=[target_col])
        y_test = test_df[target_col]
        
        # Data leakage / schema check
        if list(X_test.columns) != metadata.featureNames:
            raise ValueError("Feature schema mismatch between model and test data")
            
        metrics, cm_data = model_evaluation_service.evaluate(model, X_test, y_test, {})
        
        # If we re-evaluated, update metrics
        ml_model.metrics = metrics
        if ml_model.status == "EVALUATED":
            ml_model.status = "VALIDATED"
        await ml_repository.save_model(ml_model)
        
        return metrics, cm_data
        
    async def activate_model(self, model_id: str) -> bool:
        ml_model = await ml_repository.get_model(model_id)
        if not ml_model:
            raise ValueError("Model not found")
            
        if ml_model.status not in ["EVALUATED", "VALIDATED"]:
            raise ValueError(f"Model must be evaluated/validated before activation, got {ml_model.status}")
            
        # Verify artifact exists by doing a dry-run load
        try:
            model_artifact_service.load_artifact(model_id)
        except Exception as e:
            raise ValueError(f"Cannot activate: Model artifact validation failed: {e}")
            
        # Archive current active model
        current_active = await ml_repository.get_active_model()
        if current_active:
            current_active.isActive = False
            current_active.status = "ARCHIVED"
            await ml_repository.save_model(current_active)
            
        ml_model.isActive = True
        ml_model.status = "ACTIVE"
        await ml_repository.save_model(ml_model)
        
        logger.info(f"Model {model_id} has been ACTIVATED.")
        return True
        
    async def archive_model(self, model_id: str) -> bool:
        ml_model = await ml_repository.get_model(model_id)
        if not ml_model:
            raise ValueError("Model not found")
            
        ml_model.isActive = False
        ml_model.status = "ARCHIVED"
        await ml_repository.save_model(ml_model)
        
        logger.info(f"Model {model_id} has been ARCHIVED.")
        return True

model_registry_service = ModelRegistryService()
