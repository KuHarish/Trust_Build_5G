"""
TrustChain-5G Module 3 Communication Business Service Engine.
Abstracts data retrieval from repository, computes real-time streaming feeds for UI topology graphs,
and synthesizes network-wide communication analytics statistics.
"""
import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict
from app.communication.models.session import CommunicationSession, SessionStatus, TrafficType
from app.communication.models.packet import Packet
from app.communication.schemas.packet import LiveTrafficFeedResponse, CommunicationStatisticsResponse
from app.communication.repositories.communication_repository import communication_repository
from app.edge.models.event import EventProtocol

logger = logging.getLogger("trustchain.communication.service")


class CommunicationService:
    def __init__(self, repo=communication_repository):
        self.repo = repo
        self._start_time = datetime.now(timezone.utc)

    async def _ensure_active_sessions(self):
        """Seed realistic 5G active topology circuits if repository has none."""
        if len(self.repo._sessions) >= 5:
            return

        mock_links = [
            ("Core-Server-01", "Aggregation-Router-01", EventProtocol.TCP, 10240.0, 1.2, -42.0),
            ("Core-Server-01", "Aggregation-Router-02", EventProtocol.TCP, 9850.0, 1.5, -45.0),
            ("Core-Server-02", "Aggregation-Router-03", EventProtocol.TCP, 10500.0, 1.4, -43.0),
            ("Core-Server-01", "Aggregation-Router-04", EventProtocol.TCP, 9400.0, 1.3, -46.0),
            ("Aggregation-Router-01", "Edge-Gateway-04", EventProtocol.HTTPS, 2400.0, 3.8, -52.0),
            ("Aggregation-Router-01", "Edge-Gateway-05", EventProtocol.HTTPS, 2600.0, 3.6, -50.0),
            ("Aggregation-Router-02", "Edge-Gateway-02", EventProtocol.HTTPS, 2100.0, 4.1, -55.0),
            ("Aggregation-Router-03", "Edge-Gateway-01", EventProtocol.HTTPS, 2550.0, 3.4, -48.0),
            ("Aggregation-Router-04", "Edge-Gateway-06", EventProtocol.HTTPS, 2300.0, 4.5, -53.0),
            ("Edge-Gateway-06", "MEC-Processor-01", EventProtocol.UDP, 1200.0, 6.2, -60.0),
            ("Edge-Gateway-02", "MEC-Processor-02", EventProtocol.UDP, 1500.0, 5.8, -58.0),
            ("Edge-Gateway-01", "MEC-Processor-03", EventProtocol.UDP, 1100.0, 5.5, -62.0),
            ("Edge-Gateway-04", "MEC-Processor-04", EventProtocol.UDP, 1400.0, 6.0, -59.0),
            ("MEC-Processor-02", "IoT-Sensor-001", EventProtocol.MQTT, 150.0, 14.5, -72.0),
            ("MEC-Processor-01", "IoT-Sensor-002", EventProtocol.MQTT, 120.0, 16.2, -75.0),
            ("MEC-Processor-03", "IoT-Sensor-005", EventProtocol.COAP, 85.0, 21.0, -81.0),
            ("Edge-Gateway-02", "IoT-Sensor-008", EventProtocol.MQTT, 95.0, 18.4, -77.0),
            ("Edge-Gateway-05", "IoT-Sensor-010", EventProtocol.COAP, 110.0, 17.5, -74.0),
            ("MEC-Processor-04", "IoT-Sensor-015", EventProtocol.MQTT, 130.0, 15.8, -73.0),
            ("Core-Server-01", "GNB-North-Sector", EventProtocol.TCP, 4800.0, 2.5, -48.0),
            ("Core-Server-02", "Edge-AI-MEC-Gateway", EventProtocol.UDP, 4200.0, 3.1, -51.0),
            ("Edge-AI-MEC-Gateway", "Node 1", EventProtocol.TCP, 1800.0, 7.2, -64.0),
        ]

        now_iso = datetime.now(timezone.utc).isoformat()
        for idx, (src, dst, proto, bw, lat, sig) in enumerate(mock_links):
            sess_id = f"sess-sim-{idx+1:03d}"
            if sess_id not in self.repo._sessions:
                sess = CommunicationSession(
                    sessionId=sess_id,
                    sourceNodeId=src,
                    destinationNodeId=dst,
                    protocol=proto,
                    trafficType=TrafficType.TELEMETRY,
                    startTime=now_iso,
                    status=SessionStatus.ACTIVE,
                    bytesTransferred=int(bw * 125000),
                    packetsSent=150 + idx * 24,
                    packetsReceived=148 + idx * 24,
                    averageLatency=lat,
                    averageBandwidth=bw,
                    signalStrength=sig,
                )
                await self.repo.insert_session(sess)

    async def list_sessions(
        self, limit: int = 50, offset: int = 0, status: Optional[str] = None, source: Optional[str] = None, target: Optional[str] = None
    ) -> Tuple[List[CommunicationSession], int]:
        await self._ensure_active_sessions()
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
        await self._ensure_active_sessions()
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
        await self._ensure_active_sessions()
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
