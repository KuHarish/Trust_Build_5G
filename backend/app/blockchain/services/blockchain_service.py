import logging
import uuid
import hashlib
import json
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from app.database.client import db
from app.models.blockchain import BlockchainBlockModel, TransactionModel

logger = logging.getLogger("trustchain.blockchain")

class BlockchainService:
    """
    Simulated Blockchain Service.
    Computes cryptographic SHA-256 hashes and persists blocks to the MongoDB ledger.
    """
    def __init__(self):
        self._genesis_hash = "0000000000000000000000000000000000000000000000000000000000000000"
        
    @property
    def collection(self):
        database = db.get_db()
        if database is not None:
            return database["blockchain"]
        return None

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
                "timestamp": datetime.now(timezone.utc),
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
