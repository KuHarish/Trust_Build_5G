"""
TrustChain-5G Module 2: Edge Server & Feature Extraction - Repository Layer.
Handles MongoDB persistence for collections: `communication_events` and `network_features`.
Provides full fallback in-memory dict storage during unit tests and offline decoupled execution.
"""
import logging
from typing import List, Optional, Tuple, Dict, Any
from app.database.client import Database
from app.edge.models.event import CommunicationEvent
from app.edge.models.feature import NetworkFeature

logger = logging.getLogger("trustchain.edge.repository")

class EdgeRepository:
    def __init__(self):
        # In-memory storage structures for decoupled testing / Mongo offline mode
        self._events_memory_store: Dict[str, dict] = {}
        self._features_memory_store: Dict[str, dict] = {}
        self._events_order: List[str] = []

    def _get_events_collection(self):
        db = Database.get_db()
        if db is not None:
            return db["communication_events"]
        return None

    def _get_features_collection(self):
        db = Database.get_db()
        if db is not None:
            return db["network_features"]
        return None

    async def insert_event(self, event: CommunicationEvent) -> CommunicationEvent:
        data = event.model_dump()
        coll = self._get_events_collection()
        if coll is not None:
            try:
                await coll.insert_one(data)
            except Exception as e:
                logger.warning(f"Mongo insert_event error ({e}), storing in memory fallback.")
                self._store_event_memory(data, event.eventId)
        else:
            self._store_event_memory(data, event.eventId)
        return event

    def _store_event_memory(self, data: dict, event_id: str):
        self._events_memory_store[event_id] = data
        if event_id not in self._events_order:
            self._events_order.insert(0, event_id)  # Most recent first

    async def list_events(
        self, limit: int = 50, offset: int = 0, search: Optional[str] = None, protocol: Optional[str] = None
    ) -> Tuple[List[CommunicationEvent], int]:
        coll = self._get_events_collection()
        if coll is not None:
            try:
                query: Dict[str, Any] = {}
                if protocol and protocol.upper() != "ALL":
                    query["protocol"] = protocol.upper()
                if search:
                    query["$or"] = [
                        {"sourceNodeId": {"$regex": search, "$options": "i"}},
                        {"destinationNodeId": {"$regex": search, "$options": "i"}},
                        {"eventId": {"$regex": search, "$options": "i"}},
                    ]
                total = await coll.count_documents(query)
                cursor = coll.find(query, {"_id": 0}).sort("timestamp", -1).skip(offset).limit(limit)
                docs = await cursor.to_list(length=limit)
                return [CommunicationEvent(**doc) for doc in docs], total
            except Exception as e:
                logger.warning(f"Mongo list_events error ({e}), switching to memory fallback.")

        # In-memory query logic
        filtered: List[dict] = []
        for eid in self._events_order:
            item = self._events_memory_store[eid]
            if protocol and protocol.upper() != "ALL" and item.get("protocol") != protocol.upper():
                continue
            if search:
                s = search.lower()
                src = str(item.get("sourceNodeId", "")).lower()
                dst = str(item.get("destinationNodeId", "")).lower()
                ev_id = str(item.get("eventId", "")).lower()
                if s not in src and s not in dst and s not in ev_id:
                    continue
            filtered.append(item)
        
        total = len(filtered)
        paginated = filtered[offset : offset + limit]
        return [CommunicationEvent(**doc) for doc in paginated], total

    async def get_event_by_id(self, event_id: str) -> Optional[CommunicationEvent]:
        coll = self._get_events_collection()
        if coll is not None:
            try:
                doc = await coll.find_one({"eventId": event_id}, {"_id": 0})
                if doc:
                    return CommunicationEvent(**doc)
            except Exception as e:
                logger.warning(f"Mongo get_event_by_id error ({e}), fallback to memory.")
        
        item = self._events_memory_store.get(event_id)
        if item:
            return CommunicationEvent(**item)
        return None

    async def delete_event(self, event_id: str) -> bool:
        coll = self._get_events_collection()
        deleted = False
        if coll is not None:
            try:
                res = await coll.delete_one({"eventId": event_id})
                deleted = res.deleted_count > 0
            except Exception as e:
                logger.warning(f"Mongo delete_event error ({e}), fallback to memory.")
        
        if event_id in self._events_memory_store:
            del self._events_memory_store[event_id]
            if event_id in self._events_order:
                self._events_order.remove(event_id)
            deleted = True
        return deleted

    async def count_total_events(self) -> int:
        coll = self._get_events_collection()
        if coll is not None:
            try:
                return await coll.count_documents({})
            except Exception:
                pass
        return len(self._events_memory_store)

    async def upsert_feature(self, feature: NetworkFeature) -> NetworkFeature:
        data = feature.model_dump()
        coll = self._get_features_collection()
        if coll is not None:
            try:
                await coll.update_one({"nodeId": feature.nodeId}, {"$set": data}, upsert=True)
            except Exception as e:
                logger.warning(f"Mongo upsert_feature error ({e}), storing in memory.")
                self._features_memory_store[feature.nodeId] = data
        else:
            self._features_memory_store[feature.nodeId] = data
        return feature

    async def get_feature_by_node(self, node_id: str) -> Optional[NetworkFeature]:
        coll = self._get_features_collection()
        if coll is not None:
            try:
                doc = await coll.find_one({"nodeId": node_id}, {"_id": 0})
                if doc:
                    return NetworkFeature(**doc)
            except Exception as e:
                logger.warning(f"Mongo get_feature_by_node error ({e}), fallback to memory.")
                
        item = self._features_memory_store.get(node_id)
        if item:
            return NetworkFeature(**item)
        return None

    async def list_features(self) -> List[NetworkFeature]:
        coll = self._get_features_collection()
        if coll is not None:
            try:
                cursor = coll.find({}, {"_id": 0}).sort("communicationCount", -1)
                docs = await cursor.to_list(length=500)
                return [NetworkFeature(**doc) for doc in docs]
            except Exception as e:
                logger.warning(f"Mongo list_features error ({e}), fallback to memory.")
                
        docs = list(self._features_memory_store.values())
        return [NetworkFeature(**doc) for doc in docs]

    async def count_active_feature_nodes(self) -> int:
        coll = self._get_features_collection()
        if coll is not None:
            try:
                return await coll.count_documents({})
            except Exception:
                pass
        return len(self._features_memory_store)

edge_repository = EdgeRepository()
