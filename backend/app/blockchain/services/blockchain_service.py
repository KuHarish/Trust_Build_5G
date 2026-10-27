import logging
import uuid
import hashlib
import json
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta

from app.database.client import db
from app.models.blockchain import BlockchainBlockModel, TransactionModel

logger = logging.getLogger("trustchain.blockchain")

class _InMemoryBlockchainCursor:
    def __init__(self, docs: list, filter_dict: dict):
        self._docs = list(docs)
        self._filter = filter_dict
        self._sort_field = None
        self._sort_direction = 1
        self._skip = 0
        self._limit = None

    def sort(self, field: str, direction: int = 1):
        self._sort_field = field
        self._sort_direction = direction
        return self

    def skip(self, n: int):
        self._skip = n
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def _matches(self, doc: dict) -> bool:
        for k, v in self._filter.items():
            if k == "transactions.transaction_type":
                txs = doc.get("transactions", [])
                if not any(tx.get("transaction_type") == v for tx in txs):
                    return False
            elif doc.get(k) != v:
                return False
        return True

    def __aiter__(self):
        filtered = [d for d in self._docs if self._matches(d)]
        if self._sort_field:
            filtered = sorted(filtered, key=lambda x: x.get(self._sort_field, 0), reverse=(self._sort_direction == -1))
        if self._skip:
            filtered = filtered[self._skip:]
        if self._limit is not None:
            filtered = filtered[:self._limit]
        self._iter = iter(filtered)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


class _InMemoryBlockchainCollection:
    def __init__(self):
        self._store: Dict[Any, Dict[str, Any]] = {}

    def find(self, filter_dict=None):
        return _InMemoryBlockchainCursor(list(self._store.values()), filter_dict or {})

    async def insert_one(self, doc: Dict[str, Any]):
        doc_id = doc.get("_id", len(self._store))
        self._store[doc_id] = doc.copy()

    async def count_documents(self, filter_dict=None):
        if not filter_dict:
            return len(self._store)
        cursor = self.find(filter_dict)
        count = 0
        async for _ in cursor:
            count += 1
        return count


