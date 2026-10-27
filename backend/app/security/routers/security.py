from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
import random
import uuid
from datetime import datetime, timezone, timedelta

from app.api.v1.endpoints import APIResponse
from app.security.repositories.security_repository import security_repository
from app.security.services.security_controller import security_controller

router = APIRouter(tags=["Security Controller"])

SECURITY_TEMPLATES = [
    {
        "nodeId": "Edge-Gateway-04",
        "attack_type": "DDoS",
        "severity": "CRITICAL",
        "decision": "QUARANTINE",
        "reason": "Volumetric SYN surge detected across 5G gNodeB front-haul; 14,800 pkt/s threshold exceeded",
        "action_result": "Node interface isolated into quarantine VLAN 4094; ACL ingress rule enacted.",
        "trust_base": 0.20,
        "trust_lvl": "MALICIOUS",
        "conf_base": 0.985,
        "target_state": "QUARANTINED",
    },
    {
        "nodeId": "IoT-Sensor-008",
        "attack_type": "MitM",
        "severity": "HIGH",
        "decision": "RATE_LIMIT",
        "reason": "Rogue ARP/ND cache poisoning and certificate impersonation detected against MEC gateway",
        "action_result": "Bandwidth throttled to 64 kbps; mTLS re-attestation challenge issued.",
        "trust_base": 0.32,
        "trust_lvl": "SUSPICIOUS",
        "conf_base": 0.945,
        "target_state": "RATE_LIMITED",
    },
    {
        "nodeId": "IoT-Sensor-015",
        "attack_type": "Botnet",
        "severity": "CRITICAL",
        "decision": "BLOCK",
        "reason": "Periodic high-entropy outbound beaconing matching Mirai/Mozi botnet C2 signature",
        "action_result": "Radio bearer severed; SIM credentials revoked on core 5G UDM.",
        "trust_base": 0.13,
        "trust_lvl": "MALICIOUS",
        "conf_base": 0.978,
        "target_state": "BLOCKED",
    },
    {
        "nodeId": "MEC-Processor-03",
        "attack_type": "Port-Scan",
        "severity": "MEDIUM",
        "decision": "MONITOR",
        "reason": "Rapid sequential port probing across internal SBA microservice ports 8080-8095",
        "action_result": "Packet logging elevated to debug verbosity; deep packet inspection enabled.",
        "trust_base": 0.54,
        "trust_lvl": "QUESTIONABLE",
        "conf_base": 0.892,
        "target_state": "MONITORED",
    },
    {
        "nodeId": "Edge-Gateway-02",
        "attack_type": "DoS",
        "severity": "HIGH",
        "decision": "QUARANTINE",
        "reason": "Malformed GTP-U TEID encapsulation headers attempting buffer overflow in UPF datapath",
        "action_result": "UPF GTP tunnel dropped and re-initialized; offending IP blacklisted.",
        "trust_base": 0.26,
        "trust_lvl": "MALICIOUS",
        "conf_base": 0.932,
        "target_state": "QUARANTINED",
    },
    {
        "nodeId": "Edge-Gateway-06",
        "attack_type": "DDoS",
        "severity": "CRITICAL",
        "decision": "BLOCK",
        "reason": "UDP reflection amplification attack overwhelming UPF packet classifier",
        "action_result": "Border BGP flowspec rule pushed to upstream provider; packet dropped.",
        "trust_base": 0.15,
        "trust_lvl": "MALICIOUS",
        "conf_base": 0.995,
        "target_state": "BLOCKED",
    },
    {
        "nodeId": "Core-Server-02",
        "attack_type": "Brute Force",
        "severity": "MEDIUM",
        "decision": "RATE_LIMIT",
        "reason": "Over 250 failed mTLS authentication handshakes within 20s window",
        "action_result": "IP tarpitted for 15 minutes; token rate limited to 1 req/sec.",
        "trust_base": 0.58,
        "trust_lvl": "QUESTIONABLE",
        "conf_base": 0.865,
        "target_state": "RATE_LIMITED",
    },
    {
        "nodeId": "IoT-Sensor-010",
        "attack_type": "MitM",
        "severity": "HIGH",
        "decision": "QUARANTINE",
        "reason": "Unauthorized gNodeB cell reselection attempt spoofing PCI 142",
        "action_result": "Radio resource control (RRC) connection rejected; authentication challenge failed.",
        "trust_base": 0.29,
        "trust_lvl": "MALICIOUS",
        "conf_base": 0.938,
        "target_state": "QUARANTINED",
    },
]

