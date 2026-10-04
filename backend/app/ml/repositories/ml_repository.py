import logging
from typing import List, Optional, Dict, Any
from app.database.client import Database
from app.ml.models.dataset import Dataset, FeatureRegistry
from app.ml.models.ml_model import MLModel, TrainingJob

logger = logging.getLogger("trustchain.ml.repository")

class MLRepository:
    def __init__(self):
        self._datasets_memory: Dict[str, dict] = {}
        self._features_memory: Dict[str, dict] = {}
        self._models_memory: Dict[str, dict] = {}
        self._jobs_memory: Dict[str, dict] = {}
        self._experiments_memory: Dict[str, dict] = {}

    def _get_datasets_collection(self):
        db = Database.get_db()
        return db["ml_datasets"] if db is not None else None

    def _get_features_collection(self):
        db = Database.get_db()
        return db["ml_features"] if db is not None else None

    def _get_models_collection(self):
        db = Database.get_db()
        return db["ml_models"] if db is not None else None

    def _get_jobs_collection(self):
        db = Database.get_db()
        return db["ml_training_jobs"] if db is not None else None

    async def register_dataset(self, dataset: Dataset) -> Dataset:
        data = dataset.model_dump()
        coll = self._get_datasets_collection()
        if coll is not None:
            try:
                await coll.update_one({"datasetId": dataset.datasetId}, {"$set": data}, upsert=True)
            except Exception as e:
                logger.warning(f"Mongo register_dataset error ({e}), fallback to memory.")
                self._datasets_memory[dataset.datasetId] = data
        else:
            self._datasets_memory[dataset.datasetId] = data
        return dataset

    async def get_dataset(self, dataset_id: str) -> Optional[Dataset]:
        coll = self._get_datasets_collection()
        if coll is not None:
            try:
                doc = await coll.find_one({"datasetId": dataset_id}, {"_id": 0})
                if doc:
                    return Dataset(**doc)
            except Exception as e:
                logger.warning(f"Mongo get_dataset error ({e}), fallback to memory.")
                
        doc = self._datasets_memory.get(dataset_id)
        return Dataset(**doc) if doc else None

    async def list_datasets(self) -> List[Dataset]:
        coll = self._get_datasets_collection()
        if coll is not None:
            try:
                cursor = coll.find({}, {"_id": 0}).sort("createdAt", -1)
                docs = await cursor.to_list(length=100)
                return [Dataset(**doc) for doc in docs]
            except Exception as e:
                logger.warning(f"Mongo list_datasets error ({e}), fallback to memory.")
                
        return [Dataset(**doc) for doc in self._datasets_memory.values()]

    async def update_dataset_status(self, dataset_id: str, status: str, extra: dict = None) -> bool:
        coll = self._get_datasets_collection()
        update_data = {"status": status}
        if extra:
            update_data.update(extra)
            
        if coll is not None:
            try:
                res = await coll.update_one({"datasetId": dataset_id}, {"$set": update_data})
                if res.modified_count > 0:
                    return True
            except Exception as e:
                logger.warning(f"Mongo update_dataset_status error ({e}).")
                
        if dataset_id in self._datasets_memory:
            self._datasets_memory[dataset_id].update(update_data)
            return True
        return False

    async def register_feature(self, feature: FeatureRegistry) -> FeatureRegistry:
        data = feature.model_dump()
        coll = self._get_features_collection()
        if coll is not None:
            try:
                await coll.update_one({"featureName": feature.featureName}, {"$set": data}, upsert=True)
            except Exception as e:
                logger.warning(f"Mongo register_feature error ({e}).")
                self._features_memory[feature.featureName] = data
        else:
            self._features_memory[feature.featureName] = data
        return feature

    async def list_features(self) -> List[FeatureRegistry]:
        coll = self._get_features_collection()
        if coll is not None:
            try:
                cursor = coll.find({}, {"_id": 0})
                docs = await cursor.to_list(length=500)
                return [FeatureRegistry(**doc) for doc in docs]
            except Exception as e:
                logger.warning(f"Mongo list_features error ({e}).")
                
        return [FeatureRegistry(**doc) for doc in self._features_memory.values()]

    # ML Models
    async def save_model(self, model: MLModel) -> MLModel:
        data = model.model_dump()
        coll = self._get_models_collection()
        if coll is not None:
            try:
                await coll.update_one({"modelId": model.modelId}, {"$set": data}, upsert=True)
            except Exception as e:
                logger.warning(f"Mongo save_model error ({e}).")
                self._models_memory[model.modelId] = data
        else:
            self._models_memory[model.modelId] = data
        return model

    async def get_model(self, model_id: str) -> Optional[MLModel]:
        coll = self._get_models_collection()
        if coll is not None:
            try:
                doc = await coll.find_one({"modelId": model_id}, {"_id": 0})
                if doc:
                    return MLModel(**doc)
            except Exception as e:
                logger.warning(f"Mongo get_model error ({e}).")
        
        doc = self._models_memory.get(model_id)
        return MLModel(**doc) if doc else None

    async def list_models(self) -> List[MLModel]:
        coll = self._get_models_collection()
        if coll is not None:
            try:
                cursor = coll.find({}, {"_id": 0}).sort("createdAt", -1)
                docs = await cursor.to_list(length=100)
                return [MLModel(**doc) for doc in docs]
            except Exception as e:
                logger.warning(f"Mongo list_models error ({e}).")
        return [MLModel(**doc) for doc in self._models_memory.values()]

    async def get_active_model(self) -> Optional[MLModel]:
        coll = self._get_models_collection()
        if coll is not None:
            try:
                doc = await coll.find_one({"isActive": True}, {"_id": 0})
                if doc:
                    return MLModel(**doc)
            except Exception as e:
                logger.warning(f"Mongo get_active_model error ({e}).")
        
        for doc in self._models_memory.values():
            if doc.get("isActive") is True:
                return MLModel(**doc)
        return None

    # Training Jobs
    async def save_job(self, job: TrainingJob) -> TrainingJob:
        data = job.model_dump()
        coll = self._get_jobs_collection()
        if coll is not None:
            try:
                await coll.update_one({"jobId": job.jobId}, {"$set": data}, upsert=True)
            except Exception as e:
                logger.warning(f"Mongo save_job error ({e}).")
                self._jobs_memory[job.jobId] = data
        else:
            self._jobs_memory[job.jobId] = data
        return job

    async def get_job(self, job_id: str) -> Optional[TrainingJob]:
        coll = self._get_jobs_collection()
        if coll is not None:
            try:
                doc = await coll.find_one({"jobId": job_id}, {"_id": 0})
                if doc:
                    return TrainingJob(**doc)
            except Exception as e:
                logger.warning(f"Mongo get_job error ({e}).")
        
        doc = self._jobs_memory.get(job_id)
        return TrainingJob(**doc) if doc else None

    async def list_jobs(self) -> List[TrainingJob]:
        coll = self._get_jobs_collection()
        if coll is not None:
            try:
                cursor = coll.find({}, {"_id": 0}).sort("startedAt", -1)
                docs = await cursor.to_list(length=100)
                return [TrainingJob(**doc) for doc in docs]
            except Exception as e:
                logger.warning(f"Mongo list_jobs error ({e}).")
        return [TrainingJob(**doc) for doc in self._jobs_memory.values()]

    # Experiments
    def _get_experiments_collection(self):
        db = Database.get_db()
        return db["ml_experiments"] if db is not None else None

    async def save_experiment(self, exp) -> Any:
        data = exp.model_dump()
        coll = self._get_experiments_collection()
        if coll is not None:
            try:
                await coll.update_one({"experimentId": exp.experimentId}, {"$set": data}, upsert=True)
            except Exception as e:
                logger.warning(f"Mongo save_experiment error ({e}).")
                self._experiments_memory[exp.experimentId] = data
        else:
            self._experiments_memory[exp.experimentId] = data
        return exp

    async def get_experiment(self, exp_id: str) -> Optional[Any]:
        from app.ml.models.experiment import Experiment
        coll = self._get_experiments_collection()
        if coll is not None:
            try:
                doc = await coll.find_one({"experimentId": exp_id}, {"_id": 0})
                if doc:
                    return Experiment(**doc)
            except Exception as e:
                logger.warning(f"Mongo get_experiment error ({e}).")
        
        doc = self._experiments_memory.get(exp_id)
        return Experiment(**doc) if doc else None

    async def list_experiments(self) -> List[Any]:
        from app.ml.models.experiment import Experiment
        coll = self._get_experiments_collection()
        if coll is not None:
            try:
                cursor = coll.find({}, {"_id": 0}).sort("completedAt", -1)
                docs = await cursor.to_list(length=100)
                return [Experiment(**doc) for doc in docs]
            except Exception as e:
                logger.warning(f"Mongo list_experiments error ({e}).")
        return [Experiment(**doc) for doc in self._experiments_memory.values()]

ml_repository = MLRepository()
