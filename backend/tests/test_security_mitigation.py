import pytest
import asyncio
from datetime import datetime, timezone
from app.security.models.security_decision import SecurityDecision
from app.security.models.mitigation_action import MitigationAction
from app.security.services.mitigation_service import mitigation_service
from app.security.repositories.security_repository import security_repository
from app.security.services.executors.logical_executors import EXECUTOR_REGISTRY

@pytest.fixture(autouse=True)
async def clear_db():
    await security_repository.actions_collection.delete_many({})
    await security_repository.node_states_collection.delete_many({})
    await security_repository.decisions_collection.delete_many({})
    yield
    await security_repository.actions_collection.delete_many({})
    await security_repository.node_states_collection.delete_many({})
    await security_repository.decisions_collection.delete_many({})

@pytest.mark.asyncio
async def test_request_mitigation_idempotency():
    decision = SecurityDecision(
        nodeId="node-test-1",
        triggerEventId="evt-1",
        policyId="pol-1",
        evidence={},
        decision="BLOCK"
    )
    await security_repository.create_decision(decision)

    # First request
    action1 = await mitigation_service.request_mitigation(decision)
    assert action1.status == "PENDING"
    
    # Second request with same decision
    action2 = await mitigation_service.request_mitigation(decision)
    assert action1.actionId == action2.actionId

@pytest.mark.asyncio
async def test_execute_allow():
    action = MitigationAction(nodeId="n1", decisionId="d1", decision="ALLOW")
    await security_repository.create_action(action)
    await mitigation_service.execute_mitigation(action)
    
    updated = await security_repository.get_action(action.actionId)
    assert updated.status == "COMPLETED"
    assert updated.resultingState == "ACTIVE"

@pytest.mark.asyncio
async def test_execute_block():
    action = MitigationAction(nodeId="n1", decisionId="d1", decision="BLOCK")
    await security_repository.create_action(action)
    await mitigation_service.execute_mitigation(action)
    
    updated = await security_repository.get_action(action.actionId)
    assert updated.status == "COMPLETED"
    assert updated.resultingState == "BLOCKED"
    
    node_state = await security_repository.get_node_state("n1")
    assert node_state["currentState"] == "BLOCKED"

@pytest.mark.asyncio
async def test_prevent_double_block():
    # Set node to blocked
    await security_repository.update_node_state({"nodeId": "n1", "currentState": "BLOCKED"})
    
    action = MitigationAction(nodeId="n1", decisionId="d1", decision="BLOCK")
    await security_repository.create_action(action)
    
    # Execute block again
    await mitigation_service.execute_mitigation(action)
    
    updated = await security_repository.get_action(action.actionId)
    # The executor should return success=False, message="Node is already in BLOCKED state."
    # The service marks it as FAILED
    assert updated.status == "FAILED"
    assert "already in BLOCKED state" in updated.errorInformation

@pytest.mark.asyncio
async def test_rollback_quarantine():
    action = MitigationAction(nodeId="n1", decisionId="d1", decision="QUARANTINE", previousState="ACTIVE")
    await security_repository.create_action(action)
    
    # Execute it to complete it
    await mitigation_service.execute_mitigation(action)
    
    updated = await security_repository.get_action(action.actionId)
    assert updated.status == "COMPLETED"
    
    # Request rollback
    success = await mitigation_service.request_rollback(action.actionId)
    assert success is True
    
    rolled = await security_repository.get_action(action.actionId)
    assert rolled.status == "ROLLED_BACK"
    
    node_state = await security_repository.get_node_state("n1")
    assert node_state["currentState"] == "ACTIVE" # Back to previous

@pytest.mark.asyncio
async def test_invalid_action_type():
    action = MitigationAction(nodeId="n1", decisionId="d1", decision="BOGUS_ACTION")
    await security_repository.create_action(action)
    await mitigation_service.execute_mitigation(action)
    
    updated = await security_repository.get_action(action.actionId)
    assert updated.status == "FAILED"
    assert "Unsupported decision type" in updated.errorInformation

@pytest.mark.asyncio
async def test_cannot_rollback_pending_action():
    action = MitigationAction(nodeId="n1", decisionId="d1", decision="BLOCK", status="PENDING")
    await security_repository.create_action(action)
    
    with pytest.raises(ValueError, match="Cannot rollback action in state PENDING"):
        await mitigation_service.request_rollback(action.actionId)

# E2E Integration placeholder
@pytest.mark.asyncio
async def test_e2e_mitigation_flow():
    # 1. Create Decision
    decision = SecurityDecision(
        nodeId="node-e2e-1",
        triggerEventId="evt-e2e",
        policyId="pol-e2e",
        evidence={"ml_confidence": 0.95},
        decision="QUARANTINE"
    )
    await security_repository.create_decision(decision)
    
    # 2. Request Mitigation
    action = await mitigation_service.request_mitigation(decision)
    assert action.status == "PENDING"
    assert action.decision == "QUARANTINE"
    
    # 3. Execute
    await mitigation_service.execute_mitigation(action)
    
    # 4. Verify Action State
    updated_action = await security_repository.get_action(action.actionId)
    assert updated_action.status == "COMPLETED"
    assert updated_action.resultingState == "QUARANTINED"
    
    # 5. Verify Node State
    state = await security_repository.get_node_state("node-e2e-1")
    assert state["currentState"] == "QUARANTINED"
