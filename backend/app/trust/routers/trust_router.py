"""
TrustChain-5G Module 3: Adaptive Trust Evaluation Engine
FastAPI REST Routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_user_token
from app.schemas.common import APIResponse

from app.trust.schemas.trust import (
    TrustProfilesListResponse,
    TrustProfileResponse,
    BehaviorMetricsResponse,
    TrustHistoryResponse,
    ComplianceResponse,
    TrustStatisticsResponse,
    ConfigurationResponse
)
from app.trust.models.config import TrustConfiguration
from app.trust.services.trust_service import trust_service
from app.trust.services.behavior_evaluation_service import behavior_evaluation_service

router = APIRouter(tags=["Adaptive Trust Engine"])

@router.get("/profiles", response_model=TrustProfilesListResponse, summary="List all Trust Profiles")
async def get_all_profiles(user=Depends(get_current_user_token)):
    profiles = await trust_service.get_all_profiles()
    return TrustProfilesListResponse(total_count=len(profiles), data=profiles)

@router.get("/profiles/{node_id}", response_model=TrustProfileResponse, summary="Get Trust Profile for Node")
async def get_profile(node_id: str, user=Depends(get_current_user_token)):
    profile = await trust_service.get_profile(node_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Trust profile not found for specified node.")
    return TrustProfileResponse(data=profile)

@router.get("/{node_id}/current", response_model=TrustProfileResponse, summary="Get Current Trust Overview")
async def get_current_profile(node_id: str, user=Depends(get_current_user_token)):
    profile = await trust_service.get_profile(node_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Trust profile not found.")
    return TrustProfileResponse(data=profile)

@router.get("/behavior/{node_id}", response_model=BehaviorMetricsResponse, summary="Get Behavior Metrics for Node")
async def get_behavior(node_id: str, user=Depends(get_current_user_token)):
    metrics = await trust_service.get_behavior_metrics(node_id)
    return BehaviorMetricsResponse(data=metrics)

@router.get("/history/{node_id}", response_model=TrustHistoryResponse, summary="Get Evaluation History for Node")
async def get_history(node_id: str, user=Depends(get_current_user_token)):
    history = await trust_service.get_history(node_id, limit=50)
    return TrustHistoryResponse(total_count=len(history), data=history)

@router.get("/compliance/{node_id}", response_model=ComplianceResponse, summary="Get Security Compliance for Node")
async def get_compliance(node_id: str, user=Depends(get_current_user_token)):
    compliance = await trust_service.get_compliance(node_id)
    if not compliance:
        raise HTTPException(status_code=404, detail="Security compliance data not found.")
    return ComplianceResponse(data=compliance)

@router.get("/statistics", response_model=TrustStatisticsResponse, summary="Get System-wide Trust Statistics")
async def get_statistics(user=Depends(get_current_user_token)):
    stats = await trust_service.get_statistics()
    return TrustStatisticsResponse(data=stats)

@router.get("/configuration", response_model=ConfigurationResponse, summary="Get Active Trust Configuration")
async def get_configuration(user=Depends(get_current_user_token)):
    config = await trust_service.get_config()
    return ConfigurationResponse(data=config)

@router.put("/configuration", response_model=ConfigurationResponse, summary="Update Trust Configuration")
async def update_configuration(config: TrustConfiguration, user=Depends(get_current_user_token)):
    try:
        # Trigger validation
        config.validate_rules()
        updated = await trust_service.update_config(config)
        return ConfigurationResponse(data=updated)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/evaluate-all", summary="Force manual evaluation of all network nodes")
async def evaluate_all(user=Depends(get_current_user_token)):
    # Trigger the background daemon logic manually
    await behavior_evaluation_service._evaluate_network_trust()
    return APIResponse(success=True, message="Network-wide trust evaluation triggered successfully.")

@router.post("/{node_id}/evaluate", summary="Force manual evaluation for specific node")
async def evaluate_node(node_id: str, user=Depends(get_current_user_token)):
    # Simplified manual trigger (evaluates entire network in background)
    await behavior_evaluation_service._evaluate_network_trust()
    return APIResponse(success=True, message=f"Evaluation triggered for node {node_id}.")
