"""
TrustChain-5G Network Node Management REST API Router.
Provides complete CRUD endpoints, operational statistics, and status modification capability
mounted directly under '/api/nodes'.
"""

from typing import Optional
from fastapi import APIRouter, status, HTTPException, Query
from app.simulator.schemas.node import (
    NodeCreate, NodeUpdate, NodeStatusPatch, NodeStatisticsResponse
)
from app.simulator.services.node_service import NodeService
from app.schemas.common import APIResponse, PaginatedResponse

router = APIRouter(tags=["Network Node Simulation & Registry"])


@router.get(
    "/statistics",
    response_model=APIResponse,
    summary="Get Network Node Population Statistics"
)
async def get_node_statistics():
    """
    Return aggregate statistics: totalNodes, onlineNodes, offlineNodes, nodeTypes distribution,
    and averageSignalStrength across all active simulation entities.
    """
    stats = await NodeService.get_statistics()
    return APIResponse(
        success=True,
        message="Network telemetry statistics generated successfully.",
        data=stats.model_dump()
    )


@router.post(
    "",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a New 5G Simulation Node"
)
async def create_node(payload: NodeCreate):
    """Register a virtual node with IP, MAC, coordinate validation and duplicate name checking."""
    try:
        node = await NodeService.create_node(payload)
        return APIResponse(
            success=True,
            message=f"Node [{node.nodeName}] registered into 5G control loop successfully.",
            data=node.model_dump(by_alias=True)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to register node: {str(e)}")


@router.get(
    "",
    response_model=PaginatedResponse,
    summary="List All Simulation Nodes"
)
async def list_nodes(
    search: Optional[str] = Query(None, description="Search term matching ID, Name, IP, or MAC"),
    node_type: Optional[str] = Query(None, description="Filter by node radio/device classification type"),
    status: Optional[str] = Query(None, description="Filter by operational status"),
    sort_by: Optional[str] = Query(None, description="Field parameter to sort by"),
    sort_order: str = Query("asc", description="Sorting order ('asc' or 'desc')")
):
    """Retrieve simulated nodes with search, filtering, and sorting."""
    nodes = await NodeService.list_nodes(
        search=search,
        node_type=node_type,
        status=status,
        sort_by=sort_by,
        sort_order=sort_order
    )
    data_list = [n.model_dump(by_alias=True) for n in nodes]
    return PaginatedResponse(
        success=True,
        total_count=len(data_list),
        page=1,
        page_size=len(data_list),
        data=data_list,
        message="Nodes retrieved successfully."
    )


@router.get(
    "/{node_id}",
    response_model=APIResponse,
    summary="Retrieve Node Details by ID"
)
async def get_node_by_id(node_id: str):
    """Get full properties of a specified node UUID."""
    node = await NodeService.get_node(node_id)
    if not node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Node with ID [{node_id}] not found.")
    return APIResponse(
        success=True,
        message="Node details retrieved successfully.",
        data=node.model_dump(by_alias=True)
    )


@router.put(
    "/{node_id}",
    response_model=APIResponse,
    summary="Update an Existing Node"
)
async def update_node(node_id: str, payload: NodeUpdate):
    """Update node properties with validation and uniqueness enforcement."""
    try:
        updated = await NodeService.update_node(node_id, payload)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Node with ID [{node_id}] not found.")
        return APIResponse(
            success=True,
            message=f"Node [{updated.nodeName}] updated successfully.",
            data=updated.model_dump(by_alias=True)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch(
    "/{node_id}/status",
    response_model=APIResponse,
    summary="Patch Node Operational Status"
)
async def patch_node_status(node_id: str, payload: NodeStatusPatch):
    """Quickly toggle node status (e.g. ONLINE, OFFLINE, SLEEPING)."""
    updated = await NodeService.patch_node_status(node_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Node with ID [{node_id}] not found.")
    return APIResponse(
        success=True,
        message=f"Node status changed to [{updated.status.value}] successfully.",
        data=updated.model_dump(by_alias=True)
    )


@router.delete(
    "/{node_id}",
    response_model=APIResponse,
    summary="Delete Node from Simulation Registry"
)
async def delete_node(node_id: str):
    """Permanently delete a virtual node."""
    deleted = await NodeService.delete_node(node_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Node with ID [{node_id}] not found.")
    return APIResponse(
        success=True,
        message="Node deleted successfully.",
        data={"deleted_id": node_id}
    )
