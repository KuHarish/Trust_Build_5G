import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from app.security.models.security_decision import SecurityDecision
from app.security.repositories.security_repository import security_repository
from app.security.services.security_policy_service import security_policy_service
from app.security.services.mitigation_service import mitigation_service

logger = logging.getLogger("trustchain.security.controller")

class SecurityController:
    """
    Module 6.1 Orchestrator. Evaluates evidence, handles freshness/idempotency,
    queries policies, makes explicit decisions, and dispatches mitigations.
    """
    def __init__(self):
        self._is_running = False
        self._task: Optional[asyncio.Task] = None
        self._interval_sec = 15.0

    async def start(self):
        if self._is_running: return
        self._is_running = True
        
        # Ensure default policies exist
        await security_policy_service.initialize_default_policies()
        
        self._task = asyncio.create_task(self._simulation_loop())
        logger.info(f"Module 6 Security Controller Daemon started (Interval: {self._interval_sec}s).")

    async def stop(self):
        if not self._is_running: return
        self._is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Module 6 Security Controller Daemon stopped.")

    async def _simulation_loop(self):
        while self._is_running:
            try:
                pass
            except Exception as e:
                logger.error(f"Error in Security Controller Daemon loop: {e}")
            await asyncio.sleep(self._interval_sec)

    def _determine_freshness(self, timestamp_iso: Optional[str], max_age_seconds: int) -> str:
        if not timestamp_iso:
            return "MISSING"
        try:
            ts = datetime.fromisoformat(timestamp_iso.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            if (now - ts).total_seconds() > max_age_seconds:
                return "STALE"
            return "VALID"
        except Exception:
            return "INVALID"

    async def evaluate_evidence(self, evidence: Dict[str, Any]) -> Optional[SecurityDecision]:
        """
        Takes raw evidence from Modules 3 and 4, evaluates against policies,
        generates structured explanations, and executes mitigation.
        """
        node_id = evidence.get("nodeId", "UNKNOWN")
        trigger_id = evidence.get("triggerEventId")
        
        logger.info(f"Evaluating security evidence for node {node_id}")
        
        # Idempotency Check
        if trigger_id:
            existing = await security_repository.decisions_collection.find_one({"triggerEventId": trigger_id})
            if existing:
                logger.debug(f"Decision for trigger {trigger_id} already exists. Skipping duplicate.")
                return SecurityDecision(**existing)
                
        # Inject Freshness State
        # Using a default of 30 seconds max age for the prototype
        ml_freshness = self._determine_freshness(evidence.get("mlTimestamp"), 30)
        trust_freshness = self._determine_freshness(evidence.get("trustTimestamp"), 30)
        
        evidence["mlFreshness"] = ml_freshness
        evidence["trustFreshness"] = trust_freshness
        
        # Ensure we have explicit MISSING instead of None to match policies safely
        if evidence.get("mlPrediction") is None:
            evidence["mlPrediction"] = "MISSING"
        if evidence.get("trustLevel") is None:
            evidence["trustLevel"] = "MISSING"
            
        rule, policy = await security_policy_service.evaluate(evidence)
        
        if not policy or not rule:
            logger.debug("No security policy matched the given evidence. Falling back to default.")
            # Default fallback if absolutely no policies match
            policy_id = policy.policyId if policy else "default-fallback"
            policy_version = policy.version if policy else 1
            decision_action = policy.fallbackBehavior if policy else "MONITOR"
            reason = "Safe Fallback: No rule matched."
            severity = "LOW"
            matched_rule = "None"
            matched_rule_id = "None"
        else:
            policy_id = policy.policyId
            policy_version = policy.version
            decision_action = rule.decisionAction
            reason = f"Matched rule: {rule.name}"
            severity = rule.severity
            matched_rule = rule.name
            matched_rule_id = rule.ruleId

        # Create structured explanation
        explanation = {
            "matchedPolicy": policy.name if policy else "None",
            "matchedRule": matched_rule,
            "evidenceState": {
                "ml": ml_freshness,
                "trust": trust_freshness
            },
            "signals": {
                "mlPrediction": evidence.get("mlPrediction"),
                "mlConfidence": evidence.get("mlConfidence"),
                "trustLevel": evidence.get("trustLevel"),
                "trustScore": evidence.get("trustScore")
            },
            "conflicts": "Yes" if evidence.get("mlPrediction") == "BENIGN" and evidence.get("trustLevel") == "MALICIOUS" else "No",
            "reason": reason
        }

        # Create decision
        decision = SecurityDecision(
            nodeId=node_id,
            decision=decision_action,
            severity=severity,
            reason=reason,
            trustScore=evidence.get("trustScore"),
            trustLevel=evidence.get("trustLevel") if evidence.get("trustLevel") != "MISSING" else None,
            mlPrediction=evidence.get("mlPrediction") if evidence.get("mlPrediction") != "MISSING" else None,
            mlConfidence=evidence.get("mlConfidence"),
            attackCategory=evidence.get("attackCategory"),
            policyId=policy_id,
            policyVersion=policy_version,
            matchedRuleId=matched_rule_id,
            triggerEventId=trigger_id,
            evidenceFreshness={"ML": ml_freshness, "TRUST": trust_freshness},
            evidenceTimestamps={
                "ML": evidence.get("mlTimestamp", ""),
                "TRUST": evidence.get("trustTimestamp", "")
            },
            explanation=explanation
        )
        
        # correlationId tracking
        correlation_id = trigger_id if trigger_id else f"corr_{decision.decisionId}"
        decision.explanation["correlationId"] = correlation_id # Optional attach for ref
        
        await security_repository.create_decision(decision)
        logger.warning(f"Security Decision Created: {decision.decision} for node {decision.nodeId}")
        
        # Log decision to audit pipeline
        from app.security.services.audit_service import audit_service
        try:
            await audit_service.log_security_event({
                "eventType": "SECURITY_DECISION",
                "correlationId": correlation_id,
                "nodeId": decision.nodeId,
                "sourceModule": "SecurityDecisionEngine",
                "severity": decision.severity,
                "decisionId": decision.decisionId,
                "triggerEventId": decision.triggerEventId,
                "policyId": decision.policyId,
                "policyVersion": decision.policyVersion,
                "decision": decision.decision,
                "predictionId": evidence.get("predictionId"),
                "trustEvaluationId": evidence.get("trustEvaluationId"),
            })
        except Exception as e:
            logger.error(f"Failed to submit Security Decision {decision.decisionId} to Audit Service: {e}")
        
        # Execute mitigation
        action = await mitigation_service.request_mitigation(decision, correlation_id)
        asyncio.create_task(mitigation_service.execute_mitigation(action))
        
        return decision

security_controller = SecurityController()
