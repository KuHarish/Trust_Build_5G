import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from pymongo import ASCENDING, DESCENDING

from app.database.client import db
from app.security.models.security_event import SecurityEvent
from app.blockchain.services.blockchain_service import blockchain_service

logger = logging.getLogger("trustchain.audit")

class MitigationAuditService:
    """
    Orchestrates the lifecycle of SecurityEvents, enforces idempotency,
    and reliably submits them to the Blockchain Service using a retry mechanism.
    """
    
    @property
    def collection(self):
        database = db.get_db()
        if database is not None:
            return database["audit_events"]
        return None

    async def log_security_event(self, event_data: Dict[str, Any]) -> Optional[SecurityEvent]:
        """
        Idempotent method to log a security event and queue it for blockchain submission.
        """
        coll = self.collection
        if coll is None:
            logger.error("Database unavailable. Cannot log security event.")
            return None
            
        event = SecurityEvent(**event_data)
        
        # Check idempotency
        existing = await coll.find_one({"eventId": event.eventId})
        if existing:
            logger.info(f"Event {event.eventId} already exists. Skipping duplicate.")
            return SecurityEvent(**existing)
            
        # Ensure timestamp is UTC datetime
        if isinstance(event.timestamp, str):
            event.timestamp = datetime.fromisoformat(event.timestamp.replace('Z', '+00:00'))
            
        # Insert initial record (Status: PENDING)
        await coll.insert_one(event.model_dump(mode="json"))
        
        # Fire and forget the blockchain submission task
        asyncio.create_task(self._submit_to_blockchain_with_retry(event.eventId))
        
        return event
        
    async def _submit_to_blockchain_with_retry(self, event_id: str):
        """
        Background task to submit an event to the blockchain with safe retries.
        """
        max_retries = 3
        retry_delay = 5 # seconds
        
        for attempt in range(1, max_retries + 1):
            try:
                coll = self.collection
                if coll is None: return
                
                event_dict = await coll.find_one({"eventId": event_id})
                if not event_dict: return
                
                # If already confirmed by another worker (not really possible in this simple architecture, but safe)
                if event_dict.get("auditStatus") == "CONFIRMED":
                    return
                
                # Prepare payload
                payload = {k: v for k, v in event_dict.items() if k != "_id"}
                
                # Call module 5
                tx_id = await blockchain_service.record_transaction(payload)
                
                # Success - Update audit state
                await coll.update_one(
                    {"eventId": event_id},
                    {"$set": {
                        "auditStatus": "CONFIRMED",
                        "blockchainTxId": tx_id
                    }}
                )
                logger.info(f"Audit event {event_id} CONFIRMED on blockchain (tx: {tx_id})")
                return
                
            except Exception as e:
                logger.warning(f"Blockchain submission attempt {attempt} failed for {event_id}: {e}")
                
                coll = self.collection
                if coll:
                    await coll.update_one(
                        {"eventId": event_id},
                        {"$inc": {"retryCount": 1}}
                    )
                
                if attempt < max_retries:
                    await asyncio.sleep(retry_delay)
                else:
                    # Final failure
                    if coll:
                        await coll.update_one(
                            {"eventId": event_id},
                            {"$set": {"auditStatus": "FAILED"}}
                        )
                    logger.error(f"Audit event {event_id} FAILED permanently after {max_retries} attempts.")
                    
    async def get_timeline_by_correlation(self, correlation_id: str) -> List[SecurityEvent]:
        coll = self.collection
        if coll is None: return []
        
        cursor = coll.find({"correlationId": correlation_id}).sort("timestamp", ASCENDING)
        events = []
        async for doc in cursor:
            events.append(SecurityEvent(**doc))
        return events
        
    async def get_node_history(self, node_id: str, limit: int = 50, skip: int = 0) -> List[SecurityEvent]:
        coll = self.collection
        if coll is None: return []
        
        cursor = coll.find({"nodeId": node_id}).sort("timestamp", DESCENDING).skip(skip).limit(limit)
        events = []
        async for doc in cursor:
            events.append(SecurityEvent(**doc))
        return events
        
    async def search_events(self, filters: Dict[str, Any], limit: int = 50) -> List[SecurityEvent]:
        coll = self.collection
        if coll is None: return []
        
        # Clean up empty filters
        query = {k: v for k, v in filters.items() if v}
        
        cursor = coll.find(query).sort("timestamp", DESCENDING).limit(limit)
        events = []
        async for doc in cursor:
            events.append(SecurityEvent(**doc))
        return events

audit_service = MitigationAuditService()