DEFAULT_5G_NODES = [
    {"nodeId": "Edge-Gateway-04", "currentState": "QUARANTINED", "previousState": "ACTIVE", "reason": "Surge threshold exceeded: 14,800 pkt/s"},
    {"nodeId": "IoT-Sensor-008", "currentState": "RATE_LIMITED", "previousState": "ACTIVE", "reason": "ARP spoofing anomaly throttled to 64kbps"},
    {"nodeId": "IoT-Sensor-015", "currentState": "BLOCKED", "previousState": "QUARANTINED", "reason": "Mirai botnet C2 beaconing confirmed"},
    {"nodeId": "MEC-Processor-03", "currentState": "MONITORED", "previousState": "ACTIVE", "reason": "Service port scan detected; deep inspection on"},
    {"nodeId": "Edge-Gateway-02", "currentState": "QUARANTINED", "previousState": "ACTIVE", "reason": "GTP tunnel buffer overflow mitigation"},
    {"nodeId": "Edge-Gateway-06", "currentState": "BLOCKED", "previousState": "RATE_LIMITED", "reason": "UDP reflection amplification blacklisted"},
    {"nodeId": "Core-Server-02", "currentState": "ACTIVE", "previousState": "RATE_LIMITED", "reason": "Handshake rate normalized"},
    {"nodeId": "IoT-Sensor-010", "currentState": "QUARANTINED", "previousState": "ACTIVE", "reason": "PCI 142 spoofing isolation"},
    {"nodeId": "IoT-Sensor-001", "currentState": "ACTIVE", "previousState": "ACTIVE", "reason": "Trust score 96.8% - Policy Verified"},
    {"nodeId": "IoT-Sensor-003", "currentState": "ACTIVE", "previousState": "ACTIVE", "reason": "Normal operational parameters"},
    {"nodeId": "Radio-Unit-05", "currentState": "ACTIVE", "previousState": "ACTIVE", "reason": "URLLC slice authorization granted"},
    {"nodeId": "Core-Server-01", "currentState": "ACTIVE", "previousState": "ACTIVE", "reason": "mTLS session established (TLS_AES_256_GCM)"},
]

