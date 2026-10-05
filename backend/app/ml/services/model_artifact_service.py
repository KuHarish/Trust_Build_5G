import os
import json
import logging
import joblib
from typing import Dict, Any, Tuple, Optional
from app.ml.models.ml_model import MLModel

logger = logging.getLogger("trustchain.ml.artifact_service")

MODELS_DIR = os.path.join(os.getcwd(), "models", "random_forest")
os.makedirs(MODELS_DIR, exist_ok=True)

class ModelArtifactService:
    def _get_model_dir(self, model_id: str) -> str:
        model_dir = os.path.join(MODELS_DIR, model_id)
        os.makedirs(model_dir, exist_ok=True)
        return model_dir

    def save_artifact(self, model: Any, metadata: MLModel, feature_schema: Dict[str, Any], preprocessing_config: Dict[str, Any]) -> str:
        try:
            model_dir = self._get_model_dir(metadata.modelId)
            
            # Save pickled model
            model_path = os.path.join(model_dir, "model.pkl")
            joblib.dump(model, model_path)
            
            # Save metadata JSON
            metadata_path = os.path.join(model_dir, "metadata.json")
            with open(metadata_path, 'w') as f:
                f.write(metadata.model_dump_json(indent=2))
                
            # Save feature schema
            schema_path = os.path.join(model_dir, "feature_schema.json")
            with open(schema_path, 'w') as f:
                json.dump(feature_schema, f, indent=2)
                
            # Save preprocessing config
            prep_path = os.path.join(model_dir, "preprocessing.json")
            with open(prep_path, 'w') as f:
                json.dump(preprocessing_config, f, indent=2)
                
            logger.info(f"Successfully saved artifacts for model {metadata.modelId}")
            return model_dir
        except Exception as e:
            logger.error(f"Failed to save artifacts for model {metadata.modelId}: {e}")
            raise e

    def load_artifact(self, model_id: str) -> Tuple[Any, MLModel, Dict[str, Any], Dict[str, Any]]:
        model_dir = os.path.join(MODELS_DIR, model_id)
        
        if not os.path.exists(model_dir):
            raise FileNotFoundError(f"Model directory for {model_id} does not exist.")
            
        model_path = os.path.join(model_dir, "model.pkl")
        metadata_path = os.path.join(model_dir, "metadata.json")
        schema_path = os.path.join(model_dir, "feature_schema.json")
        prep_path = os.path.join(model_dir, "preprocessing.json")
        
        if not all([os.path.exists(p) for p in [model_path, metadata_path, schema_path, prep_path]]):
            raise FileNotFoundError(f"Missing required artifact files in {model_dir}")
            
        try:
            model = joblib.load(model_path)
            
            with open(metadata_path, 'r') as f:
                metadata = MLModel.model_validate_json(f.read())
                
            with open(schema_path, 'r') as f:
                feature_schema = json.load(f)
                
            with open(prep_path, 'r') as f:
                preprocessing_config = json.load(f)
                
            return model, metadata, feature_schema, preprocessing_config
        except Exception as e:
            logger.error(f"Error loading model artifacts for {model_id}: {e}")
            raise e

model_artifact_service = ModelArtifactService()
