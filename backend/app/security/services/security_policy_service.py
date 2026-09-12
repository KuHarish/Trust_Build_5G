import logging
from typing import Optional, Dict, Any, List, Tuple

from app.security.models.security_policy import SecurityPolicy, PolicyRule, PolicyCondition
from app.security.repositories.security_repository import security_repository
from app.security.services.policy_validator import policy_validator
from app.security.services.audit_service import audit_service

logger = logging.getLogger("trustchain.security.policy_service")

class SecurityPolicyService:
    def _evaluate_condition(self, condition: PolicyCondition, evidence: Dict[str, Any]) -> bool:
        field = condition.field
        
        if condition.value == "MISSING" and condition.operator == "==":
            return field not in evidence or evidence[field] is None
            
        if field not in evidence or evidence[field] is None:
            return False
            
        ev_val = evidence[field]
        cond_val = condition.value
        op = condition.operator
        
        try:
            if op == "==": return str(ev_val) == str(cond_val)
            if op == "!=": return str(ev_val) != str(cond_val)
            
            if isinstance(ev_val, (int, float)) and isinstance(cond_val, (int, float, str)):
                cond_val_num = float(cond_val)
                if op == ">": return ev_val > cond_val_num
                if op == ">=": return ev_val >= cond_val_num
                if op == "<": return ev_val < cond_val_num
                if op == "<=": return ev_val <= cond_val_num
                
            if isinstance(ev_val, str) and isinstance(cond_val, str):
                if op == "in": return ev_val in cond_val.split(",")
                if op == "not_in": return ev_val not in cond_val.split(",")
        except Exception as e:
            logger.warning(f"Error evaluating policy condition {field} {op} {cond_val}: {e}")
            return False
            
        return False

    async def evaluate(self, evidence: Dict[str, Any]) -> Tuple[Optional[PolicyRule], Optional[SecurityPolicy]]:
        """
        Evaluate the single ACTIVE policy against the provided evidence.
        Returns (MatchedRule, ActivePolicy) or (None, None).
        """
        policy = await security_repository.get_active_policy()
        if not policy:
            return None, None
            
        # Sort rules by priority (lower number = higher priority)
        sorted_rules = sorted(policy.rules, key=lambda r: r.priority)
        
        for rule in sorted_rules:
            all_match = True
            for condition in rule.conditions:
                if not self._evaluate_condition(condition, evidence):
                    all_match = False
                    break
                    
            if all_match and rule.conditions:
                return rule, policy
                
        return None, policy

    async def simulate(self, policy_id: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dry run an evidence evaluation against a specific policy (doesn't have to be active).
        """
        policy = await security_repository.get_policy(policy_id)
        if not policy:
            raise ValueError(f"Policy {policy_id} not found.")
            
        sorted_rules = sorted(policy.rules, key=lambda r: r.priority)
        for rule in sorted_rules:
            all_match = True
            for condition in rule.conditions:
                if not self._evaluate_condition(condition, evidence):
                    all_match = False
                    break
            if all_match and rule.conditions:
                return {
                    "matched": True,
                    "policy": {"id": policy.policyId, "version": policy.version, "name": policy.name},
                    "rule": {"id": rule.ruleId, "name": rule.name, "decisionAction": rule.decisionAction, "severity": rule.severity}
                }
                
        return {
            "matched": False,
            "policy": {"id": policy.policyId, "version": policy.version, "name": policy.name},
            "rule": None,
            "fallbackBehavior": policy.fallbackBehavior
        }

    async def activate_policy(self, policy_id: str) -> bool:
        """
        Safely activate a policy and deactivate the previous one.
        """
        policy = await security_repository.get_policy(policy_id)
        if not policy:
            return False
            
        val_result = policy_validator.validate(policy)
        if not val_result["valid"]:
            raise ValueError(f"Cannot activate invalid policy: {val_result['errors']}")
            
        # Deactivate current active policy
        active_policy = await security_repository.get_active_policy()
        if active_policy:
            active_policy.status = "INACTIVE"
            await security_repository.save_policy(active_policy)
            
        policy.status = "ACTIVE"
        await security_repository.save_policy(policy)
        
        try:
            await audit_service.log_security_event({
                "eventType": "POLICY_ACTIVATED",
                "correlationId": f"pol_{policy.policyId}",
                "sourceModule": "SecurityPolicyService",
                "policyId": policy.policyId,
                "policyVersion": policy.version
            })
        except Exception: pass
        
        return True

    async def initialize_default_policies(self):
        """Seed baseline Case A - F default unified policy."""
        active = await security_repository.get_active_policy()
        if active:
            return # Already seeded
            
        policy = SecurityPolicy(
            name="TrustChain Baseline Policy",
            description="Default comprehensive security policy covering Cases A - F.",
            version=1,
            status="ACTIVE",
            rules=[
                PolicyRule(
                    name="CASE D: High-Confidence Attack + Malicious Node",
                    description="Block node if ML detects attack with high confidence and trust is critically low.",
                    priority=10,
                    decisionAction="BLOCK",
                    severity="CRITICAL",
                    conditions=[
                        PolicyCondition(field="mlFreshness", operator="!=", value="STALE"),
                        PolicyCondition(field="mlPrediction", operator="==", value="ATTACK"),
                        PolicyCondition(field="mlConfidence", operator=">=", value=0.80),
                        PolicyCondition(field="trustLevel", operator="==", value="MALICIOUS")
                    ]
                ),
                PolicyRule(
                    name="CASE C: High-Confidence Attack + Suspicious Trust",
                    description="Quarantine node if ML detects attack with high confidence and trust is suspicious.",
                    priority=20,
                    decisionAction="QUARANTINE",
                    severity="HIGH",
                    conditions=[
                        PolicyCondition(field="mlFreshness", operator="!=", value="STALE"),
                        PolicyCondition(field="mlPrediction", operator="==", value="ATTACK"),
                        PolicyCondition(field="mlConfidence", operator=">=", value=0.80),
                        PolicyCondition(field="trustLevel", operator="==", value="SUSPICIOUS")
                    ]
                ),
                PolicyRule(
                    name="CONFLICT: High-Confidence Attack + Trusted Node",
                    description="Rate limit node if ML detects attack but trust is high (conflict).",
                    priority=30,
                    decisionAction="RATE_LIMIT",
                    severity="MEDIUM",
                    conditions=[
                        PolicyCondition(field="mlFreshness", operator="!=", value="STALE"),
                        PolicyCondition(field="mlPrediction", operator="==", value="ATTACK"),
                        PolicyCondition(field="mlConfidence", operator=">=", value=0.80),
                        PolicyCondition(field="trustLevel", operator="==", value="TRUSTED")
                    ]
                ),
                PolicyRule(
                    name="CASE B: Suspicious / Uncertain Detection",
                    description="Warn node if ML indicates attack but confidence is low.",
                    priority=40,
                    decisionAction="WARN",
                    severity="MEDIUM",
                    conditions=[
                        PolicyCondition(field="mlFreshness", operator="!=", value="STALE"),
                        PolicyCondition(field="mlPrediction", operator="==", value="ATTACK"),
                        PolicyCondition(field="mlConfidence", operator="<", value=0.80)
                    ]
                ),
                PolicyRule(
                    name="CASE E: Critically Low Trust",
                    description="Warn node if trust is malicious but ML does not confidently detect attack.",
                    priority=50,
                    decisionAction="WARN",
                    severity="MEDIUM",
                    conditions=[
                        PolicyCondition(field="trustLevel", operator="==", value="MALICIOUS"),
                        PolicyCondition(field="mlPrediction", operator="!=", value="ATTACK")
                    ]
                ),
                PolicyRule(
                    name="CASE A: Benign Operation",
                    description="Allow traffic if ML is Benign and trust is not malicious.",
                    priority=60,
                    decisionAction="ALLOW",
                    severity="LOW",
                    conditions=[
                        PolicyCondition(field="mlFreshness", operator="!=", value="STALE"),
                        PolicyCondition(field="mlPrediction", operator="==", value="BENIGN"),
                        PolicyCondition(field="trustLevel", operator="!=", value="MALICIOUS")
                    ]
                ),
                PolicyRule(
                    name="CASE F: Evidence Unavailable",
                    description="Monitor node if neither ML nor Trust evidence is available.",
                    priority=70,
                    decisionAction="MONITOR",
                    severity="LOW",
                    conditions=[
                        PolicyCondition(field="mlPrediction", operator="==", value="MISSING"),
                        PolicyCondition(field="trustLevel", operator="==", value="MISSING")
                    ]
                )
            ]
        )
        
        await security_repository.create_policy(policy)
        try:
            await audit_service.log_security_event({
                "eventType": "POLICY_CREATED",
                "correlationId": f"pol_{policy.policyId}",
                "sourceModule": "SecurityPolicyService",
                "policyId": policy.policyId,
                "policyVersion": policy.version
            })
        except Exception: pass
        logger.info("Baseline Sprint 6.3 Security Policy initialized.")

security_policy_service = SecurityPolicyService()
