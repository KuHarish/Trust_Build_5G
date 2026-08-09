"""
TrustChain-5G Module 3: Adaptive Trust Evaluation Engine
Trust Calculation Service & Explanation Engine
"""
import logging
from typing import Dict, Any, Tuple
from app.trust.repositories.config_repository import config_repository
from app.trust.repositories.trust_repository import trust_profile_repo, trust_evaluation_history_repo
from app.trust.models.profile import TrustProfile
from app.trust.models.history import TrustEvaluationHistory
from app.trust.models.config import TrustConfiguration

logger = logging.getLogger("trustchain.trust.calculation")

class TrustCalculationService:
    async def evaluate_node(self, node_id: str, b_score: float, h_score: float, c_score: float, metrics: Dict[str, Any]):
        """Calculates adaptive score, classifies delta, generates explanation, and commits."""
        config = await config_repository.get_active_config()
        profile = await trust_profile_repo.get_by_node_id(node_id)
        
        if not profile:
            profile = TrustProfile(nodeId=node_id)
            await trust_profile_repo.create(profile)
            
        # 1. Calculate Weighted Trust Score
        raw_score = (b_score * config.behaviorWeight) + (h_score * config.historicalWeight) + (c_score * config.complianceWeight)
        trust_score = round(max(0.0, min(1.0, raw_score)), 4)
        
        previous_score = profile.currentTrustScore if profile.currentTrustScore is not None else trust_score
        delta = round(trust_score - previous_score, 4)
        
        # 2. Threshold Classification
        if trust_score >= config.trustedThreshold:
            trust_level = "TRUSTED"
        elif trust_score >= config.suspiciousThreshold:
            trust_level = "SUSPICIOUS"
        else:
            trust_level = "MALICIOUS"
            
        # 3. Delta Classification
        if delta > 0.05:
            change_status = "IMPROVED"
        elif delta < -0.20:
            change_status = "CRITICAL_DECREASE"
        elif delta < -0.05:
            change_status = "DECREASED"
        else:
            change_status = "STABLE"
            
        # 4. Explanation Engine
        reason = self._generate_explanation(profile, b_score, h_score, c_score, delta)
        
        # 5. Commit Profile
        profile.previousTrustScore = previous_score
        profile.currentTrustScore = trust_score
        profile.trustDelta = delta
        profile.trustChange = change_status
        profile.evaluationReason = reason
        profile.trustLevel = trust_level
        profile.behaviorScore = b_score
        profile.historicalInteractionScore = h_score
        profile.securityComplianceScore = c_score
        profile.evaluationCount += 1
        
        from datetime import datetime, timezone
        profile.lastEvaluation = datetime.now(timezone.utc)
        profile.updatedAt = datetime.now(timezone.utc)
        
        await trust_profile_repo.update(profile)
        
        # 6. Commit Immutable Ledger
        history = TrustEvaluationHistory(
            nodeId=node_id,
            behaviorScore=b_score,
            historicalInteractionScore=h_score,
            securityComplianceScore=c_score,
            trustScore=trust_score,
            previousTrustScore=previous_score,
            trustDelta=delta,
            trustLevel=trust_level,
            reason=reason,
            behaviorWeight=config.behaviorWeight,
            historicalWeight=config.historicalWeight,
            complianceWeight=config.complianceWeight,
            configurationId=config.configurationId,
            metricsSnapshot=metrics
        )
        await trust_evaluation_history_repo.create(history)

    def _generate_explanation(self, profile: TrustProfile, b_score: float, h_score: float, c_score: float, delta: float) -> str:
        """Determines the human-readable reason for the trust change based on dimension shifts."""
        if profile.currentTrustScore is None:
            return "Initial trust profile established."
            
        if abs(delta) < 0.02:
            return "Trust remained stable because node behavior remained consistent."
            
        # Determine biggest mover
        b_shift = b_score - profile.behaviorScore
        h_shift = h_score - profile.historicalInteractionScore
        c_shift = c_score - profile.securityComplianceScore
        
        shifts = {"behavior (packet/latency reliability)": b_shift, "historical interaction consistency": h_shift, "security compliance": c_shift}
        
        if delta > 0:
            best_improver = max(shifts, key=shifts.get)
            return f"Trust increased because {best_improver} improved."
        else:
            worst_degrader = min(shifts, key=shifts.get)
            return f"Trust decreased because {worst_degrader} declined."

trust_calculation_service = TrustCalculationService()
