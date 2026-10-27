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
    def collection(self):
        database = db.get_db()
        if database is not None:
            return database["blockchain"]
        return self._memory_coll

    def _hash_block(self, block: Dict[str, Any]) -> str:
        # Create a deterministic string representation of the block data
        block_string = json.dumps(block, sort_keys=True, default=str).encode()
        return hashlib.sha256(block_string).hexdigest()
        
    async def _get_latest_block(self) -> Optional[Dict[str, Any]]:
        coll = self.collection
        if coll is None: return None
        
        cursor = coll.find({}).sort("block_index", -1).limit(1)
        async for doc in cursor:
            return doc
        return None

    async def _create_genesis_block_if_needed(self):
        coll = self.collection
        if coll is None: return
        
        latest = await self._get_latest_block()
        if not latest:
            logger.info("Creating Genesis Block...")
            genesis_block = {
                "_id": 0,
                "block_index": 0,
                "previous_hash": self._genesis_hash,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "validator_node_id": "Controller-Genesis-Node",
                "nonce": 0,
                "merkle_root": self._genesis_hash,
                "transactions_count": 0,
                "transactions": []
            }
            genesis_block["block_hash"] = self._hash_block(genesis_block)
            await coll.insert_one(genesis_block)

    async def record_transaction(self, data: Dict[str, Any]) -> str:
        """
        Record a transaction to the blockchain. 
        Returns the transaction ID.
        Raises an Exception if the database is unavailable (which will trigger the AuditService retry logic).
        """
        coll = self.collection
        if coll is None:
            raise Exception("Database unavailable. Cannot write to blockchain ledger.")
            
        await self._create_genesis_block_if_needed()
        
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
            "timestamp": datetime.now(timezone.utc),
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
            # Just return a dummy ID for now since we can't block the loop. 
            # The callers of the sync version don't wait for the real ID anyway.
            return f"tx_sync_{uuid.uuid4().hex}"
        except RuntimeError:
            return asyncio.run(self.record_transaction(data))

blockchain_service = BlockchainService()
