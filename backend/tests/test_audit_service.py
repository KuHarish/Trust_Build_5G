import pytest
import asyncio
from typing import Dict, Any

from app.security.services.audit_service import audit_service
from app.blockchain.services.blockchain_service import blockchain_service
from app.database.client import db

@pytest.fixture(autouse=True)
async def setup_and_teardown():
    # Setup
    coll = audit_service.collection
    if coll is not None:
        await coll.delete_many({})
    bc_coll = blockchain_service.collection
    if bc_coll is not None:
        await bc_coll.delete_many({})
        
    yield
    
    # Teardown
    coll = audit_service.collection
    if coll is not None:
        await coll.delete_many({})
    bc_coll = blockchain_service.collection
    if bc_coll is not None:
        await bc_coll.delete_many({})

@pytest.mark.asyncio
async def test_audit_service_log_and_confirm():
    event_data = {
        "eventId": "test_event_1",
        "eventType": "ATTACK_DETECTED",
        "correlationId": "corr_1",
        "sourceModule": "TestModule"
    }
    
    # Log event
    event = await audit_service.log_security_event(event_data)
    
    assert event is not None
    assert event.eventId == "test_event_1"
    
    # Wait for the background task to complete (blockchain submission)
    await asyncio.sleep(1.0)
    
    # Verify in DB
    coll = audit_service.collection
    saved = await coll.find_one({"eventId": "test_event_1"})
    
    assert saved is not None
    assert saved["auditStatus"] == "CONFIRMED"
    assert saved["blockchainTxId"] is not None

@pytest.mark.asyncio
async def test_audit_service_idempotency():
    event_data = {
        "eventId": "test_event_2",
        "eventType": "SECURITY_DECISION",
        "correlationId": "corr_2",
        "sourceModule": "TestModule"
    }
    
    # Log event twice
    event1 = await audit_service.log_security_event(event_data)
    event2 = await audit_service.log_security_event(event_data)
    
    assert event1 is not None
    assert event2 is not None
    assert event1.eventId == event2.eventId
    
    # Wait for background task
    await asyncio.sleep(1.0)
    
    # Verify only one event in DB
    coll = audit_service.collection
    count = await coll.count_documents({"eventId": "test_event_2"})
    assert count == 1
    
    # Verify only one transaction in blockchain
    bc_coll = blockchain_service.collection
    # Genesis block is _id: 0, first tx is in block 1
    bc_count = await bc_coll.count_documents({"block_index": {"$gt": 0}})
    assert bc_count == 1

@pytest.mark.asyncio
async def test_audit_service_timeline():
    # Log 3 events with same correlation ID
    events = [
        {"eventId": "evt_1", "eventType": "DECISION", "correlationId": "corr_3", "sourceModule": "Test", "timestamp": "2026-01-01T10:00:00Z"},
        {"eventId": "evt_2", "eventType": "ACTION", "correlationId": "corr_3", "sourceModule": "Test", "timestamp": "2026-01-01T10:00:01Z"},
        {"eventId": "evt_3", "eventType": "COMPLETED", "correlationId": "corr_3", "sourceModule": "Test", "timestamp": "2026-01-01T10:00:02Z"}
    ]
    
    for e in events:
        await audit_service.log_security_event(e)
        
    await asyncio.sleep(1.0)
    
    timeline = await audit_service.get_timeline_by_correlation("corr_3")
    
    assert len(timeline) == 3
    assert timeline[0].eventType == "DECISION"
    assert timeline[1].eventType == "ACTION"
    assert timeline[2].eventType == "COMPLETED"
