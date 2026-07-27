"""
TrustChain-5G Blockchain Collection Domain Model.

Defines immutable block schemas and cryptographic transaction structures for distributed trust and threat ledger storage.
"""

from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class TransactionModel(BaseModel):
    """
    Representation of an individual trust assertion or threat evidence record inside a blockchain block.
    """
    tx_id: str = Field(..., description="Unique hexadecimal SHA-256 transaction digest")
    sender_node_id: str = Field(..., description="ID of entity submitting trust affirmation or threat alert")
    target_node_id: str = Field(..., description="Subject node whose trust posture is being recorded")
    transaction_type: str = Field(default="TRUST_AFFIRMATION", description="Classification of ledger record (e.g. 'TRUST_AFFIRMATION', 'THREAT_EVIDENCE_ANCHOR')")
    payload_data: Dict[str, Any] = Field(default_factory=dict, description="Signed trust scores, model weights hash, or attack timestamps")
    signature: str = Field(..., description="ECDSA cryptographic signature proving authenticity")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of transaction creation")


class BlockchainBlockModel(BaseModel):
    """
    MongoDB schema representing immutable cryptographic blocks in the 'Blockchain' collection.
    """
    block_index: int = Field(..., alias="_id", description="Sequential block height number starting from 0 (Genesis Block)")
    block_hash: str = Field(..., description="SHA-256 hash digest of header, transactions, and proof")
    previous_hash: str = Field(..., description="SHA-256 hash digest of immediate parent block in chain")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Block sealing epoch time")
    validator_node_id: str = Field(default="Controller-Genesis-Node", description="Node responsible for consensus forging")
    nonce: int = Field(default=0, description="Proof-of-Authority or Proof-of-Trust computational verification scalar")
    merkle_root: str = Field(..., description="Cryptographic Merkle tree root hash of bundled transactions")
    transactions_count: int = Field(default=1, description="Total count of transactions included in this block")
    transactions: List[TransactionModel] = Field(default_factory=list, description="Array of embedded transaction objects")

    class Config:
        populate_by_name = True
        from_attributes = True
