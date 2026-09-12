from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from app.api.v1.endpoints import APIResponse
from app.security.repositories.security_repository import security_repository
from app.security.services.security_controller import security_controller

router = APIRouter(tags=["Security Controller"])

@router.get("/decisions", response_model=APIResponse)
async def get_recent_decisions():
    decisions = await security_repository.get_recent_decisions()
    return APIResponse(success=True, data=[d.model_dump() for d in decisions])

@router.get("/actions", response_model=APIResponse)
async def get_recent_actions():
    actions = await security_repository.get_recent_actions()
    return APIResponse(success=True, data=[a.model_dump() for a in actions])

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
    states = await security_repository.get_all_node_states()
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
