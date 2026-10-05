"""
TrustChain-5G Module 3 Communication & Traffic Repository Layer.
Provides dual storage persistence to MongoDB collections ('communication_sessions', 'packets')
with fast decoupled in-memory dictionary caching for resilient offline execution and automated tests.
"""
import logging
from typing import List, Optional, Tuple, Dict, Any
from app.database.client import Database
from app.communication.models.session import CommunicationSession, SessionStatus
from app.communication.models.packet import Packet

logger = logging.getLogger("trustchain.communication.repository")


class CommunicationRepository:
    def __init__(self):
        # In-memory storage caching fallback
        self._sessions: Dict[str, CommunicationSession] = {}
        self._packets: Dict[str, Packet] = {}
        self._db = Database

    def _get_sessions_collection(self):
        if self._db.client is not None:
            try:
                return self._db.get_collection("communication_sessions")
            except Exception:
                pass
        return None

    def _get_packets_collection(self):
        if self._db.client is not None:
            try:
                return self._db.get_collection("packets")
            except Exception:
                pass
        return None

    async def insert_session(self, session: CommunicationSession) -> CommunicationSession:
        self._sessions[session.sessionId] = session
        coll = self._get_sessions_collection()
        if coll is not None:
            try:
                doc = session.model_dump(by_alias=True)
                await coll.replace_one({"sessionId": session.sessionId}, doc, upsert=True)
            except Exception as e:
                logger.debug(f"MongoDB session persistence skip: {e}")
        return session

    async def update_session(self, session: CommunicationSession) -> CommunicationSession:
        return await self.insert_session(session)

    async def get_session_by_id(self, session_id: str) -> Optional[CommunicationSession]:
        if session_id in self._sessions:
            return self._sessions[session_id]
        coll = self._get_sessions_collection()
        if coll is not None:
            try:
                doc = await coll.find_one({"sessionId": session_id})
                if doc:
                    s = CommunicationSession(**doc)
                    self._sessions[s.sessionId] = s
                    return s
            except Exception as e:
                logger.debug(f"MongoDB session find failed: {e}")
        return None

    async def list_sessions(
        self,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None,
        source: Optional[str] = None,
        target: Optional[str] = None,
    ) -> Tuple[List[CommunicationSession], int]:
        results = list(self._sessions.values())
        if status:
            results = [s for s in results if s.status.value.lower() == status.lower() or s.status.lower() == status.lower()]
        if source:
            results = [s for s in results if source.lower() in s.sourceNodeId.lower()]
        if target:
            results = [s for s in results if target.lower() in s.destinationNodeId.lower()]

        # Sort by start time descending (newest first)
        results.sort(key=lambda s: s.startTime, reverse=True)
        total_count = len(results)
        return results[offset : offset + limit], total_count

    async def list_active_sessions_by_node(self, node_id: str) -> List[CommunicationSession]:
        active_sessions = []
        for s in self._sessions.values():
            if s.status == SessionStatus.ACTIVE and (s.sourceNodeId == node_id or s.destinationNodeId == node_id):
                active_sessions.append(s)
        return active_sessions

    async def get_all_active_sessions(self) -> List[CommunicationSession]:
        return [s for s in self._sessions.values() if s.status == SessionStatus.ACTIVE]

    async def insert_packet(self, packet: Packet) -> Packet:
        self._packets[packet.packetId] = packet
        # Keep maximum 5000 in-memory packets to conserve memory footprints during multi-hour runs
        if len(self._packets) > 5000:
            first_key = next(iter(self._packets))
            del self._packets[first_key]

        coll = self._get_packets_collection()
        if coll is not None:
            try:
                doc = packet.model_dump(by_alias=True)
                await coll.insert_one(doc)
            except Exception as e:
                logger.debug(f"MongoDB packet persistence skip: {e}")
        return packet

    async def get_packet_by_id(self, packet_id: str) -> Optional[Packet]:
        if packet_id in self._packets:
            return self._packets[packet_id]
        coll = self._get_packets_collection()
        if coll is not None:
            try:
                doc = await coll.find_one({"packetId": packet_id})
                if doc:
                    p = Packet(**doc)
                    self._packets[p.packetId] = p
                    return p
            except Exception as e:
                logger.debug(f"MongoDB packet find failed: {e}")
        return None

    async def list_packets(
        self, limit: int = 50, offset: int = 0, session_id: Optional[str] = None, protocol: Optional[str] = None
    ) -> Tuple[List[Packet], int]:
        results = list(self._packets.values())
        if session_id:
            results = [p for p in results if p.sessionId == session_id]
        if protocol:
            results = [p for p in results if p.protocol.value.lower() == protocol.lower() or str(p.protocol).lower() == protocol.lower()]

        results.sort(key=lambda p: p.timestamp, reverse=True)
        total_count = len(results)
        return results[offset : offset + limit], total_count

    async def count_total_packets(self) -> int:
        return len(self._packets)

    async def get_recent_packets(self, limit: int = 40) -> List[Packet]:
        results = list(self._packets.values())
        results.sort(key=lambda p: p.timestamp, reverse=True)
        return results[:limit]


communication_repository = CommunicationRepository()
