"""
TrustChain-5G Sprint 1.4: Real-Time Network Monitoring & System Integration Dashboard Router.
Exposes overview APIs, network health diagnostics, real-time WebSocket and Server-Sent Event streaming feeds,
simulation controls, and multi-format file export downloads.
"""
import asyncio
import logging
from fastapi import APIRouter, HTTPException, status, Query, Response, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import StreamingResponse
from app.dashboard.schemas.dashboard import (
    DashboardOverviewResponse,
    DashboardHealthResponse,
    DashboardLiveResponse,
    DashboardStatisticsResponse,
    SimulationControlRequest,
    SimulationStatus,
)
from app.dashboard.services.dashboard_service import dashboard_service

logger = logging.getLogger("trustchain.dashboard.api")

router = APIRouter(tags=["Real-Time Network Dashboard & Monitoring"])


@router.get(
    "/overview",
    response_model=DashboardOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get aggregated system overview metrics across all modules"
)
async def get_system_overview():
    try:
        overview = await dashboard_service.get_overview()
        return DashboardOverviewResponse(success=True, data=overview)
    except Exception as e:
        logger.error(f"Error fetching system overview metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/health",
    response_model=DashboardHealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate system operational health and RF diagnostics"
)
async def get_network_health():
    try:
        health = await dashboard_service.get_health()
        return DashboardHealthResponse(success=True, data=health)
    except Exception as e:
        logger.error(f"Error evaluating network health: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/live",
    response_model=DashboardLiveResponse,
    status_code=status.HTTP_200_OK,
    summary="Query unified real-time dashboard snapshot feed"
)
async def get_live_dashboard():
    try:
        data = await dashboard_service.get_live_stream()
        return data
    except Exception as e:
        logger.error(f"Error fetching live dashboard feed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/statistics",
    response_model=DashboardStatisticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve time-series trend statistics for live chart visualizers"
)
async def get_dashboard_statistics():
    try:
        stats = await dashboard_service.get_statistics_trend()
        return stats
    except Exception as e:
        logger.error(f"Error retrieving trend analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/simulation/control",
    response_model=SimulationStatus,
    status_code=status.HTTP_200_OK,
    summary="Interactive console controls for background traffic daemons"
)
async def control_simulation_daemons(request: SimulationControlRequest):
    try:
        status_res = await dashboard_service.control_simulation(request)
        return status_res
    except Exception as e:
        logger.error(f"Error executing simulation control command: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/export/{resource}",
    summary="Download structured CSV or JSON logs for Sessions, Packets, or Extracted Features"
)
async def export_dashboard_data(
    resource: str,
    format: str = Query("csv", description="Target export format: csv or json")
):
    if resource.lower() not in ["sessions", "packets", "features"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid export resource. Valid categories are: 'sessions', 'packets', 'features'."
        )
    if format.lower() not in ["csv", "json"]:
        raise HTTPException(status_code=400, detail="Invalid format. Supported formats are: 'csv', 'json'.")

    try:
        content, media_type, filename = await dashboard_service.export_data(resource, format)
        return Response(
            content=content,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        logger.error(f"Error generating data export for {resource} ({format}): {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws")
async def websocket_dashboard_stream(websocket: WebSocket):
    """
    Real-time continuous bi-directional WebSocket telemetry stream for automatic UI updates
    without manual page reloading.
    """
    await websocket.accept()
    logger.info("New dashboard WebSocket client connected.")
    try:
        while True:
            data = await dashboard_service.get_live_stream()
            await websocket.send_json(data.model_dump())
            await asyncio.sleep(2.5)
    except WebSocketDisconnect:
        logger.info("Dashboard WebSocket client disconnected cleanly.")
    except Exception as e:
        logger.error(f"Error during WebSocket telemetry broadcast: {e}", exc_info=True)
        try:
            await websocket.close()
        except Exception:
            pass


@router.get("/stream", response_class=StreamingResponse, summary="Server-Sent Events continuous HTTP live telemetry fallback stream")
async def sse_dashboard_stream(request: Request):
    """
    Server-Sent Events (SSE) stream ensuring reliable real-time dashboard pushes through firewalls or non-WS networks.
    """
    async def event_generator():
        while True:
            if await request.is_disconnected():
                logger.debug("SSE client disconnected.")
                break
            try:
                data = await dashboard_service.get_live_stream()
                yield f"data: {data.model_dump_json()}\n\n"
            except Exception as err:
                logger.error(f"SSE serialization error: {err}")
                break
            await asyncio.sleep(2.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    })