class BlockchainService:
    """
    Simulated Blockchain Service.
    Computes cryptographic SHA-256 hashes and persists blocks to the MongoDB ledger or in-memory fallback.
    """
    def __init__(self):
        self._genesis_hash = "0000000000000000000000000000000000000000000000000000000000000000"
        self._memory_coll = _InMemoryBlockchainCollection()
        self._seed_memory_chain()

    def _seed_memory_chain(self):
        """Seed initial cryptographically valid blocks into memory storage."""
        now = datetime.now(timezone.utc)
        genesis_block = {
            "_id": 0,
            "block_index": 0,
            "previous_hash": self._genesis_hash,
            "timestamp": (now - timedelta(seconds=600)).isoformat(),
            "validator_node_id": "Controller-Genesis-Node",
            "nonce": 0,
            "merkle_root": self._genesis_hash,
            "transactions_count": 0,
            "transactions": []
        }
        genesis_block["block_hash"] = self._hash_block(genesis_block)
        self._memory_coll._store[0] = genesis_block

        mock_events = [
            ("Edge-Gateway-04", "POLICY_ENFORCEMENT", {"policy": "Quarantine-VLAN-4094", "rule": "SURGE_THRESHOLD"}, 480),
            ("IoT-Sensor-001", "TRUST_EVALUATION", {"trustScore": 96.8, "status": "VERIFIED"}, 360),
            ("IoT-Sensor-008", "ANOMALY_MITIGATION", {"action": "RATE_LIMIT", "limit": "64kbps"}, 240),
            ("Aggregation-Router-01", "FEDERATED_MODEL_SYNC", {"round": 42, "accuracy": 0.982}, 120),
            ("Core-Server-01", "SECURITY_EVENT", {"event": "mTLS_ATTESTATION", "status": "SUCCESS"}, 30),
        ]

        prev_hash = genesis_block["block_hash"]
        for idx, (target_node, tx_type, payload, sec_ago) in enumerate(mock_events, start=1):
            tx_id = f"tx_seed_{idx:03d}"
            tx = {
                "tx_id": tx_id,
                "sender_node_id": "Controller-Module-6",
                "target_node_id": target_node,
                "transaction_type": tx_type,
                "payload_data": payload,
                "timestamp": (now - timedelta(seconds=sec_ago)).isoformat(),
                "signature": f"sim_sig_{hashlib.sha256(tx_id.encode()).hexdigest()[:16]}"
            }
            merkle_root = hashlib.sha256(tx_id.encode()).hexdigest()
            b = {
                "_id": idx,
                "block_index": idx,
                "previous_hash": prev_hash,
                "timestamp": (now - timedelta(seconds=sec_ago)).isoformat(),
                "validator_node_id": "Controller-Node-01",
                "nonce": idx * 10,
                "merkle_root": merkle_root,
                "transactions_count": 1,
                "transactions": [tx]
            }
            b_hash = self._hash_block(b)
            b["block_hash"] = b_hash
            self._memory_coll._store[idx] = b
            prev_hash = b_hash

    @property
    def chain(self):
        """Provide chain list for backwards compatibility."""
        return list(self._memory_coll._store.values())

    @property
    def collection(self):
        database = db.get_db()
        if database is not None:
            return database["blockchain"]
        return self._memory_coll

    def _hash_block(self, block: Dict[str, Any]) -> str:
        # Create a deterministic string representation of the block data
        block_string = json.dumps(block, sort_keys=True, default=str).encode()
        return hashlib.sha256(block_string).hexdigest()

    def compute_block_hash(self, block: Dict[str, Any]) -> str:
        """Helper to recompute hash cleanly for verification."""
        block_copy = {k: v for k, v in block.items() if k != "block_hash"}
        if "_id" in block_copy and isinstance(block_copy["_id"], str) and block_copy["_id"].isdigit():
            block_copy["_id"] = int(block_copy["_id"])
        return self._hash_block(block_copy)
        
    async def _get_latest_block(self) -> Optional[Dict[str, Any]]:
        coll = self.collection
        if coll is None: return None
        
        cursor = coll.find({}).sort("block_index", -1).limit(1)
        async for doc in cursor:
            return doc
        return None

    async def _ensure_seeded(self):
        """Ensure initial cryptographically valid blocks exist in the active collection."""
        coll = self.collection
        if coll is None:
            return
            
        count = await coll.count_documents({})
        if count > 0:
            return

        logger.info("[BLOCKCHAIN] Seeding initial cryptographic audit ledger...")
        now = datetime.now(timezone.utc)
        genesis_block = {
            "_id": 0,
            "block_index": 0,
            "previous_hash": self._genesis_hash,
            "timestamp": (now - timedelta(seconds=600)).isoformat(),
            "validator_node_id": "Controller-Genesis-Node",
            "nonce": 0,
            "merkle_root": self._genesis_hash,
            "transactions_count": 0,
            "transactions": []
        }
        genesis_block["block_hash"] = self._hash_block(genesis_block)
        await coll.insert_one(genesis_block)

        mock_events = [
            ("Edge-Gateway-04", "POLICY_ENFORCEMENT", {"policy": "Quarantine-VLAN-4094", "rule": "SURGE_THRESHOLD"}, 480),
            ("IoT-Sensor-001", "TRUST_EVALUATION", {"trustScore": 96.8, "status": "VERIFIED"}, 360),
            ("IoT-Sensor-008", "ANOMALY_MITIGATION", {"action": "RATE_LIMIT", "limit": "64kbps"}, 240),
            ("Aggregation-Router-01", "FEDERATED_MODEL_SYNC", {"round": 42, "accuracy": 0.982}, 120),
            ("Core-Server-01", "SECURITY_EVENT", {"event": "mTLS_ATTESTATION", "status": "SUCCESS"}, 30),
        ]

        prev_hash = genesis_block["block_hash"]
        for idx, (target_node, tx_type, payload, sec_ago) in enumerate(mock_events, start=1):
            tx_id = f"tx_seed_{idx:03d}"
            tx = {
                "tx_id": tx_id,
                "sender_node_id": "Controller-Module-6",
                "target_node_id": target_node,
                "transaction_type": tx_type,
                "payload_data": payload,
                "timestamp": (now - timedelta(seconds=sec_ago)).isoformat(),
                "signature": f"sim_sig_{hashlib.sha256(tx_id.encode()).hexdigest()[:16]}"
            }
            merkle_root = hashlib.sha256(tx_id.encode()).hexdigest()
            b = {
                "_id": idx,
                "block_index": idx,
                "previous_hash": prev_hash,
                "timestamp": (now - timedelta(seconds=sec_ago)).isoformat(),
                "validator_node_id": f"Controller-Node-0{((idx - 1) % 3) + 1}",
                "nonce": idx * 10,
                "merkle_root": merkle_root,
                "transactions_count": 1,
                "transactions": [tx]
            }
            b_hash = self._hash_block(b)
            b["block_hash"] = b_hash
            await coll.insert_one(b)
            prev_hash = b_hash

        logger.info(f"[BLOCKCHAIN] Successfully seeded ledger with {len(mock_events) + 1} blocks.")

    async def _create_genesis_block_if_needed(self):
        await self._ensure_seeded()

    async def generate_simulated_block(self, custom_event: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Mine a new cryptographic block and append to chain."""
        await self._ensure_seeded()
        coll = self.collection
        if coll is None:
            raise Exception("Blockchain ledger unavailable.")
            
        latest = await self._get_latest_block()
        prev_hash = latest["block_hash"] if latest else self._genesis_hash
        next_index = (latest["block_index"] + 1) if latest else 1
        
        now = datetime.now(timezone.utc)
        
        event_types = [
            ("Edge-Gateway-04", "POLICY_ENFORCEMENT", {"policy": "Bandwidth-Quota-Updated", "quota": "100Mbps", "enforcedBy": "SDN-PolicyEngine"}),
            ("IoT-Sensor-003", "TRUST_EVALUATION", {"trustScore": 94.5, "delta": "+2.1", "model": "BayesianDynamicTrust"}),
            ("IoT-Sensor-008", "ANOMALY_MITIGATION", {"action": "ACL_ISOLATION", "vlan": 4094, "duration": "300s"}),
            ("Aggregation-Router-01", "FEDERATED_MODEL_SYNC", {"round": next_index + 10, "aggregation": "FedAvg", "weightsHash": hashlib.sha256(str(next_index).encode()).hexdigest()[:16]}),
            ("Core-Server-01", "SECURITY_EVENT", {"event": "CERT_RENEWAL", "protocol": "X.509-5G-Core", "status": "VALID"}),
            ("Edge-Node-02", "ATTACK_DETECTED", {"attackType": "DDoS-SYN-Flood", "confidence": 0.96, "signature": "SIG-SYN-SURGE"}),
            ("Radio-Unit-05", "SECURITY_DECISION", {"decision": "GRANT_ACCESS", "sliceId": "URLLC-Slice-01"}),
        ]
        
        if custom_event:
            target_node = custom_event.get("nodeId", "Edge-Node-01")
            tx_type = custom_event.get("eventType", "SECURITY_EVENT")
            payload = custom_event.get("payload", custom_event)
        else:
            import random
            target_node, tx_type, payload = random.choice(event_types)
            
        tx_id = f"tx_{uuid.uuid4().hex[:12]}"
        tx = {
            "tx_id": tx_id,
            "sender_node_id": "Controller-Module-6",
            "target_node_id": target_node,
            "transaction_type": tx_type,
            "payload_data": payload,
            "timestamp": now.isoformat(),
            "signature": f"sim_sig_{hashlib.sha256(tx_id.encode()).hexdigest()[:16]}"
        }
        
        merkle_root = hashlib.sha256(tx_id.encode()).hexdigest()
        block_dict = {
            "_id": next_index,
            "block_index": next_index,
            "previous_hash": prev_hash,
            "timestamp": now.isoformat(),
            "validator_node_id": f"Validator-Node-{(next_index % 3) + 1:02d}",
            "nonce": (next_index * 137) % 10000 + 42,
            "merkle_root": merkle_root,
            "transactions_count": 1,
            "transactions": [tx]
        }
        block_dict["block_hash"] = self._hash_block(block_dict)
        
        await coll.insert_one(block_dict)
        logger.info(f"[BLOCKCHAIN] Mined block #{next_index} with hash {block_dict['block_hash'][:16]}...")
        return block_dict

    async def record_transaction(self, data: Dict[str, Any]) -> str:
        """
        Record a transaction to the blockchain. 
        Returns the transaction ID.
        Raises an Exception if the database is unavailable (which will trigger the AuditService retry logic).
        """
        coll = self.collection
        if coll is None:
            raise Exception("Database unavailable. Cannot write to blockchain ledger.")
            
        await self._ensure_seeded()
        
        tx_id = f"tx_{uuid.uuid4().hex}"
        
        # Create Transaction
        tx = TransactionModel(
            tx_id=tx_id,
            sender_node_id="Controller-Module-6",
            target_node_id=data.get("nodeId", "UNKNOWN"),
            transaction_type=data.get("eventType", "SECURITY_EVENT"),
            payload_data=data,
            signature="simulated_ecdsa_signature_mock"
        )
        
        # Get previous block
        latest = await self._get_latest_block()
        prev_hash = latest["block_hash"] if latest else self._genesis_hash
        next_index = latest["block_index"] + 1 if latest else 1
        
        # We'll use the tx_id as a mock merkle root since there's only 1 tx
        merkle_root = hashlib.sha256(tx_id.encode()).hexdigest()
        
        block_dict = {
            "_id": next_index,
            "block_index": next_index,
            "previous_hash": prev_hash,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "validator_node_id": "Controller-Node",
            "nonce": 1,
            "merkle_root": merkle_root,
            "transactions_count": 1,
            "transactions": [tx.model_dump(mode="json")]
        }
        
        block_hash = self._hash_block(block_dict)
        block_dict["block_hash"] = block_hash
        
        await coll.insert_one(block_dict)
        
        logger.info(f"[BLOCKCHAIN AUDIT] Recorded block {next_index} with tx {tx_id}: {data.get('eventType')} for node {data.get('nodeId')}")
        
        return tx_id

    # Fallback sync method for backwards compatibility with places that haven't been migrated to async yet
    def record_transaction_sync(self, data: Dict[str, Any]) -> str:
        import asyncio
        try:
            loop = asyncio.get_running_loop()
            task = loop.create_task(self.record_transaction(data))
            return f"tx_sync_{uuid.uuid4().hex}"
        except RuntimeError:
            return asyncio.run(self.record_transaction(data))

blockchain_service = BlockchainService()
