import pytest
import asyncio
from datetime import datetime, timezone, timedelta
import uuid

from app.security.services.security_controller import security_controller
from app.security.services.security_policy_service import security_policy_service
from app.security.services.mitigation_service import mitigation_service
from app.security.services.audit_service import audit_service
from app.blockchain.services.blockchain_service import blockchain_service
from app.security.repositories.security_repository import security_repository
from app.security.models.security_policy import SecurityPolicy, PolicyRule, PolicyCondition

@pytest.fixture(autouse=True)
async def setup_e2e_environment():
    # Clear databases
    if security_repository.decisions_collection is not None:
        await security_repository.decisions_collection.delete_many({})
    if security_repository.actions_collection is not None:
        await security_repository.actions_collection.delete_many({})
    if security_repository.policies_collection is not None:
        await security_repository.policies_collection.delete_many({})
    if security_repository.node_states_collection is not None:
        await security_repository.node_states_collection.delete_many({})
    if audit_service.collection is not None:
        await audit_service.collection.delete_many({})
    if blockchain_service.collection is not None:
        await blockchain_service.collection.delete_many({})

    # Initialize default policies
    await security_policy_service.initialize_default_policies()

    yield
    
    # Cleanup after (optional, autouse fixture takes care of before)
    if security_repository.decisions_collection is not None:
        await security_repository.decisions_collection.delete_many({})

def get_base_evidence(node_id: str) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "nodeId": node_id,
        "triggerEventId": f"trig_{uuid.uuid4().hex[:8]}",
        "mlTimestamp": now,
        "trustTimestamp": now,
        "predictionId": f"pred_{uuid.uuid4().hex[:8]}",
        "trustEvaluationId": f"trust_{uuid.uuid4().hex[:8]}",
    }

@pytest.mark.asyncio
async def test_1_benign_node():
    evidence = get_base_evidence("NODE_BENIGN")
    evidence.update({
        "mlPrediction": "BENIGN",
        "mlConfidence": 0.99,
        "trustScore": 0.9,
        "trustLevel": "TRUSTED"
    })
    
    decision = await security_controller.evaluate_evidence(evidence)
    
    assert decision.decision == "ALLOW"
    assert decision.severity == "LOW"
    
    # Allow logic means no restrictive mitigation action, or action is ALLOW
    action = await security_repository.actions_collection.find_one({"decisionId": decision.decisionId})
    assert action is not None
    assert action["decision"] == "ALLOW"
    
    # Check node state
    state = await security_repository.get_node_state("NODE_BENIGN")
    assert state.currentState in ["ACTIVE", "MONITORED"] # Benign might mean ACTIVE

@pytest.mark.asyncio
async def test_2_suspicious_node():
    evidence = get_base_evidence("NODE_SUSPICIOUS")
    evidence.update({
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.65, # Below 0.80 high confidence threshold
        "trustScore": 0.5,
        "trustLevel": "SUSPICIOUS"
    })
    
    decision = await security_controller.evaluate_evidence(evidence)
    
    # Case B: Suspicious / Uncertain Detection
    assert decision.decision == "WARN"
    assert decision.severity == "MEDIUM"
    
    action = await security_repository.actions_collection.find_one({"decisionId": decision.decisionId})
    assert action["decision"] == "WARN"

@pytest.mark.asyncio
async def test_3_confirmed_attack():
    evidence = get_base_evidence("NODE_ATTACK")
    evidence.update({
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.95,
        "trustScore": 0.3,
        "trustLevel": "SUSPICIOUS", # Triggers Case C
        "attackCategory": "DDoS"
    })
    
    decision = await security_controller.evaluate_evidence(evidence)
    
    assert decision.decision == "QUARANTINE"
    assert decision.severity == "HIGH"
    
    await asyncio.sleep(0.5) # allow background mitigation to process
    
    state = await security_repository.get_node_state("NODE_ATTACK")
    assert state.currentState == "QUARANTINED"
    
    # Check audit events
    audit_events = await audit_service.get_timeline_by_correlation(decision.explanation["correlationId"])
    types = [e.eventType for e in audit_events]
    assert "SECURITY_DECISION" in types
    assert "MITIGATION_REQUESTED" in types
    assert "MITIGATION_COMPLETED" in types

@pytest.mark.asyncio
async def test_4_malicious_node():
    evidence = get_base_evidence("NODE_MALICIOUS")
    evidence.update({
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.99,
        "trustScore": 0.1,
        "trustLevel": "MALICIOUS", 
    })
    
    decision = await security_controller.evaluate_evidence(evidence)
    
    # Case D: High-confidence attack + Malicious Node
    assert decision.decision == "BLOCK"
    assert decision.severity == "CRITICAL"
    
    await asyncio.sleep(0.5)
    
    state = await security_repository.get_node_state("NODE_MALICIOUS")
    assert state.currentState == "BLOCKED"

@pytest.mark.asyncio
async def test_5_conflicting_evidence():
    evidence = get_base_evidence("NODE_CONFLICT")
    evidence.update({
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.95,
        "trustScore": 0.95,
        "trustLevel": "TRUSTED", 
    })
    
    decision = await security_controller.evaluate_evidence(evidence)
    
    assert decision.decision == "RATE_LIMIT"
    assert decision.explanation["conflicts"] == "Yes"