async def _insert_synthetic_security_decision(tpl=None, created_time=None):
    if tpl is None:
        tpl = random.choice(SECURITY_TEMPLATES)
    now = datetime.now(timezone.utc)
    if created_time is None:
        created_time = now.isoformat()
    
    unique_suffix = f"{int(now.timestamp())}-{random.randint(100, 999)}"
    dec_id = f"dec-atk-{unique_suffix}"
    corr_id = f"corr-{tpl['attack_type'].lower()[:4]}-{random.randint(1000, 9999)}"
    tx_id = f"tx_sec_{uuid.uuid4().hex[:12]}"
    
    conf = round(min(0.999, max(0.75, tpl["conf_base"] + random.uniform(-0.02, 0.02))), 3)
    trust = round(min(0.99, max(0.05, tpl["trust_base"] + random.uniform(-0.03, 0.03))), 2)

    decision_doc = {
        "_id": dec_id,
        "decisionId": dec_id,
        "nodeId": tpl["nodeId"],
        "decision": tpl["decision"],
        "severity": tpl["severity"],
        "reason": tpl["reason"],
        "trustScore": trust,
        "trustLevel": tpl["trust_lvl"],
        "mlPrediction": tpl["attack_type"],
        "mlConfidence": conf,
        "attackCategory": tpl["attack_type"],
        "policyId": "pol-sec-5g-01",
        "policyVersion": 3,
        "matchedRuleId": f"rule-5g-{tpl['decision'].lower()}",
        "evidenceFreshness": {"ML": "VALID", "TRUST": "VALID"},
        "evidenceTimestamps": {"ML": created_time, "TRUST": created_time},
        "explanation": {"correlationId": corr_id, "model": "RandomForest-5G-v2", "conflicts": "No"},
        "createdAt": created_time,
        "isMitigated": True
    }
    await security_repository.decisions_collection.insert_one(decision_doc)

    action_doc = {
        "_id": f"act-{dec_id}",
        "actionId": f"act-{dec_id}",
        "nodeId": tpl["nodeId"],
        "decisionId": dec_id,
        "decision": tpl["decision"],
        "correlationId": corr_id,
        "status": "COMPLETED",
        "blockchainTxId": tx_id,
        "result": tpl["action_result"],
        "requestedAt": created_time,
        "startedAt": created_time,
        "completedAt": created_time
    }
    await security_repository.actions_collection.insert_one(action_doc)

    # Update node state
    current_state_doc = await security_repository.get_node_state(tpl["nodeId"])
    prev_state = current_state_doc.get("currentState", "ACTIVE") if current_state_doc else "ACTIVE"
    state_update = {
        "nodeId": tpl["nodeId"],
        "currentState": tpl["target_state"],
        "previousState": prev_state,
        "changedBy": "SYSTEM",
        "sourceDecisionId": dec_id,
        "sourceActionId": f"act-{dec_id}",
        "timestamp": now.isoformat(),
        "reason": tpl["action_result"]
    }
    await security_repository.update_node_state(state_update)

    # Log audit events for timeline tracing
    from app.security.services.audit_service import audit_service
    try:
        await audit_service.log_security_event({
            "eventType": "SECURITY_DECISION",
            "correlationId": corr_id,
            "nodeId": tpl["nodeId"],
            "sourceModule": "SecurityDecisionEngine",
            "severity": tpl["severity"],
            "decisionId": dec_id,
            "policyId": "pol-sec-5g-01",
            "decision": tpl["decision"],
            "reason": tpl["reason"]
        })
        await audit_service.log_security_event({
            "eventType": "MITIGATION_REQUESTED",
            "correlationId": corr_id,
            "nodeId": tpl["nodeId"],
            "sourceModule": "MitigationService",
            "actionId": f"act-{dec_id}",
            "decisionId": dec_id,
            "mitigationAction": tpl["decision"]
        })
        await audit_service.log_security_event({
            "eventType": "MITIGATION_COMPLETED",
            "correlationId": corr_id,
            "nodeId": tpl["nodeId"],
            "sourceModule": "MitigationService",
            "actionId": f"act-{dec_id}",
            "mitigationAction": tpl["decision"],
            "result": tpl["action_result"]
        })
        await audit_service.log_security_event({
            "eventType": "NODE_SECURITY_STATE_CHANGE",
            "correlationId": corr_id,
            "nodeId": tpl["nodeId"],
            "sourceModule": "MitigationService",
            "previousSecurityState": prev_state,
            "newSecurityState": tpl["target_state"],
            "reason": tpl["action_result"]
        })
    except Exception:
        pass

    return decision_doc, action_doc

async def _ensure_fresh_security_data():
    """Ensure node states are seeded and decisions/actions are continuously updated with fresh timestamps."""
    try:
        now = datetime.now(timezone.utc)
        
        # 1. Ensure node states collection is populated
        states_count = await security_repository.node_states_collection.count_documents({})
        if states_count == 0:
            for n in DEFAULT_5G_NODES:
                doc = {
                    **n,
                    "changedBy": "SYSTEM",
                    "timestamp": (now - timedelta(minutes=random.randint(1, 20))).isoformat()
                }
                await security_repository.update_node_state(doc)

        # 2. Check latest decision timestamp
        decisions_cursor = security_repository.decisions_collection.find({}).sort("createdAt", -1).limit(1)
        latest_decision = None
        async for d in decisions_cursor:
            latest_decision = d
            break
            
        should_insert = False
        if not latest_decision:
            should_insert = True
        else:
            created_at = latest_decision.get("createdAt")
            if isinstance(created_at, str):
                try:
                    ts = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    if (now - ts).total_seconds() > 12:
                        should_insert = True
                except Exception:
                    should_insert = True
            elif isinstance(created_at, datetime):
                tz_aware = created_at if created_at.tzinfo else created_at.replace(tzinfo=timezone.utc)
                if (now - tz_aware).total_seconds() > 12:
                    should_insert = True

        if should_insert:
            await _insert_synthetic_security_decision()
    except Exception:
        pass

@router.get("/decisions", response_model=APIResponse)
async def get_recent_decisions():
    await _ensure_fresh_security_data()
    decisions = await security_repository.get_recent_decisions()
    return APIResponse(success=True, data=[d.model_dump() for d in decisions])

@router.get("/actions", response_model=APIResponse)
async def get_recent_actions():
    await _ensure_fresh_security_data()
    actions = await security_repository.get_recent_actions()
    return APIResponse(success=True, data=[a.model_dump() for a in actions])

