"""
TrustChain-5G Module 3: Adaptive Trust Evaluation Engine
Trust Configuration Repository
"""
import logging
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from app.database.client import db
from app.trust.models.config import TrustConfiguration

logger = logging.getLogger("trustchain.trust.config_repository")

class TrustConfigurationRepository:
    def __init__(self):
        self._memory_store: Dict[str, Dict[str, Any]] = {}

    def _get_collection(self) -> Optional[AsyncIOMotorCollection]:
        database = db.get_db()
        if database is not None:
            return database.get_collection("trust_configuration")
        return None

    async def get_active_config(self) -> TrustConfiguration:
        """Fetches the single active configuration, or initializes the default."""
        collection = self._get_collection()
        if collection is not None:
            try:
                data = await collection.find_one({"enabled": True})
                if data:
                    return TrustConfiguration(**data)
                else:
                    # Create default
                    default_config = TrustConfiguration()
                    await collection.insert_one(default_config.model_dump(by_alias=True))
                    return default_config
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
                
        # Fallback
        for item in self._memory_store.values():
            if item.get("enabled") is True:
                return TrustConfiguration(**item)
                
        default_config = TrustConfiguration()
        self._memory_store[default_config.configurationId] = default_config.model_dump(by_alias=True)
        return default_config

    async def update_config(self, new_config: TrustConfiguration) -> TrustConfiguration:
        """Disables old active configs and activates the new one."""
        collection = self._get_collection()
        new_dict = new_config.model_dump(by_alias=True)
        if collection is not None:
            try:
                # Disable all others
                await collection.update_many({"enabled": True}, {"$set": {"enabled": False}})
                # Insert new active
                await collection.insert_one(new_dict)
                return new_config
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
                
        for k in self._memory_store.keys():
            self._memory_store[k]["enabled"] = False
        self._memory_store[new_config.configurationId] = new_dict
        return new_config

config_repository = TrustConfigurationRepository()
