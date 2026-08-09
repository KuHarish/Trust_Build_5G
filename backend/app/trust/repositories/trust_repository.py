"""
TrustChain-5G Module 3: Adaptive Trust Evaluation Engine
Trust MongoDB CRUD Repositories.
"""
import logging
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from app.database.client import db

from app.trust.models.profile import TrustProfile
from app.trust.models.history import TrustEvaluationHistory, HistoricalInteraction
from app.trust.models.compliance import SecurityCompliance

logger = logging.getLogger("trustchain.trust.repository")


class TrustProfileRepository:
    def __init__(self):
        self._memory_store: Dict[str, Dict[str, Any]] = {}

    def _get_collection(self) -> Optional[AsyncIOMotorCollection]:
        database = db.get_db()
        if database is not None:
            return database.get_collection("trust_profiles")
        return None

    async def get_by_node_id(self, node_id: str) -> Optional[TrustProfile]:
        collection = self._get_collection()
        if collection is not None:
            try:
                data = await collection.find_one({"nodeId": node_id})
                if data:
                    return TrustProfile(**data)
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
        
        # Fallback
        for item in self._memory_store.values():
            if item.get("nodeId") == node_id:
                return TrustProfile(**item)
        return None

    async def get_all(self) -> List[TrustProfile]:
        collection = self._get_collection()
        if collection is not None:
            try:
                cursor = collection.find({})
                profiles = await cursor.to_list(length=1000)
                return [TrustProfile(**p) for p in profiles]
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
        
        return [TrustProfile(**item) for item in self._memory_store.values()]

    async def create(self, profile: TrustProfile) -> TrustProfile:
        collection = self._get_collection()
        p_dict = profile.model_dump(by_alias=True)
        if collection is not None:
            try:
                await collection.insert_one(p_dict)
                return profile
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
                
        self._memory_store[profile.trustProfileId] = p_dict
        return profile

    async def update(self, profile: TrustProfile) -> TrustProfile:
        collection = self._get_collection()
        p_dict = profile.model_dump(by_alias=True)
        if collection is not None:
            try:
                await collection.replace_one({"trustProfileId": profile.trustProfileId}, p_dict)
                return profile
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
                
        self._memory_store[profile.trustProfileId] = p_dict
        return profile


class HistoricalInteractionRepository:
    def __init__(self):
        self._memory_store: Dict[str, Dict[str, Any]] = {}

    def _get_collection(self) -> Optional[AsyncIOMotorCollection]:
        database = db.get_db()
        if database is not None:
            return database.get_collection("historical_interactions")
        return None

    async def create(self, interaction: HistoricalInteraction) -> HistoricalInteraction:
        collection = self._get_collection()
        i_dict = interaction.model_dump(by_alias=True)
        if collection is not None:
            try:
                await collection.insert_one(i_dict)
                return interaction
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
                
        self._memory_store[interaction.interactionId] = i_dict
        return interaction

    async def get_by_node_id(self, node_id: str, limit: int = 50) -> List[HistoricalInteraction]:
        collection = self._get_collection()
        if collection is not None:
            try:
                cursor = collection.find({
                    "$or": [{"sourceNode": node_id}, {"destinationNode": node_id}]
                }).sort("timestamp", -1).limit(limit)
                records = await cursor.to_list(length=limit)
                return [HistoricalInteraction(**r) for r in records]
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
        
        matches = [
            HistoricalInteraction(**v) for v in self._memory_store.values() 
            if v.get("sourceNode") == node_id or v.get("destinationNode") == node_id
        ]
        matches.sort(key=lambda x: x.timestamp, reverse=True)
        return matches[:limit]


class TrustEvaluationHistoryRepository:
    def __init__(self):
        self._memory_store: Dict[str, Dict[str, Any]] = {}

    def _get_collection(self) -> Optional[AsyncIOMotorCollection]:
        database = db.get_db()
        if database is not None:
            return database.get_collection("trust_evaluations")
        return None

    async def create(self, evaluation: TrustEvaluationHistory) -> TrustEvaluationHistory:
        collection = self._get_collection()
        e_dict = evaluation.model_dump(by_alias=True)
        if collection is not None:
            try:
                await collection.insert_one(e_dict)
                return evaluation
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
                
        self._memory_store[evaluation.evaluationId] = e_dict
        return evaluation

    async def get_by_node_id(self, node_id: str, limit: int = 50) -> List[TrustEvaluationHistory]:
        collection = self._get_collection()
        if collection is not None:
            try:
                cursor = collection.find({"nodeId": node_id}).sort("timestamp", -1).limit(limit)
                records = await cursor.to_list(length=limit)
                return [TrustEvaluationHistory(**r) for r in records]
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
                
        matches = [TrustEvaluationHistory(**v) for v in self._memory_store.values() if v.get("nodeId") == node_id]
        matches.sort(key=lambda x: x.timestamp, reverse=True)
        return matches[:limit]

    async def get_recent_global_history(self, limit: int = 50) -> List[TrustEvaluationHistory]:
        collection = self._get_collection()
        if collection is not None:
            try:
                cursor = collection.find({}).sort("timestamp", -1).limit(limit)
                records = await cursor.to_list(length=limit)
                return [TrustEvaluationHistory(**r) for r in records]
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
                
        matches = [TrustEvaluationHistory(**v) for v in self._memory_store.values()]
        matches.sort(key=lambda x: x.timestamp, reverse=True)
        return matches[:limit]


class SecurityComplianceRepository:
    def __init__(self):
        self._memory_store: Dict[str, Dict[str, Any]] = {}

    def _get_collection(self) -> Optional[AsyncIOMotorCollection]:
        database = db.get_db()
        if database is not None:
            return database.get_collection("security_compliance")
        return None

    async def get_by_node_id(self, node_id: str) -> Optional[SecurityCompliance]:
        collection = self._get_collection()
        if collection is not None:
            try:
                data = await collection.find_one({"nodeId": node_id})
                if data:
                    return SecurityCompliance(**data)
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
                
        for item in self._memory_store.values():
            if item.get("nodeId") == node_id:
                return SecurityCompliance(**item)
        return None

    async def create(self, compliance: SecurityCompliance) -> SecurityCompliance:
        collection = self._get_collection()
        c_dict = compliance.model_dump(by_alias=True)
        if collection is not None:
            try:
                await collection.insert_one(c_dict)
                return compliance
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
                
        self._memory_store[compliance.complianceId] = c_dict
        return compliance


trust_profile_repo = TrustProfileRepository()
historical_interaction_repo = HistoricalInteractionRepository()
trust_evaluation_history_repo = TrustEvaluationHistoryRepository()
security_compliance_repo = SecurityComplianceRepository()
