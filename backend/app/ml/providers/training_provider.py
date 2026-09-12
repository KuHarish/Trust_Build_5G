from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class MLTrainingProvider(ABC):
    @abstractmethod
    async def start_training(self, config: Dict[str, Any]) -> str:
        """Starts a training job and returns a job ID."""
        pass

    @abstractmethod
    async def get_status(self, job_id: str) -> Dict[str, Any]:
        """Returns the current status of the training job."""
        pass

    @abstractmethod
    async def cancel_training(self, job_id: str) -> bool:
        """Cancels a running training job."""
        pass

# Example of adapting the Centralized ML Pipeline to this Provider Interface
class CentralizedTrainingProvider(MLTrainingProvider):
    async def start_training(self, config: Dict[str, Any]) -> str:
        from app.ml.services.model_training_service import model_training_service
        return await model_training_service.start_training_job(config.get("datasetId"), config.get("config"))
        
    async def get_status(self, job_id: str) -> Dict[str, Any]:
        from app.ml.services.model_training_service import model_training_service
        job = await model_training_service.get_job_status(job_id)
        if not job:
            return {"status": "NOT_FOUND"}
        return {
            "jobId": job.jobId,
            "status": job.status,
            "error": job.error,
            "progress": job.progress,
            "metrics": job.metrics
        }
        
    async def cancel_training(self, job_id: str) -> bool:
        from app.ml.services.model_training_service import model_training_service
        job = await model_training_service.get_job_status(job_id)
        if job and job.status in ["STARTING", "IN_PROGRESS", "RUNNING"]:
            job.status = "CANCELLED"
            # Actually stopping the thread is harder, but we mark it cancelled
            return True
        return False

# Example of adapting the Federated Learning Engine to this Provider Interface
class FederatedTrainingProvider(MLTrainingProvider):
    async def start_training(self, config: Dict[str, Any]) -> str:
        from app.federated.services.federated_training_service import federated_training_service
        from app.federated.schemas.federated import FederatedConfig
        fl_config = FederatedConfig(**config)
        return await federated_training_service.start_federated_job(fl_config)
        
    async def get_status(self, job_id: str) -> Dict[str, Any]:
        from app.federated.repositories.federated_repository import federated_repository
        job = await federated_repository.get_job(job_id)
        if not job:
            return {"status": "NOT_FOUND"}
        return {
            "jobId": job.jobId,
            "status": job.status,
            "error": job.error,
            "currentRound": job.currentRound,
            "totalRounds": job.totalRounds,
            "metrics": job.latestMetrics
        }
        
    async def cancel_training(self, job_id: str) -> bool:
        from app.federated.repositories.federated_repository import federated_repository
        job = await federated_repository.get_job(job_id)
        if job and job.status in ["STARTING", "IN_PROGRESS", "RUNNING"]:
            job.status = "STOPPED"
            await federated_repository.save_job(job)
            return True
        return False
