"""
TrustChain-5G Module 3 Communication Engine & Traffic Generation REST APIs.
Mounts endpoints for query inspections over sessions, packets, streaming live feeds, and network-wide KPIs.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.communication.schemas.session import SessionListResponse, SessionDetailResponse
from app.communication.schemas.packet import (
    PacketListResponse,
    PacketDetailResponse,
    LiveTrafficFeedResponse,
    CommunicationStatisticsResponse,
)
from app.communication.services.communication_service import communication_service

router = APIRouter(prefix="", tags=["communication-engine"])


@router.get("/sessions", response_model=SessionListResponse, summary="List active and archived communication sessions")
async def list_communication_sessions(
    limit: int = Query(50, ge=1, le=1000, description="Max records per response page"),
    offset: int = Query(0, ge=0, description="Pagination offset count"),
    status: Optional[str] = Query(None, description="Filter by operational status (ACTIVE, CLOSED, TIMEOUT)"),
    source: Optional[str] = Query(None, description="Filter by originating node designator"),
    target: Optional[str] = Query(None, description="Filter by target receiving node designator"),
):
    """Retrieve paginated communication sessions with optional filtering."""
    sessions, total = await communication_service.list_sessions(
        limit=limit, offset=offset, status=status, source=source, target=target
    )
    return SessionListResponse(success=True, count=len(sessions), totalCount=total, data=sessions)


@router.get("/sessions/{id}", response_model=SessionDetailResponse, summary="Get details of a specific communication session")
async def get_communication_session(id: str):
    """Retrieve detailed metadata and transmission accounting for a session UUID."""
    session = await communication_service.get_session(id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Communication session not found.")
    return SessionDetailResponse(success=True, data=session)


@router.get("/packets", response_model=PacketListResponse, summary="List transmitted packet records")
async def list_communication_packets(
    limit: int = Query(50, ge=1, le=1000, description="Max packets per page"),
    offset: int = Query(0, ge=0, description="Pagination offset count"),
    sessionId: Optional[str] = Query(None, description="Filter packets by parent session UUID"),
    protocol: Optional[str] = Query(None, description="Filter by protocol (TCP, UDP, HTTP, MQTT, CoAP, etc.)"),
):
    """Retrieve historical packet transmission log stream."""
    packets, total = await communication_service.list_packets(
        limit=limit, offset=offset, session_id=sessionId, protocol=protocol
    )
    return PacketListResponse(success=True, count=len(packets), totalCount=total, data=packets)


@router.get("/packets/{id}", response_model=PacketDetailResponse, summary="Get individual packet header inspection")
async def get_communication_packet(id: str):
    """Retrieve detailed telemetry header attributes for a single packet."""
    packet = await communication_service.get_packet(id)
    if not packet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Packet frame not found in storage.")
    return PacketDetailResponse(success=True, data=packet)


@router.get("/live", response_model=LiveTrafficFeedResponse, summary="Real-time streaming topology and packet ticker feed")
async def get_live_communication_feed():
    """Returns active connecting edges for React Flow topology graphing and recent packet stream for live monitoring tickers."""
    return await communication_service.get_live_feed()


@router.get("/statistics", response_model=CommunicationStatisticsResponse, summary="Global network communication KPI metrics")
async def get_communication_statistics():
    """
    Returns aggregated real-time metrics: Active Sessions, Packets Per Second, Total Packets,
    Average Session Duration, Average Latency, Average Bandwidth, and Protocol Distribution.
    """
    return await communication_service.get_statistics()