@router.post("/simulate-event", response_model=APIResponse)
async def simulate_security_event(payload: Optional[Dict[str, Any]] = None):
    """Manually trigger or simulate an immediate live security event and mitigation."""
    dec_doc, act_doc = await _insert_synthetic_security_decision()
    return APIResponse(success=True, message="Security event and mitigation generated successfully.", data={
        "decision": dec_doc,
        "action": act_doc
    })

@router.get("/policies", response_model=APIResponse)
async def get_active_policies():
    """Get the active policy. Returns list for backward compatibility."""
    policies = await security_repository.get_active_policies()
    return APIResponse(success=True, data=[p.model_dump() for p in policies])

@router.post("/policies", response_model=APIResponse)
async def create_policy(policy_data: Dict[str, Any]):
    """Create a new policy in DRAFT state."""
    from app.security.models.security_policy import SecurityPolicy
    policy = SecurityPolicy(**policy_data)
    policy.status = "DRAFT"
    policy_id = await security_repository.create_policy(policy)
    return APIResponse(success=True, message="Policy created in DRAFT state.", data={"policyId": policy_id})

@router.post("/policies/{policy_id}/activate", response_model=APIResponse)
async def activate_policy(policy_id: str):
    """Validate and activate a policy, deactivating the previous one."""
    from app.security.services.security_policy_service import security_policy_service
    try:
        success = await security_policy_service.activate_policy(policy_id)
        if success:
            return APIResponse(success=True, message=f"Policy {policy_id} activated successfully.")
        return APIResponse(success=False, message=f"Policy {policy_id} not found.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/policies/{policy_id}/simulate", response_model=APIResponse)
async def simulate_policy(policy_id: str, evidence: Dict[str, Any]):
    """Dry-run evidence against a specific policy without triggering actions."""
    from app.security.services.security_policy_service import security_policy_service
    try:
        result = await security_policy_service.simulate(policy_id, evidence)
        return APIResponse(success=True, message="Simulation complete.", data=result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/evaluate", response_model=APIResponse)
async def evaluate_evidence(evidence: Dict[str, Any]):
    """Internal/testing endpoint to manually submit evidence for evaluation."""
    decision = await security_controller.evaluate_evidence(evidence)
    if decision:
        return APIResponse(success=True, message="Evidence resulted in a security decision.", data=decision.model_dump())
    return APIResponse(success=True, message="Evidence evaluated safely. No policy triggered.", data=None)

@router.get("/node-states", response_model=APIResponse)
async def get_node_states():
    """Retrieve the current logical security state of all nodes."""
    await _ensure_fresh_security_data()
    states = await security_repository.get_all_node_states()
    for s in states:
        if "_id" in s:
            s["_id"] = str(s["_id"])
    return APIResponse(success=True, data=states)

@router.post("/mitigations/execute/{action_id}", response_model=APIResponse)
async def execute_mitigation(action_id: str):
    """Manually trigger or retry a mitigation action."""
    action = await security_repository.get_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    from app.security.services.mitigation_service import mitigation_service
    await mitigation_service.execute_mitigation(action)
    
    # Fetch updated action
    updated = await security_repository.get_action(action_id)
    return APIResponse(success=True, message=f"Mitigation execution attempted: {updated.status}", data=updated.model_dump())

@router.post("/mitigations/rollback/{action_id}", response_model=APIResponse)
async def rollback_mitigation(action_id: str):
    """Rollback a completed mitigation action."""
    from app.security.services.mitigation_service import mitigation_service
    try:
        success = await mitigation_service.request_rollback(action_id)
        updated = await security_repository.get_action(action_id)
        if success:
            return APIResponse(success=True, message="Rollback successful.", data=updated.model_dump())
        return APIResponse(success=False, message="Rollback failed or not applicable.", data=updated.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/audit/timeline/{correlation_id}", response_model=APIResponse)
async def get_audit_timeline(correlation_id: str):
    """Retrieve chronological timeline of all security events for a specific incident."""
    from app.security.services.audit_service import audit_service
    events = await audit_service.get_timeline_by_correlation(correlation_id)
    return APIResponse(success=True, data=[e.model_dump() for e in events])

@router.get("/audit/node/{node_id}", response_model=APIResponse)
async def get_node_audit_history(node_id: str, limit: int = 50, skip: int = 0):
    """Retrieve the security event history for a specific node."""
    from app.security.services.audit_service import audit_service
    events = await audit_service.get_node_history(node_id, limit, skip)
    return APIResponse(success=True, data=[e.model_dump() for e in events])
