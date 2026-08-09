"""
TrustChain-5G Module 3: Adaptive Trust Evaluation Engine
Trust Service Logic.
"""
from typing import List, Optional, Tuple, Dict
from datetime import datetime, timezone
from app.trust.repositories.trust_repository import (
    trust_profile_repo,
    historical_interaction_repo,
    trust_evaluation_history_repo,
    security_compliance_repo
)
from app.trust.repositories.config_repository import config_repository
from app.trust.models.profile import TrustProfile
from app.trust.models.history import TrustEvaluationHistory, HistoricalInteraction
from app.trust.models.compliance import SecurityCompliance
from app.trust.models.config import TrustConfiguration
from app.trust.schemas.trust import BehaviorMetrics, TrustStatistics

from app.edge.services.edge_service import edge_service
from app.simulator.services.node_service import NodeService as node_service
from app.communication.services.communication_service import communication_service


class TrustService:
    async def get_all_profiles(self) -> List[TrustProfile]:
        return await trust_profile_repo.get_all()

    async def get_profile(self, node_id: str) -> Optional[TrustProfile]:
        return await trust_profile_repo.get_by_node_id(node_id)

    async def get_history(self, node_id: str, limit: int = 50) -> List[TrustEvaluationHistory]:
        return await trust_evaluation_history_repo.get_by_node_id(node_id, limit)

    async def get_compliance(self, node_id: str) -> Optional[SecurityCompliance]:
        compliance = await security_compliance_repo.get_by_node_id(node_id)
        if not compliance:
            # Generate default compliance scaffold for new nodes
            compliance = SecurityCompliance(nodeId=node_id)
            await security_compliance_repo.create(compliance)
        return compliance

    async def get_config(self) -> TrustConfiguration:
        return await config_repository.get_active_config()

    async def update_config(self, config_data: TrustConfiguration) -> TrustConfiguration:
        return await config_repository.update_config(config_data)

    async def get_statistics(self) -> TrustStatistics:
        profiles = await trust_profile_repo.get_all()
        total_evals = len(profiles)
        
        if total_evals == 0:
            return TrustStatistics()
            
        sum_behavior = sum(p.behaviorScore for p in profiles)
        sum_history = sum(p.historicalInteractionScore for p in profiles)
        sum_compliance = sum(p.securityComplianceScore for p in profiles)
        
        valid_trust_scores = [p for p in profiles if p.currentTrustScore is not None]
        sum_trust = sum(p.currentTrustScore for p in valid_trust_scores)
        avg_trust = (sum_trust / len(valid_trust_scores)) if valid_trust_scores else 0.0
        
        trusted_nodes = sum(1 for p in profiles if p.trustLevel == "TRUSTED")
        suspicious_nodes = sum(1 for p in profiles if p.trustLevel == "SUSPICIOUS")
        malicious_nodes = sum(1 for p in profiles if p.trustLevel == "MALICIOUS")
        
        improved_count = sum(1 for p in profiles if p.trustChange == "IMPROVED")
        decreased_count = sum(1 for p in profiles if p.trustChange in ["DECREASED", "CRITICAL_DECREASE"])
        
        highest_node = max(valid_trust_scores, key=lambda x: x.currentTrustScore, default=None)
        lowest_node = min(valid_trust_scores, key=lambda x: x.currentTrustScore, default=None)
        
        last_eval_times = [p.lastEvaluation for p in profiles if p.lastEvaluation]
        last_eval = max(last_eval_times) if last_eval_times else None

        return TrustStatistics(
            totalNodesEvaluated=total_evals,
            trustedNodes=trusted_nodes,
            suspiciousNodes=suspicious_nodes,
            maliciousNodes=malicious_nodes,
            averageTrustScore=round(avg_trust, 4),
            highestTrustNode=highest_node.nodeId if highest_node else None,
            lowestTrustNode=lowest_node.nodeId if lowest_node else None,
            averageBehaviorScore=round(sum_behavior / total_evals, 4),
            averageHistoricalInteractionScore=round(sum_history / total_evals, 4),
            averageSecurityComplianceScore=round(sum_compliance / total_evals, 4),
            trustImprovedCount=improved_count,
            trustDecreasedCount=decreased_count,
            lastEvaluationTime=last_eval
        )

    async def get_behavior_metrics(self, node_id: str) -> BehaviorMetrics:
        """
        Dynamically aggregates behavior metrics from existing Modules 1, 2, and 3.
        Does NOT duplicate data structures.
        """
        # Fetch edge features for this specific node
        all_features = await edge_service.list_features()
        node_feature = next((f for f in all_features if f.nodeId == node_id), None)
        
        # Fetch communication sessions for this node
        sessions, _ = await communication_service.list_sessions(limit=1000)
        node_sessions = [s for s in sessions if s.sourceNodeId == node_id or s.destinationNodeId == node_id]
        
        active_sessions = sum(1 for s in node_sessions if str(s.status) == "ACTIVE")
        completed_sessions = sum(1 for s in node_sessions if str(s.status) == "COMPLETED")
        
        # We can estimate packet transmission counts from the sessions
        total_tx = sum(s.packetsSent for s in node_sessions if s.sourceNodeId == node_id)
        total_rx = sum(s.packetsSent for s in node_sessions if s.destinationNodeId == node_id)
        
        success_rate = node_feature.transmissionSuccessRate if node_feature else 1.0
        successful = int(total_tx * success_rate)
        failed = total_tx - successful
        loss_rate = (failed / total_tx) if total_tx > 0 else 0.0

        return BehaviorMetrics(
            nodeId=node_id,
            totalPacketsSent=total_tx,
            totalPacketsReceived=total_rx,
            successfulPackets=successful,
            failedPackets=failed,
            packetLossRate=round(loss_rate, 4),
            averageLatency=round(node_feature.avgLatency if node_feature else 0.0, 2),
            averageJitter=round(node_feature.avgJitter if node_feature else 0.0, 2),
            averageBandwidth=round(node_feature.avgBandwidth if node_feature else 0.0, 2),
            communicationFrequency=round(node_feature.packetFrequency if node_feature else 0.0, 2),
            activeSessions=active_sessions,
            completedSessions=completed_sessions,
            averagePacketSize=round(node_feature.avgPacketSize if node_feature else 0.0, 2),
            averageSignalStrength=round(node_feature.avgSignalStrength if node_feature else -65.0, 2),
            successfulCommunicationRate=round(success_rate, 4),
            lastCommunicationTime=datetime.fromisoformat(node_feature.timestamp) if node_feature and node_feature.timestamp else None
        )

trust_service = TrustService()
