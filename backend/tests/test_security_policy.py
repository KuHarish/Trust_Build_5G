import pytest
from typing import Dict, Any

from app.security.models.security_policy import SecurityPolicy, PolicyRule, PolicyCondition
from app.security.services.policy_validator import policy_validator
from app.security.services.security_policy_service import security_policy_service
from app.security.repositories.security_repository import security_repository
from app.security.services.security_controller import security_controller

@pytest.fixture
def base_policy():
    return SecurityPolicy(
        name="Test Policy",
        description="Testing policy",
        version=1,
        status="DRAFT",
        rules=[
            PolicyRule(
                name="Rule 1",
                description="Test Rule 1",
                priority=10,
                decisionAction="BLOCK",
                severity="CRITICAL",
                conditions=[
                    PolicyCondition(field="mlPrediction", operator="==", value="ATTACK"),
                    PolicyCondition(field="mlConfidence", operator=">=", value=0.90)
                ]
            )
        ]
    )

def test_policy_validator_valid(base_policy):
    result = policy_validator.validate(base_policy)
    assert result["valid"] is True
    assert len(result["errors"]) == 0

def test_policy_validator_invalid_thresholds(base_policy):
    base_policy.thresholds.mlHighConfidence = 1.5 # Invalid
    result = policy_validator.validate(base_policy)
    assert result["valid"] is False
    assert any(e["field"] == "thresholds.mlHighConfidence" for e in result["errors"])

def test_policy_validator_invalid_action(base_policy):
    base_policy.rules[0].decisionAction = "DESTROY" # Invalid
    result = policy_validator.validate(base_policy)
    assert result["valid"] is False
    assert any("decisionAction" in e["field"] for e in result["errors"])

def test_policy_validator_contradiction(base_policy):
    # Add a rule with identical conditions but different action
    base_policy.rules.append(
        PolicyRule(
            name="Rule 2",
            description="Contradictory Rule",
            priority=20,
            decisionAction="ALLOW",
            conditions=[
                PolicyCondition(field="mlPrediction", operator="==", value="ATTACK"),
                PolicyCondition(field="mlConfidence", operator=">=", value=0.90)
            ]
        )
    )
    result = policy_validator.validate(base_policy)
    assert result["valid"] is False
    assert any("Contradictory rules detected" in e["message"] for e in result["errors"])

@pytest.mark.asyncio
async def test_policy_service_evaluate_match(base_policy):
    await security_repository.delete_all_policies()
    base_policy.status = "ACTIVE"
    await security_repository.save_policy(base_policy)
    
    evidence = {
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.95
    }
    
    rule, policy = await security_policy_service.evaluate(evidence)
    
    assert policy is not None
    assert rule is not None
    assert rule.name == "Rule 1"
    assert rule.decisionAction == "BLOCK"

@pytest.mark.asyncio
async def test_policy_service_evaluate_no_match(base_policy):
    await security_repository.delete_all_policies()
    base_policy.status = "ACTIVE"
    await security_repository.save_policy(base_policy)
    
    evidence = {
        "mlPrediction": "BENIGN",
        "mlConfidence": 0.50
    }
    
    rule, policy = await security_policy_service.evaluate(evidence)
    
    assert policy is not None # We still return the active policy
    assert rule is None # But no rule matched

@pytest.mark.asyncio
async def test_policy_service_activate(base_policy):
    await security_repository.delete_all_policies()
    
    # Save a v1 active policy
    v1 = base_policy.model_copy(deep=True)
    v1.version = 1
    v1.status = "ACTIVE"
    await security_repository.create_policy(v1)
    
    # Save a v2 draft policy
    v2 = base_policy.model_copy(deep=True)
    v2.version = 2
    v2.status = "DRAFT"
    await security_repository.create_policy(v2)
    
    # Activate v2
    success = await security_policy_service.activate_policy(v2.policyId)
    assert success is True
    
    # Verify v1 is INACTIVE and v2 is ACTIVE
    v1_updated = await security_repository.get_policy(v1.policyId)
    v2_updated = await security_repository.get_policy(v2.policyId)
    
    assert v1_updated.status == "INACTIVE"
    assert v2_updated.status == "ACTIVE"

@pytest.mark.asyncio
async def test_policy_service_simulate(base_policy):
    await security_repository.delete_all_policies()
    await security_repository.save_policy(base_policy)
    
    evidence = {
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.95
    }
    
    result = await security_policy_service.simulate(base_policy.policyId, evidence)
    assert result["matched"] is True
    assert result["rule"]["decisionAction"] == "BLOCK"

@pytest.mark.asyncio
async def test_security_controller_decision_records_policy(base_policy):
    await security_repository.delete_all_policies()
    base_policy.status = "ACTIVE"
    await security_repository.save_policy(base_policy)
    
    evidence = {
        "nodeId": "NODE-123",
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.95
    }
    
    decision = await security_controller.evaluate_evidence(evidence)
    
    assert decision is not None
    assert decision.decision == "BLOCK"
    assert decision.policyId == base_policy.policyId
    assert decision.policyVersion == base_policy.version
    assert decision.matchedRuleId == base_policy.rules[0].ruleId