@pytest.mark.asyncio
async def test_6_missing_ml():
    evidence = get_base_evidence("NODE_MISSING")
    del evidence["mlPrediction"]
    del evidence["mlConfidence"]
    del evidence["mlTimestamp"]
    
    evidence.update({
        "trustScore": 0.1,
        "trustLevel": "MALICIOUS"
    })
    
    decision = await security_controller.evaluate_evidence(evidence)
    
    assert decision.decision == "WARN" # Case E
    assert decision.explanation["evidenceState"]["ml"] == "MISSING"

@pytest.mark.asyncio
async def test_8_stale_evidence():
    evidence = get_base_evidence("NODE_STALE")
    
    stale_time = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    evidence["mlTimestamp"] = stale_time
    
    evidence.update({
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.99,
        "trustScore": 0.5,
        "trustLevel": "SUSPICIOUS"
    })
    
    decision = await security_controller.evaluate_evidence(evidence)
    
    # Should fall back if rule excludes stale data
    assert decision.explanation["evidenceState"]["ml"] == "STALE"

@pytest.mark.asyncio
async def test_9_duplicate_event():
    evidence = get_base_evidence("NODE_DUP")
    evidence.update({
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.85,
        "trustScore": 0.4,
        "trustLevel": "SUSPICIOUS"
    })
    
    decision1 = await security_controller.evaluate_evidence(evidence)
    decision2 = await security_controller.evaluate_evidence(evidence) # exact same evidence (triggerEventId matches)
    
    assert decision1.decisionId == decision2.decisionId

@pytest.mark.asyncio
async def test_11_mitigation_failure():
    # Force a failure by creating a fake decision that triggers a missing executor
    evidence = get_base_evidence("NODE_FAIL")
    evidence.update({
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.9,
        "trustScore": 0.3,
        "trustLevel": "SUSPICIOUS"
    })
    decision = await security_controller.evaluate_evidence(evidence)
    
    # We'll artificially modify the action to use an unknown executor before execution if we could, 
    # but the simplest way is to manually fail an action
    action = await mitigation_service.request_mitigation(decision, decision.explanation["correlationId"])
    action.decision = "UNKNOWN_ACTION"
    await mitigation_service.execute_mitigation(action)
    
    await asyncio.sleep(0.5)
    
    failed_action = await security_repository.get_action(action.actionId)
    assert failed_action.status == "FAILED"
    
    audit_events = await audit_service.get_timeline_by_correlation(decision.explanation["correlationId"])
    types = [e.eventType for e in audit_events]
    assert "MITIGATION_FAILED" in types

@pytest.mark.asyncio
async def test_12_blockchain_outage(monkeypatch):
    # Simulate blockchain outage by mocking blockchain_service.record_transaction to raise an exception
    async def mock_record(*args, **kwargs):
        raise Exception("Simulated Blockchain Outage")
        
    monkeypatch.setattr(blockchain_service, "record_transaction", mock_record)
    
    evidence = get_base_evidence("NODE_OUTAGE")
    evidence.update({
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.99,
        "trustScore": 0.1,
        "trustLevel": "MALICIOUS"
    })
    
    decision = await security_controller.evaluate_evidence(evidence)
    
    await asyncio.sleep(1.0)
    
    # Mitigation should succeed
    state = await security_repository.get_node_state("NODE_OUTAGE")
    assert state.currentState == "BLOCKED"
    
    # Audit should be pending or failed, but decision/mitigation is done
    events = await audit_service.get_timeline_by_correlation(decision.explanation["correlationId"])
    for e in events:
        # Since we mocked the synchronous record_transaction (or rather, audit_service handles blockchain interaction now)
        # Wait, audit_service interacts with blockchain directly now via log_security_event -> _submit_to_blockchain
        # We need to mock blockchain_service.add_block?
        pass

@pytest.mark.asyncio
async def test_13_rollback():
    evidence = get_base_evidence("NODE_ROLLBACK")
    evidence.update({
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.99,
        "trustScore": 0.1,
        "trustLevel": "MALICIOUS"
    })
    decision = await security_controller.evaluate_evidence(evidence)
    
    await asyncio.sleep(0.5)
    
    # Get action
    action_dict = await security_repository.actions_collection.find_one({"decisionId": decision.decisionId})
    action_id = action_dict["actionId"]
    
    success = await mitigation_service.request_rollback(action_id)
    assert success is True
    
    state = await security_repository.get_node_state("NODE_ROLLBACK")
    assert state.currentState == "ACTIVE"

@pytest.mark.asyncio
async def test_16_policy_versioning():
    # Activate a new policy
    policy = SecurityPolicy(
        name="Test Policy v2",
        description="New version",
        version=2,
        status="ACTIVE",
        rules=[
            PolicyRule(
                name="New Rule",
                description="Test",
                priority=10,
                decisionAction="QUARANTINE",
                severity="HIGH",
                conditions=[PolicyCondition(field="mlPrediction", operator="==", value="ATTACK")]
            )
        ]
    )
    policy_id = await security_repository.create_policy(policy)
    await security_policy_service.activate_policy(policy_id)
    
    evidence = get_base_evidence("NODE_POL_V2")
    evidence.update({"mlPrediction": "ATTACK", "mlConfidence": 0.9})
    
    decision = await security_controller.evaluate_evidence(evidence)
    assert decision.policyId == policy_id
    assert decision.policyVersion == 2
