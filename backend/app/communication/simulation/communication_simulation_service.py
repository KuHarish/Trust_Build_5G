"""
TrustChain-5G Module 3 Background Communication Simulation Daemon.
Automatically executes multi-protocol traffic simulation loops every few seconds, instantiating sessions,
generating telemetry packets, closing expired circuits, and driving real-time topology visualizers.
"""
import asyncio
import random
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict
from app.simulator.services.node_service import node_service
from app.simulator.models.node import SimulationNode, SimulationNodeStatus
from app.communication.models.session import CommunicationSession, SessionStatus
from app.communication.repositories.communication_repository import communication_repository
from app.communication.simulation.traffic_generator import traffic_generator

logger = logging.getLogger("trustchain.communication.daemon")


class CommunicationSimulationService:
    def __init__(self, interval_seconds: float = 3.5):
        self.interval = interval_seconds
        self.running = False
        self._task: Optional[asyncio.Task] = None
        self.target_concurrent_sessions = 12

    async def start(self):
        """Ignites the background automated communication traffic daemon."""
        if not self.running:
            self.running = True
            self._task = asyncio.create_task(self._simulation_loop())
            logger.info("Module 3 Communication Engine background traffic simulation started.")

    async def stop(self):
        """Terminates active simulation daemon gracefully."""
        if self.running:
            self.running = False
            if self._task and not self._task.done():
                self._task.cancel()
                try:
                    await self._task
                except asyncio.CancelledError:
                    pass
            logger.info("Module 3 Communication Engine background simulation stopped.")

    async def _simulation_loop(self):
        while self.running:
            try:
                await self._execute_simulation_tick()
            except Exception as e:
                logger.error(f"Error occurring in Communication Engine simulation loop tick: {e}", exc_info=True)
            await asyncio.sleep(self.interval)

    async def _execute_simulation_tick(self):
        # 1. Retrieve current network nodes from Sprint 1.1 registry
        all_nodes, _ = await node_service.list_nodes(limit=100)
        online_nodes: Dict[str, SimulationNode] = {
            n.nodeName: n for n in all_nodes if n.status == SimulationNodeStatus.ONLINE
        }

        if len(online_nodes) < 2:
            logger.debug("Insufficient online nodes to perform communication sessions.")
            return

        active_sessions = await communication_repository.get_all_active_sessions()

        # 2. Evaluate existing active sessions for packet transmission or expiration
        for session in active_sessions:
            src = online_nodes.get(session.sourceNodeId)
            dst = online_nodes.get(session.destinationNodeId)

            # If either node dropped offline, terminate session immediately
            if not src or not dst:
                session.status = SessionStatus.CLOSED
                session.endTime = datetime.now(timezone.utc).isoformat()
                await communication_repository.update_session(session)
                continue

            # Check if session has lived its duration (randomized session closing to simulate real connectivity turnover)
            try:
                st = datetime.fromisoformat(session.startTime)
                duration_sec = (datetime.now(timezone.utc) - st).total_seconds()
                # Sessions close randomly after ~25 seconds of streaming or upon high packet count
                if duration_sec > random.randint(20, 60) or session.packetsSent >= random.randint(15, 35):
                    session.status = SessionStatus.CLOSED
                    session.endTime = datetime.now(timezone.utc).isoformat()
                    await communication_repository.update_session(session)
                    continue
            except Exception:
                pass

            # Generate 1 to 3 sequential telemetry packets inside this active session
            pkt_count = random.randint(1, 2)
            for _ in range(pkt_count):
                await traffic_generator.generate_packet_for_session(session, src, dst)

        # 3. Spawn new sessions if we are below our target active connectivity ratio
        active_sessions = await communication_repository.get_all_active_sessions()
        needed_sessions = self.target_concurrent_sessions - len(active_sessions)
        if needed_sessions > 0:
            available_sources = list(online_nodes.values())
            random.shuffle(available_sources)

            for src_node in available_sources[:needed_sessions]:
                target_node = await traffic_generator.select_compatible_target(src_node, list(online_nodes.values()))
                if target_node:
                    # Check if session between src and target already active to avoid duplicate circuits
                    exists = any(
                        s.sourceNodeId == src_node.nodeName and s.destinationNodeId == target_node.nodeName
                        for s in active_sessions
                    )
                    if not exists:
                        new_session = await traffic_generator.generate_session(src_node, target_node)
                        active_sessions.append(new_session)
                        # Immediately generate an initial handshake or telemetry packet
                        await traffic_generator.generate_packet_for_session(new_session, src_node, target_node)
                        if len(active_sessions) >= self.target_concurrent_sessions:
                            break


communication_simulation_service = CommunicationSimulationService()
