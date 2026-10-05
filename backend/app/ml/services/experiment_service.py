import uuid
import time
import asyncio
import logging
from typing import Dict, Any

from app.ml.models.experiment import Experiment
from app.ml.repositories.ml_repository import ml_repository
from app.ml.services.model_registry_service import model_registry_service

logger = logging.getLogger("trustchain.ml.experiment_service")

class ExperimentService:
    async def create_experiment(self, req) -> Experiment:
        exp_id = str(uuid.uuid4())
        
        cent_model = await ml_repository.get_model(req.centralizedModelId)
        fed_model = await ml_repository.get_model(req.federatedModelId)
        
        if not cent_model or not fed_model:
            raise ValueError("One or both models not found.")
            
        if cent_model.datasetId != fed_model.datasetId:
            raise ValueError("Models must be trained on the same dataset for a fair comparison.")
            
        exp = Experiment(
            experimentId=exp_id,
            name=req.name,
            description=req.description,
            datasetId=cent_model.datasetId,
            centralizedModelId=req.centralizedModelId,
            federatedModelId=req.federatedModelId,
            randomSeed=req.randomSeed
        )
        await ml_repository.save_experiment(exp)
        return exp

    async def run_experiment(self, exp_id: str):
        exp = await ml_repository.get_experiment(exp_id)
        if not exp:
            raise ValueError("Experiment not found")
            
        exp.status = "RUNNING"
        await ml_repository.save_experiment(exp)
        
        # We run this in the background
        loop = asyncio.get_running_loop()
        loop.create_task(self._execute_experiment(exp_id))
        
        return {"message": "Experiment started"}

    async def _execute_experiment(self, exp_id: str):
        exp = await ml_repository.get_experiment(exp_id)
        try:
            # 1. Evaluate centralized
            cent_metrics, _ = await model_registry_service.evaluate_on_test(exp.centralizedModelId)
            
            # 2. Evaluate federated
            fed_metrics, _ = await model_registry_service.evaluate_on_test(exp.federatedModelId)
            
            # 3. Calculate differences
            diffs = {}
            for k in cent_metrics.keys():
                if isinstance(cent_metrics[k], (int, float)) and k in fed_metrics:
                    cent_v = float(cent_metrics[k])
                    fed_v = float(fed_metrics[k])
                    abs_diff = fed_v - cent_v
                    rel_diff = (abs_diff / cent_v) if cent_v != 0 else 0
                    diffs[k] = {
                        "centralizedMetric": cent_v,
                        "federatedMetric": fed_v,
                        "absoluteDifference": abs_diff,
                        "relativeDifference": rel_diff
                    }
                    
            exp.centralizedMetrics = cent_metrics
            exp.federatedMetrics = fed_metrics
            exp.metricDifferences = diffs
            
            # Gather communication overhead info for federated model
            fed_model = await ml_repository.get_model(exp.federatedModelId)
            exp.communicationInformation = {
                "trainingRounds": fed_model.trainingRounds,
                "clientCount": fed_model.clientCount,
                "aggregationStrategy": fed_model.aggregationStrategy,
                "raw_data_transmitted": "NO",
                "model_updates_transmitted": "YES"
            }
            
            exp.status = "COMPLETED"
            exp.completedAt = time.time()
            
            # Log to blockchain
            from app.blockchain.services.blockchain_service import blockchain_service
            blockchain_service.record_transaction({
                "eventType": "EXPERIMENT_COMPLETED",
                "experimentId": exp.experimentId,
                "datasetId": exp.datasetId,
                "centralizedModelId": exp.centralizedModelId,
                "federatedModelId": exp.federatedModelId
            })
            
        except Exception as e:
            logger.error(f"Experiment failed: {e}")
            exp.status = "FAILED"
            
        await ml_repository.save_experiment(exp)

experiment_service = ExperimentService()
