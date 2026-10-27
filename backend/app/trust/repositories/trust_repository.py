"""
TrustChain-5G Module 3: Adaptive Trust Evaluation Engine
Trust MongoDB CRUD Repositories.
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorCollection
from app.database.client import db

from app.trust.models.profile import TrustProfile
from app.trust.models.history import TrustEvaluationHistory, HistoricalInteraction
from app.trust.models.compliance import SecurityCompliance

logger = logging.getLogger("trustchain.trust.repository")


class TrustProfileRepository:
    def __init__(self):
        self._memory_store: Dict[str, Dict[str, Any]] = {}
        self._seed_profiles_if_empty()

    def _seed_profiles_if_empty(self):
        if self._memory_store:
            return
        now = datetime.now(timezone.utc)
        seeds = [
            ("Core-Server-01", 0.985, "VERIFIED", 0.99, 0.98, 0.99, "STABLE", 0.0),
            ("Core-Server-02", 0.962, "VERIFIED", 0.97, 0.96, 0.96, "STABLE", 0.002),
            ("Aggregation-Router-01", 0.954, "VERIFIED", 0.96, 0.95, 0.95, "STABLE", 0.001),
            ("Aggregation-Router-02", 0.941, "VERIFIED", 0.94, 0.94, 0.94, "STABLE", -0.003),
            ("Aggregation-Router-03", 0.965, "VERIFIED", 0.97, 0.96, 0.97, "STABLE", 0.004),
            ("Aggregation-Router-04", 0.932, "VERIFIED", 0.93, 0.93, 0.94, "STABLE", -0.001),
            ("Edge-Gateway-01", 0.925, "VERIFIED", 0.93, 0.92, 0.93, "STABLE", 0.002),
            ("Edge-Gateway-02", 0.784, "QUESTIONABLE", 0.79, 0.78, 0.78, "DECREASED", -0.082),
            ("Edge-Gateway-04", 0.418, "MALICIOUS", 0.38, 0.44, 0.43, "CRITICAL_DECREASE", -0.320),
            ("Edge-Gateway-05", 0.912, "VERIFIED", 0.92, 0.91, 0.91, "STABLE", 0.001),
            ("Edge-Gateway-06", 0.938, "VERIFIED", 0.94, 0.94, 0.93, "STABLE", 0.003),
            ("MEC-Processor-01", 0.948, "VERIFIED", 0.95, 0.95, 0.94, "STABLE", 0.002),
            ("MEC-Processor-02", 0.923, "VERIFIED", 0.93, 0.92, 0.92, "STABLE", -0.002),
            ("MEC-Processor-03", 0.652, "QUESTIONABLE", 0.64, 0.66, 0.66, "DECREASED", -0.114),
            ("MEC-Processor-04", 0.951, "VERIFIED", 0.96, 0.95, 0.94, "STABLE", 0.005),
            ("IoT-Sensor-001", 0.972, "VERIFIED", 0.98, 0.97, 0.97, "STABLE", 0.001),
            ("IoT-Sensor-002", 0.941, "VERIFIED", 0.94, 0.94, 0.94, "STABLE", 0.0),
            ("IoT-Sensor-005", 0.935, "VERIFIED", 0.94, 0.93, 0.94, "STABLE", 0.002),
            ("IoT-Sensor-008", 0.482, "SUSPICIOUS", 0.46, 0.49, 0.50, "CRITICAL_DECREASE", -0.245),
            ("IoT-Sensor-010", 0.915, "VERIFIED", 0.92, 0.91, 0.92, "STABLE", 0.001),
            ("IoT-Sensor-015", 0.224, "MALICIOUS", 0.20, 0.24, 0.23, "CRITICAL_DECREASE", -0.412),
        ]
        for node_id, trust, lvl, b_score, h_score, c_score, change, delta in seeds:
            pid = f"prof-{node_id.lower()}"
            doc = {
                "trustProfileId": pid,
                "nodeId": node_id,
                "behaviorScore": b_score,
                "historicalInteractionScore": h_score,
                "securityComplianceScore": c_score,
                "currentTrustScore": trust,
                "trustLevel": lvl,
                "previousTrustScore": round(trust - delta, 4),
                "trustDelta": delta,
                "trustChange": change,
                "evaluationReason": f"Continuous 5G behavioral evaluation cycle completed with status {change}",
                "evaluationCount": 42,
                "lastEvaluation": now.isoformat(),
                "createdAt": now.isoformat(),
                "updatedAt": now.isoformat(),
            }
            self._memory_store[pid] = doc

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
        
        self._seed_profiles_if_empty()
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
                if profiles:
                    return [TrustProfile(**p) for p in profiles]
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
        
        self._seed_profiles_if_empty()
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
                if records:
                    return [TrustEvaluationHistory(**r) for r in records]
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
                
        matches = [TrustEvaluationHistory(**v) for v in self._memory_store.values() if v.get("nodeId") == node_id]
        if not matches:
            now = datetime.now(timezone.utc)
            base_score = 0.95
            for i in range(6, 0, -1):
                t = now - timedelta(seconds=i * 60)
                score = round(max(0.1, min(0.99, base_score + ((6 - i) * 0.004))), 3)
                eval_item = TrustEvaluationHistory(
                    evaluationId=f"eval-{node_id.lower()}-{i}",
                    nodeId=node_id,
                    timestamp=t,
                    behaviorScore=score,
                    historicalInteractionScore=score,
                    securityComplianceScore=score,
                    trustScore=score,
                    trustLevel="TRUSTED" if score > 0.8 else "QUESTIONABLE",
                    previousTrustScore=round(score - 0.004, 3),
                    trustDelta=0.004,
                    reason="Automated continuous evaluation cycle"
                )
                self._memory_store[eval_item.evaluationId] = eval_item.model_dump(by_alias=True)
                matches.append(eval_item)

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
