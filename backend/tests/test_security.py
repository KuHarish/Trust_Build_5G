import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from app.security.models.security_decision import SecurityDecision
from app.security.repositories.security_repository import security_repository
from app.security.services.security_policy_service import security_policy_service
from app.security.services.security_controller import security_controller
from app.database.client import Database

@pytest.fixture(scope="module", autouse=True)
async def setup_database():
    await Database.connect_to_mongo()
    # Ensure policies are clean
    await security_repository.delete_all_policies()
    await security_policy_service.initialize_default_policies()
    yield
    await security_repository.delete_all_policies()
    await Database.close_mongo_connection()

@pytest.mark.asyncio
async def test_policy_initialization():
    policies = await security_repository.get_active_policies()
    assert len(policies) == 8 # We seeded 8 baseline cases

@pytest.mark.asyncio
async def test_case_a_benign():
    # BENIGN + TRUSTED -> ALLOW
    evidence = {
        "nodeId": "test-node",
        "mlPrediction": "BENIGN",
        "mlConfidence": 0.99,
        "trustLevel": "TRUSTED"
    }
    decision = await security_controller.evaluate_evidence(evidence)
    assert decision.decision == "ALLOW"
    assert decision.severity == "LOW"

@pytest.mark.asyncio
async def test_case_b_suspicious():
    # ATTACK with low confidence -> WARN
    evidence = {
        "nodeId": "test-node",
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.60,
        "trustLevel": "TRUSTED"
    }
    decision = await security_controller.evaluate_evidence(evidence)
    assert decision.decision == "WARN"
    assert decision.severity == "MEDIUM"

@pytest.mark.asyncio
async def test_case_c_high_conf_suspicious_trust():
    # ATTACK with high confidence + SUSPICIOUS trust -> QUARANTINE
    evidence = {
        "nodeId": "test-node",
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.95,
        "trustLevel": "SUSPICIOUS"
    }
    decision = await security_controller.evaluate_evidence(evidence)
    assert decision.decision == "QUARANTINE"
    assert decision.severity == "HIGH"

@pytest.mark.asyncio
async def test_case_d_high_conf_malicious_trust():
    # ATTACK with high confidence + MALICIOUS trust -> BLOCK
    evidence = {
        "nodeId": "test-node",
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.95,
        "trustLevel": "MALICIOUS"
    }
    decision = await security_controller.evaluate_evidence(evidence)
    assert decision.decision == "BLOCK"
    assert decision.severity == "CRITICAL"

@pytest.mark.asyncio
async def test_case_e_low_trust():
    # MALICIOUS trust + BENIGN ML -> WARN (Conflict)
    evidence = {
        "nodeId": "test-node",
        "mlPrediction": "BENIGN",
        "mlConfidence": 0.99,
        "trustLevel": "MALICIOUS"
    }
    decision = await security_controller.evaluate_evidence(evidence)
    assert decision.decision == "WARN"
    assert decision.severity == "MEDIUM"
    assert decision.explanation["conflicts"] == "Yes"

@pytest.mark.asyncio
async def test_case_f_missing_evidence():
    # Both MISSING -> MONITOR
    evidence = {
        "nodeId": "test-node"
    }
    decision = await security_controller.evaluate_evidence(evidence)
    assert decision.decision == "MONITOR"
    assert decision.severity == "LOW"
    assert decision.explanation["evidenceState"]["ml"] == "MISSING"

@pytest.mark.asyncio
async def test_stale_evidence():
    # Stale ML -> MONITOR (Fallback)
    old_time = (datetime.now(timezone.utc) - timedelta(seconds=60)).isoformat()
    evidence = {
        "nodeId": "test-node",
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.95,
        "trustLevel": "TRUSTED",
        "mlTimestamp": old_time
    }
    decision = await security_controller.evaluate_evidence(evidence)
    assert decision.decision == "MONITOR"
    assert decision.explanation["evidenceState"]["ml"] == "STALE"

@pytest.mark.asyncio
async def test_idempotency():
    # Same triggerEventId should return the exact same decision and not duplicate
    evidence = {
        "nodeId": "test-node-idem",
        "triggerEventId": "trigger-123",
        "mlPrediction": "BENIGN",
        "trustLevel": "TRUSTED"
    }
    dec1 = await security_controller.evaluate_evidence(evidence)
    dec2 = await security_controller.evaluate_evidence(evidence)
    
    assert dec1.decisionId == dec2.decisionId
