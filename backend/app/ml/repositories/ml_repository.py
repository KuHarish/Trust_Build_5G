import logging
from typing import List, Optional, Dict, Any
from app.database.client import Database
from app.ml.models.dataset import Dataset, FeatureRegistry

logger = logging.getLogger("trustchain.ml.repository")

class MLRepository:
    def __init__(self):
        self._datasets_memory: Dict[str, dict] = {}
        self._features_memory: Dict[str, dict] = {}

    def _get_datasets_collection(self):
        db = Database.get_db()
        return db["ml_datasets"] if db is not None else None

    def _get_features_collection(self):
        db = Database.get_db()
        return db["ml_features"] if db is not None else None

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

ml_repository = MLRepository()
