"""
TrustChain-5G Module 2: Edge Server & Feature Extraction - REST API Router.
Exposes communication event ingestion, live filtering, extracted features queries, and network statistics.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query
from app.edge.schemas.event import (
    EventCreateRequest,
    EventListResponse,
    EventSingleResponse,
    EdgeStatisticsResponse,
)
from app.edge.schemas.feature import (
    FeatureListResponse,
    FeatureSingleResponse,
)
from app.edge.services.edge_service import edge_service

router = APIRouter(prefix="/edge", tags=["Module 2 - Edge Server & Feature Extraction"])

@router.post(
    "/events",
    response_model=EventSingleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit & Process Communication Event"
)
async def create_event(payload: EventCreateRequest):
    """
    Ingests raw network communication telemetry between nodes, calculates physical metrics, and updates feature extraction pipelines.
    """
    try:
        event = await edge_service.process_and_store_event(payload)
        return EventSingleResponse(success=True, data=event)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Event ingestion failed: {str(e)}")

@router.get(
    "/events",
    response_model=EventListResponse,
    summary="List & Filter Communication Events"
)
async def get_events(
    limit: int = Query(50, ge=1, le=500, description="Max items per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    search: Optional[str] = Query(None, description="Search term across node IDs and UUIDs"),
    protocol: Optional[str] = Query("All", description="Protocol filter (e.g. TCP, UDP, MQTT)")
):
    """
    Retrieve paginated historical communication events sorted by recent timestamp.
    """
    events, total = await edge_service.list_events(limit=limit, offset=offset, search=search, protocol=protocol)
    return EventListResponse(success=True, total_count=total, data=events)

@router.get(
    "/events/{event_id}",
    response_model=EventSingleResponse,
    summary="Get Specific Communication Event"
)
async def get_event_by_id(event_id: str):
    """
    Retrieve single event details by event UUID.
    """
    event = await edge_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Communication event {event_id} not found.")
    return EventSingleResponse(success=True, data=event)

@router.delete(
    "/events/{event_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Communication Event"
)
async def delete_event(event_id: str):
    """
    Delete a communication event from storage.
    """
    deleted = await edge_service.delete_event(event_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Communication event {event_id} not found or already deleted.")
    return {"success": True, "message": f"Event {event_id} removed successfully."}

@router.get(
    "/features",
    response_model=FeatureListResponse,
    summary="List Extracted Network Features"
)
async def get_all_features():
    """
    Retrieve mathematical network features and zero-to-one normalized parameter tensors for all communicating nodes.
    """
    features = await edge_service.list_features()
    return FeatureListResponse(success=True, total_count=len(features), data=features)

@router.get(
    "/features/{node_id}",
    response_model=FeatureSingleResponse,
    summary="Get Extracted Features for Specific Node"
)
async def get_node_features(node_id: str):
    """
    Retrieve feature extraction record for a specific network node entity.
    """
    feature = await edge_service.get_node_feature(node_id)
    if not feature:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Extracted features for node {node_id} not found.")
    return FeatureSingleResponse(success=True, data=feature)

@router.get(
    "/statistics",
    response_model=EdgeStatisticsResponse,
    summary="Get Global Edge Traffic Statistics"
)
async def get_edge_statistics():
    """
    Retrieve global network telemetry KPIs including event velocity, throughput, average latency, and protocol composition.
    """
    stats = await edge_service.get_statistics()
    return stats
