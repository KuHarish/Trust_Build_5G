"""
TrustChain-5G Module 3 Communication Business Service Engine.
Abstracts data retrieval from repository, computes real-time streaming feeds for UI topology graphs,
and synthesizes network-wide communication analytics statistics.
"""
import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict
from app.communication.models.session import CommunicationSession, SessionStatus
from app.communication.models.packet import Packet
from app.communication.schemas.packet import LiveTrafficFeedResponse, CommunicationStatisticsResponse
from app.communication.repositories.communication_repository import communication_repository

logger = logging.getLogger("trustchain.communication.service")


class CommunicationService:
    def __init__(self, repo=communication_repository):
        self.repo = repo
        self._start_time = datetime.now(timezone.utc)

    async def list_sessions(
        self, limit: int = 50, offset: int = 0, status: Optional[str] = None, source: Optional[str] = None, target: Optional[str] = None
    ) -> Tuple[List[CommunicationSession], int]:
        return await self.repo.list_sessions(limit=limit, offset=offset, status=status, source=source, target=target)

    async def get_session(self, session_id: str) -> Optional[CommunicationSession]:
        return await self.repo.get_session_by_id(session_id)

    async def list_packets(
        self, limit: int = 50, offset: int = 0, session_id: Optional[str] = None, protocol: Optional[str] = None
    ) -> Tuple[List[Packet], int]:
        return await self.repo.list_packets(limit=limit, offset=offset, session_id=session_id, protocol=protocol)

    async def get_packet(self, packet_id: str) -> Optional[Packet]:
        return await self.repo.get_packet_by_id(packet_id)

    async def get_live_feed(self) -> LiveTrafficFeedResponse:
        """
        Returns currently open active sessions for drawing animated React Flow edges and recent packets for live tickers.
        """
        active_sessions = await self.repo.get_all_active_sessions()
        recent_packets = await self.repo.get_recent_packets(limit=30)
        return LiveTrafficFeedResponse(
            success=True,
            activeSessions=active_sessions,
            recentPackets=recent_packets
        )

    async def get_statistics(self) -> CommunicationStatisticsResponse:
        """
        Calculates global Communication Engine KPI telemetry including active sessions, packet velocity, and protocol distribution.
        """
        all_sessions, _ = await self.repo.list_sessions(limit=5000)
        total_packets = await self.repo.count_total_packets()
        active_count = sum(1 for s in all_sessions if s.status == SessionStatus.ACTIVE)

        uptime_sec = max(1.0, (datetime.now(timezone.utc) - self._start_time).total_seconds())
        packets_per_sec = round(total_packets / uptime_sec, 2)

        if len(all_sessions) == 0:
            return CommunicationStatisticsResponse(
                success=True,
                activeSessions=0,
                packetsPerSecond=0.0,
                totalPackets=0,
                averageSessionDuration=0.0,
                averageLatency=0.0,
                averageBandwidth=0.0,
                protocolDistribution={},
            )

        # Calculate average duration across sessions
        durations = []
        for s in all_sessions:
            try:
                st = datetime.fromisoformat(s.startTime)
                et = datetime.fromisoformat(s.endTime) if s.endTime else datetime.now(timezone.utc)
                durations.append(max(0.1, (et - st).total_seconds()))
            except Exception:
                durations.append(5.0)

        avg_duration = round(sum(durations) / len(durations), 1)
        avg_latency = round(sum(s.averageLatency for s in all_sessions) / len(all_sessions), 2)
        avg_bandwidth = round(sum(s.averageBandwidth for s in all_sessions) / len(all_sessions), 2)

        # Build protocol distribution from sessions & packets
        protocol_dist: Dict[str, int] = {}
        recent_pkts, _ = await self.repo.list_packets(limit=5000)
        for p in recent_pkts:
            key = p.protocol.value
            protocol_dist[key] = protocol_dist.get(key, 0) + 1
        if not protocol_dist:
            for s in all_sessions:
                key = s.protocol.value
                protocol_dist[key] = protocol_dist.get(key, 0) + s.packetsSent

        return CommunicationStatisticsResponse(
            success=True,
            activeSessions=active_count,
            packetsPerSecond=packets_per_sec,
            totalPackets=total_packets,
            averageSessionDuration=avg_duration,
            averageLatency=avg_latency,
            averageBandwidth=avg_bandwidth,
            protocolDistribution=protocol_dist,
        )


communication_service = CommunicationService()
