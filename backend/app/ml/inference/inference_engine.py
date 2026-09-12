import time
import pandas as pd
from typing import Dict, Any, Optional
import logging
from pydantic import BaseModel

from app.ml.providers.active_model_provider import active_model_provider

logger = logging.getLogger("trustchain.ml.inference")

class InferenceResponse(BaseModel):
    modelId: str
    modelVersion: str
    trainingType: str
    predictedClass: str
    confidence: float
    timestamp: float
    latencyMs: float

class InferenceEngine:
    async def predict(self, features: Dict[str, Any]) -> Optional[InferenceResponse]:
        """
        Takes raw features, aligns them with the active model schema, and returns a prediction.
        """
        start_time = time.time()
        
        model, meta, schema = await active_model_provider.get_active_model()
        if not model or not meta or not schema:
            logger.warning("Inference attempted but no active model is loaded.")
            return None
            
        # Convert to DataFrame
        df = pd.DataFrame([features])
        
        # Align features: fill missing with 0, drop extra
        expected_features = schema.get("features", [])
        for f in expected_features:
            if f not in df.columns:
                df[f] = 0.0
                
        df = df[expected_features]
        
        # Predict
        predicted_idx = model.predict(df)[0]
        
        # We need to map predicted_idx to class name. 
        # Usually model.classes_ holds this.
        if hasattr(model, "classes_") and len(model.classes_) > predicted_idx:
            predicted_class = str(model.classes_[predicted_idx])
        else:
            predicted_class = str(predicted_idx)
            
        # Confidence
        confidence = 1.0
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(df)[0]
            confidence = float(max(probs))
            
        latency_ms = (time.time() - start_time) * 1000.0
        
        return InferenceResponse(
            modelId=meta.modelId,
            modelVersion=meta.version,
            trainingType=meta.trainingType,
            predictedClass=predicted_class,
            confidence=confidence,
            timestamp=time.time(),
            latencyMs=latency_ms
        )

inference_engine = InferenceEngine()
