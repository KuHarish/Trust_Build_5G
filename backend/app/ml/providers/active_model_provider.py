import logging
import asyncio
from typing import Optional, Dict, Any, Tuple

from app.ml.repositories.ml_repository import ml_repository
from app.ml.services.model_artifact_service import model_artifact_service
from app.ml.models.ml_model import MLModel

logger = logging.getLogger("trustchain.ml.active_model_provider")

class ActiveModelProvider:
    def __init__(self):
        self._active_model_metadata: Optional[MLModel] = None
        self._active_model_instance: Optional[Any] = None
        self._feature_schema: Optional[Dict[str, Any]] = None
        self._preprocessing_config: Optional[Dict[str, Any]] = None
        self._lock = asyncio.Lock()
        
    async def get_active_model(self) -> Tuple[Optional[Any], Optional[MLModel], Optional[Dict[str, Any]]]:
        """
        Returns the in-memory loaded active model, its metadata, and feature schema.
        If it's not loaded but one is active in DB, loads it dynamically.
        """
        async with self._lock:
            db_active_model = await ml_repository.get_active_model()
            
            if not db_active_model:
                return None, None, None
                
            # If we already have this exact model loaded, return it
            if self._active_model_metadata and self._active_model_metadata.modelId == db_active_model.modelId:
                return self._active_model_instance, self._active_model_metadata, self._feature_schema
                
            # Otherwise, we need to load it (Context Switch)
            logger.info(f"Loading active model {db_active_model.modelId} into memory.")
            try:
                model, meta, feats, prep = model_artifact_service.load_artifact(db_active_model.modelId)
                self._active_model_instance = model
                self._active_model_metadata = meta
                self._feature_schema = feats
                self._preprocessing_config = prep
                return self._active_model_instance, self._active_model_metadata, self._feature_schema
            except Exception as e:
                logger.error(f"Failed to load active model: {e}")
                return None, None, None

active_model_provider = ActiveModelProvider()
