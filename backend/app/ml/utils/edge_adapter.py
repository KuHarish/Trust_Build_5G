from typing import Dict, Any, List
import pandas as pd
from app.edge.models.feature import NetworkFeature
from app.ml.preprocessing.pipeline import PreprocessingPipeline

class EdgeFeatureAdapter:
    """
    Adapter to map Module 2 Edge Server extracted features into 
    the unified machine learning feature schema for Module 4 inference.
    """
    def __init__(self, pipeline: PreprocessingPipeline = None):
        self.pipeline = pipeline

    def map_features(self, feature: NetworkFeature) -> Dict[str, Any]:
        """
        Extract numeric values and normalized forms from the edge feature model.
        """
        raw_dict = {
            "nodeId": feature.nodeId,
            "communicationCount": feature.communicationCount,
            "avgPacketSize": feature.avgPacketSize,
            "avgPayloadSize": feature.avgPayloadSize,
            "avgLatency": feature.avgLatency,
            "avgBandwidth": feature.avgBandwidth,
            "avgJitter": feature.avgJitter,
            "avgSignalStrength": feature.avgSignalStrength,
            "avgTtl": feature.avgTtl,
            "avgHopCount": feature.avgHopCount,
            "transmissionSuccessRate": feature.transmissionSuccessRate,
            "packetFrequency": feature.packetFrequency,
            "connectionDuration": feature.connectionDuration,
        }
        
        # Flatten normalized edge features
        for k, v in feature.normalizedFeatures.items():
            raw_dict[k] = v
            
        return raw_dict

    def to_dataframe(self, features: List[NetworkFeature]) -> pd.DataFrame:
        """
        Convert a list of edge features into a Pandas DataFrame for batch ML inference.
        """
        data = [self.map_features(f) for f in features]
        df = pd.DataFrame(data)
        
        # If we have an active pipeline with a scaler, we could theoretically apply it here
        # But generally, inference pipeline applies the scaler directly.
        if self.pipeline and self.pipeline.scaler and not df.empty:
            num_cols = df.select_dtypes(include=['number']).columns
            # This is a naive transform; in reality, we'd ensure columns match training exactly
            try:
                # We would only transform if columns match exactly.
                pass 
            except ValueError:
                pass
                
        return df
