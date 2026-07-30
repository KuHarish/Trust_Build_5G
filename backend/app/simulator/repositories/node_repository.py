"""
TrustChain-5G Network Node MongoDB CRUD Repository.
Persists simulated 5G entities in the 'nodes' collection using Motor asynchronous drivers,
with decoupled fallback storage support when running unit tests without an active Mongo server.
"""

import logging
import re
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from app.database.client import db
from app.simulator.models.node import SimulationNode

logger = logging.getLogger("trustchain.simulator.repository")


class NodeRepository:
    """
    CRUD architecture for managing node documents in the MongoDB 'nodes' collection.
    """
    def __init__(self):
        # Fallback memory store used during offline testing or when Mongo daemon is unreachable
        self._memory_store: Dict[str, Dict[str, Any]] = {}

    def _get_collection(self) -> Optional[AsyncIOMotorCollection]:
        database = db.get_db()
        if database is not None:
            return database.get_collection("nodes")
        return None

    async def create(self, node: SimulationNode) -> SimulationNode:
        """Persist a newly registered node into MongoDB."""
        node_dict = node.model_dump(by_alias=True)
        collection = self._get_collection()
        
        if collection is not None:
            try:
                # Check for duplicate node name in MongoDB
                existing = await collection.find_one({"nodeName": {"$regex": f"^{re.escape(node.nodeName)}$", "$options": "i"}})
                if existing:
                    raise ValueError("Duplicate Node Name: A node with this designation is already registered.")
                await collection.insert_one(node_dict)
                logger.info(f"Persisted node [{node.nodeName}] (ID: {node.id}) to MongoDB nodes collection.")
                return node
            except Exception as e:
                if isinstance(e, ValueError):
                    raise e
                logger.warning(f"MongoDB unavailable during create ({str(e)}). Storing node in fallback memory persistence.")

        # Fallback verification in memory store
        for item in self._memory_store.values():
            if item.get("nodeName", "").lower() == node.nodeName.lower():
                raise ValueError("Duplicate Node Name: A node with this designation is already registered.")
        
        self._memory_store[node.id] = node_dict
        logger.debug(f"Saved node [{node.nodeName}] into repository memory persistence.")
        return node

    async def get_all(self) -> List[SimulationNode]:
        """Retrieve all simulation nodes."""
        collection = self._get_collection()
        if collection is not None:
            try:
                cursor = collection.find({})
                docs = await cursor.to_list(length=2000)
                return [SimulationNode.model_validate(doc) for doc in docs]
            except Exception as e:
                logger.warning(f"MongoDB get_all failed ({str(e)}), reverting to memory store.")

        return [SimulationNode.model_validate(doc) for doc in self._memory_store.values()]

    async def get_by_id(self, node_id: str) -> Optional[SimulationNode]:
        """Retrieve a single node by its unique UUID."""
        collection = self._get_collection()
        if collection is not None:
            try:
                doc = await collection.find_one({"id": node_id})
                if not doc:
                    # Alternative search by MongoDB _id alias
                    doc = await collection.find_one({"_id": node_id})
                if doc:
                    return SimulationNode.model_validate(doc)
                return None
            except Exception as e:
                logger.warning(f"MongoDB get_by_id failed ({str(e)}), reverting to memory store.")

        doc = self._memory_store.get(node_id)
        if doc:
            return SimulationNode.model_validate(doc)
        return None

    async def update(self, node: SimulationNode) -> SimulationNode:
        """Update an existing node document."""
        node_dict = node.model_dump(by_alias=True)
        collection = self._get_collection()
        
        if collection is not None:
            try:
                # Verify name uniqueness if changed
                existing = await collection.find_one({"nodeName": {"$regex": f"^{re.escape(node.nodeName)}$", "$options": "i"}})
                if existing and existing.get("id") != node.id and existing.get("_id") != node.id:
                    raise ValueError("Duplicate Node Name: A node with this designation already exists.")
                
                await collection.replace_one({"id": node.id}, node_dict, upsert=True)
                return node
            except Exception as e:
                if isinstance(e, ValueError):
                    raise e
                logger.warning(f"MongoDB update failed ({str(e)}), using memory store.")

        for item_id, item in self._memory_store.items():
            if item_id != node.id and item.get("nodeName", "").lower() == node.nodeName.lower():
                raise ValueError("Duplicate Node Name: A node with this designation already exists.")

        self._memory_store[node.id] = node_dict
        return node

    async def delete(self, node_id: str) -> bool:
        """Remove a node from the registry."""
        collection = self._get_collection()
        deleted = False
        if collection is not None:
            try:
                res = await collection.delete_one({"id": node_id})
                if res.deleted_count == 0:
                    res = await collection.delete_one({"_id": node_id})
                if res.deleted_count > 0:
                    deleted = True
            except Exception as e:
                logger.warning(f"MongoDB delete failed ({str(e)}), using memory store.")

        if node_id in self._memory_store:
            del self._memory_store[node_id]
            deleted = True
        return deleted

    async def count(self) -> int:
        """Count total registered simulation nodes."""
        collection = self._get_collection()
        if collection is not None:
            try:
                return await collection.count_documents({})
            except Exception as e:
                logger.warning(f"MongoDB count failed ({str(e)}), using memory store count.")
        return len(self._memory_store)

    async def initialize_default_nodes_if_empty(self) -> None:
        """Populate initial realistic simulation nodes if registry is totally empty."""
        total = await self.count()
        if total == 0:
            logger.info("Nodes collection empty. Populating default 3GPP & IoT virtual entities for Sprint 1.1 simulation...")
            defaults = [
                SimulationNode(
                    nodeName="GNB-North-Sector",
                    nodeType="Gateway",
                    deviceCategory="5G gNodeB Base Station",
                    status="ONLINE",
                    ipAddress="10.50.1.100",
                    macAddress="00:1A:2B:3C:4D:5E",
                    latitude=35.6895,
                    longitude=139.6917,
                    signalStrength=-45.2,
                    bandwidth=5000.0,
                    latency=1.2,
                    batteryLevel=100.0,
                    firmwareVersion="v2.4.0-gnb",
                    connections=42
                ),
                SimulationNode(
                    nodeName="Edge-AI-MEC-Gateway",
                    nodeType="Edge Device",
                    deviceCategory="Multi-Access Edge Server",
                    status="ONLINE",
                    ipAddress="10.50.2.10",
                    macAddress="A4:5E:60:E2:21:40",
                    latitude=35.6950,
                    longitude=139.7000,
                    signalStrength=-52.8,
                    bandwidth=2500.0,
                    latency=2.8,
                    batteryLevel=98.5,
                    firmwareVersion="v1.8.2-mec",
                    connections=18
                ),
                SimulationNode(
                    nodeName="Autonomous-Vehicle-Relay",
                    nodeType="Autonomous Vehicle",
                    deviceCategory="V2X Mobile Telemetry Unit",
                    status="BUSY",
                    ipAddress="10.50.15.84",
                    macAddress="CC:22:3F:8A:99:11",
                    latitude=35.6780,
                    longitude=139.6820,
                    signalStrength=-78.4,
                    bandwidth=450.0,
                    latency=11.4,
                    batteryLevel=84.2,
                    firmwareVersion="v3.1.0-v2x",
                    connections=5
                ),
                SimulationNode(
                    nodeName="Smart-Hospital-IoMT-01",
                    nodeType="Medical Device",
                    deviceCategory="Hospital Critical Patient Monitor",
                    status="ONLINE",
                    ipAddress="10.50.20.15",
                    macAddress="EA:F1:02:44:88:99",
                    latitude=35.7012,
                    longitude=139.7105,
                    signalStrength=-58.1,
                    bandwidth=100.0,
                    latency=3.5,
                    batteryLevel=95.0,
                    firmwareVersion="v1.0.4-iomt",
                    connections=2
                ),
                SimulationNode(
                    nodeName="Industrial-Robot-Arm-07",
                    nodeType="Industrial Device",
                    deviceCategory="Automated Smart Factory Actuator",
                    status="SLEEPING",
                    ipAddress="10.50.30.5",
                    macAddress="7C:8A:2B:99:00:12",
                    latitude=35.6600,
                    longitude=139.6500,
                    signalStrength=-82.0,
                    bandwidth=200.0,
                    latency=8.2,
                    batteryLevel=72.0,
                    firmwareVersion="v4.0.1-ind",
                    connections=1
                ),
                SimulationNode(
                    nodeName="Aerial-Surveillance-Drone-03",
                    nodeType="Drone",
                    deviceCategory="High-Altitude Relay UAV",
                    status="MAINTENANCE",
                    ipAddress="10.50.40.19",
                    macAddress="B2:5A:6D:3F:7A:8C",
                    latitude=35.7200,
                    longitude=139.7500,
                    signalStrength=-95.5,
                    bandwidth=300.0,
                    latency=15.0,
                    batteryLevel=42.5,
                    firmwareVersion="v1.2.0-uav",
                    connections=0
                )
            ]
            for d in defaults:
                await self.create(d)


node_repository = NodeRepository()
