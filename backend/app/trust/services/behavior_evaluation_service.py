"""
TrustChain-5G Module 3: Adaptive Trust Evaluation Engine
Periodic Background Behavior Evaluation Daemon.
"""
import asyncio
import logging
from typing import Optional, List
from datetime import datetime, timezone

from app.trust.services.trust_service import trust_service
from app.trust.repositories.trust_repository import (
    trust_profile_repo,
    historical_interaction_repo,
    trust_evaluation_history_repo,
    security_compliance_repo
)
from app.trust.models.profile import TrustProfile
from app.trust.models.history import TrustEvaluationHistory, HistoricalInteraction
from app.simulator.services.node_service import NodeService as node_service
from app.communication.services.communication_service import communication_service

logger = logging.getLogger("trustchain.trust.evaluator")

class BehaviorEvaluationService:
    """
    Background daemon evaluating Trust Behavioral footprints.
    Interval set to 5.0s to mirror Sprint 1 and 2 simulation loops.
    """
    def __init__(self):
        self._is_running = False
        self._task: Optional[asyncio.Task] = None
        self._interval_sec = 10.0

    async def start(self):
        if self._is_running:
            return
        self._is_running = True
        self._task = asyncio.create_task(self._simulation_loop())
        logger.info(f"Module 3 Trust Evaluation Daemon started (Interval: {self._interval_sec}s).")

    async def stop(self):
        if not self._is_running:
            return
        self._is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Module 3 Trust Evaluation Daemon stopped.")

    async def _simulation_loop(self):
        while self._is_running:
            try:
                await self._evaluate_network_trust()
            except Exception as e:
                logger.error(f"Error in Trust Evaluation Daemon loop: {e}")
            await asyncio.sleep(self._interval_sec)

    async def _evaluate_network_trust(self):
        nodes = await node_service.list_nodes()
        if not nodes:
            return
            
        for node in nodes:
            # Check or create profile
            profile = await trust_profile_repo.get_by_node_id(node.id)
            if not profile:
                profile = TrustProfile(nodeId=node.id)
                await trust_profile_repo.create(profile)
                
            # Check or create compliance scaffold
            compliance = await security_compliance_repo.get_by_node_id(node.id)
            if not compliance:
                compliance = await trust_service.get_compliance(node.id)
                
            # 1. Fetch Aggregated Metrics
            metrics = await trust_service.get_behavior_metrics(node.id)
            
            # Calculate Behavior Score (0.0 to 1.0)
            b_score = min(1.0, max(0.0, metrics.successfulCommunicationRate))
            
            # Historical Interaction Extraction
            # We fetch recently completed sessions to build historical interaction ledgers
            sessions, _ = await communication_service.list_sessions(limit=50)
            for s in sessions:
                if str(s.status) == "COMPLETED" and (s.sourceNodeId == node.id or s.destinationNodeId == node.id):
                    # Check if interaction already recorded (simple heuristic to avoid duplicates on every 5s loop)
                    existing_hist = await historical_interaction_repo.get_by_node_id(node.id, limit=20)
                    already_recorded = any(h for h in existing_hist if h.sourceNode == s.sourceNodeId and h.destinationNode == s.destinationNodeId and h.sessionDuration == s.duration)
                    if not already_recorded:
                        interaction = HistoricalInteraction(
                            sourceNode=s.sourceNodeId,
                            destinationNode=s.destinationNodeId,
                            protocol=s.protocol,
                            packetsSent=s.packetsSent,
                            packetsReceived=s.packetsSent, # Simplified for evaluation
                            successfulPackets=s.packetsSent,
                            failedPackets=0,
                            latency=s.averageLatency,
                            sessionDuration=s.duration,
                            interactionStatus="COMPLETED"
                        )
                        await historical_interaction_repo.create(interaction)
            
            # Recalculate historical interaction score based on ledgers
            history_logs = await historical_interaction_repo.get_by_node_id(node.id, limit=100)
            h_score = 1.0
            if history_logs:
                successful_ints = sum(1 for h in history_logs if h.interactionStatus == "COMPLETED" and h.failedPackets == 0)
                h_score = successful_ints / len(history_logs)

            c_score = 1.0 if compliance.complianceStatus == "SECURE" else 0.5
            
            # 2. Delegate to Trust Calculation Service for Adaptive Weights & Deltas
            from app.trust.services.trust_calculation_service import trust_calculation_service
            await trust_calculation_service.evaluate_node(node.id, b_score, h_score, c_score, metrics.model_dump())


behavior_evaluation_service = BehaviorEvaluationService()
