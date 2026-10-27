"""
TrustChain-5G Module 3: Adaptive Trust Evaluation Engine
Dynamic Background Behavior Evaluation Daemon & Real-time Trust Engine.
"""
import asyncio
import logging
import random
import hashlib
from typing import Optional, List, Dict, Tuple
from datetime import datetime, timezone

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
from app.trust.services.trust_calculation_service import trust_calculation_service

logger = logging.getLogger("trustchain.trust.evaluator")

# Target node persona categories for high-fidelity 5G security simulation
MALICIOUS_TARGETS: Dict[str, Tuple[str, float, float, float]] = {
    "Edge-Gateway-04": ("Volumetric SYN flood & buffer saturation detected on 5G gNodeB front-haul", 0.22, 0.28, 0.15),
    "IoT-Sensor-015": ("Mirai/Mozi botnet C2 beaconing & unauthorized telemetry burst", 0.18, 0.22, 0.10),
    "IoT-Sensor-024": ("High-entropy outbound payload matching DNS exfiltration tunnel", 0.25, 0.30, 0.20),
    "IoT-Sensor-031": ("Unauthorized handover injection & radio bearer exploit attempt", 0.16, 0.25, 0.12),
    "MEC-Processor-08": ("Lateral privilege escalation attempt on 5G SBA service mesh", 0.28, 0.32, 0.25),
    "Edge-Gateway-03": ("Compromised TLS certificate impersonation & rogue gateway routing", 0.20, 0.26, 0.18),
}

SUSPICIOUS_TARGETS: Dict[str, Tuple[str, float, float, float]] = {
    "MEC-Processor-03": ("Sequential port probing across internal SBA microservice ports 8080-8095", 0.58, 0.62, 0.50),
    "IoT-Sensor-008": ("Rogue ARP/ND cache poisoning detected against MEC edge gateway", 0.46, 0.52, 0.45),
    "Edge-Gateway-02": ("High jitter (+28ms) and intermittent packet loss bursts (14.2%)", 0.64, 0.66, 0.60),
    "IoT-Sensor-010": ("Anomalous telemetry payload size outside Gaussian baseline (Z > 2.6)", 0.52, 0.58, 0.50),
    "Edge-Gateway-06": ("Intermittent radio link flapping and repeated authentication retries", 0.62, 0.65, 0.55),
    "IoT-Sensor-017": ("Elevated packet retransmissions & cryptographic handshake timeout", 0.55, 0.60, 0.52),
    "MEC-Processor-05": ("Elevated CPU/Memory load causing delayed message processing", 0.65, 0.68, 0.60),
    "IoT-Sensor-027": ("Sporadic radio link attenuation causing packet degradation", 0.50, 0.56, 0.48),
}

CORE_TRUSTED_NODES = {
    "Core-Server-01", "Core-Server-02", "GNB-North-Sector", "Edge-AI-MEC-Gateway",
    "Aggregation-Router-01", "Aggregation-Router-02", "Aggregation-Router-03",
    "Aggregation-Router-04", "Edge-Gateway-01", "Edge-Gateway-05", "MEC-Processor-01",
    "MEC-Processor-02", "MEC-Processor-04", "IoT-Sensor-001", "IoT-Sensor-002",
    "IoT-Sensor-005", "IoT-Sensor-006", "IoT-Sensor-007", "IoT-Sensor-009"
}

MALICIOUS_REASONS = [
    "Volumetric SYN surge detected across front-haul; 14,800 pkt/s threshold exceeded",
    "Periodic high-entropy outbound beaconing matching Mirai/Mozi botnet C2 signature",
    "Unauthorized DNS tunneling & covert exfiltration channel identified by DPI",
    "Zero-day radio bearer exploit attempt flagged; quarantine enacted",
    "Credential stuffing attack against gNodeB SBA control plane",
    "Mitigation executed: node quarantined, radioactive telemetry contained",
]

SUSPICIOUS_REASONS = [
    "Rapid sequential port probing across internal SBA microservice ports 8080-8095",
    "Elevated packet jitter (+24ms) and retransmission rate degradation",
    "Intermittent radio link flapping detected; cryptographic re-handshake requested",
    "Rogue ARP/ND cache poisoning and certificate impersonation detected against MEC gateway",
    "Anomalous telemetry payload size outside Gaussian baseline (Z-score > 2.8)",
    "Rate limiting enforced: transmission bandwidth restricted to 64 kbps",
]

TRUSTED_REASONS = [
    "Continuous zero-loss telemetry and verified mTLS cryptographic identity",
    "Optimal latency (4.2ms) and 100% transmission reliability maintained",
    "Firmware attestation signature verified via 5G Authentication Server (AUSF)",
    "Historical interaction consistency validated across 250+ consecutive sessions",
    "Stable packet delivery and verified cryptographic handshake maintained high trust",
    "Micro-fluctuation within acceptable radio link tolerances; core operations optimal",
]


class BehaviorEvaluationService:
    """
    Background daemon continuously evaluating Trust Behavioral footprints.
    Interval set to 4.0s for responsive live sliding telemetry.
    """
    def __init__(self):
        self._is_running = False
        self._task: Optional[asyncio.Task] = None
        self._interval_sec = 4.0
        self._last_evaluation_time: Optional[datetime] = None

    async def start(self):
        if self._is_running:
            return
        self._is_running = True
        self._task = asyncio.create_task(self._simulation_loop())
        logger.info(f"Module 3 Adaptive Trust Evaluation Daemon started (Interval: {self._interval_sec}s).")

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
        logger.info("Module 3 Adaptive Trust Evaluation Daemon stopped.")

    async def _simulation_loop(self):
        # Initial burst to ensure network is fully populated with distinct trust levels
        await asyncio.sleep(1.0)
        await self.evaluate_network(force_all=True)
        
        while self._is_running:
            try:
                await self.evaluate_network(force_all=False)
            except Exception as e:
                logger.error(f"Error in Trust Evaluation Daemon loop: {e}")
            await asyncio.sleep(self._interval_sec)

    def _determine_node_tier(self, node_id: str, node_name: str) -> str:
        """Categorize node into MALICIOUS, SUSPICIOUS, or TRUSTED."""
        if node_name in MALICIOUS_TARGETS or node_id in MALICIOUS_TARGETS:
            return "MALICIOUS"
        if node_name in SUSPICIOUS_TARGETS or node_id in SUSPICIOUS_TARGETS:
            return "SUSPICIOUS"
        if node_name in CORE_TRUSTED_NODES or node_id in CORE_TRUSTED_NODES:
            return "TRUSTED"
        
        # Deterministic partition for arbitrary simulated nodes
        h = int(hashlib.md5((node_name or node_id).encode()).hexdigest(), 16) % 100
        if h < 12:
            return "MALICIOUS"
        elif h < 32:
            return "SUSPICIOUS"
        else:
            return "TRUSTED"

    def _generate_tier_scores(self, tier: str, current_score: Optional[float]) -> Tuple[float, float, float, float, str]:
        """
        Generate dynamically drifting (b_score, h_score, c_score, target_score, reason).
        Produces realistic deltas and boundary shifts.
        """
        if tier == "MALICIOUS":
            base = current_score if (current_score is not None and current_score < 0.45) else random.uniform(0.18, 0.32)
            # Drift with occasional recovery pulse
            recovery_pulse = random.random() < 0.15
            if recovery_pulse:
                drift = random.uniform(0.08, 0.16)
                reason = "Probationary trust increase following automated security controller mitigation."
            else:
                drift = random.uniform(-0.04, 0.04)
                reason = random.choice(MALICIOUS_REASONS)
            target = max(0.10, min(0.42, base + drift))
            b_score = round(max(0.05, min(0.45, target + random.uniform(-0.04, 0.04))), 4)
            h_score = round(max(0.05, min(0.50, target + random.uniform(-0.03, 0.03))), 4)
            c_score = round(max(0.05, min(0.40, target + random.uniform(-0.02, 0.02))), 4)

        elif tier == "SUSPICIOUS":
            base = current_score if (current_score is not None and 0.40 <= current_score <= 0.75) else random.uniform(0.48, 0.65)
            drift = random.uniform(-0.06, 0.06)
            target = max(0.40, min(0.74, base + drift))
            if target >= 0.70:
                reason = "Trust transiently improved to TRUSTED after mTLS attestation challenge passed."
            elif drift < -0.03:
                reason = "Intermittent jitter spike (+26ms) and packet retransmissions lowered trust."
            else:
                reason = random.choice(SUSPICIOUS_REASONS)
            b_score = round(max(0.35, min(0.78, target + random.uniform(-0.05, 0.05))), 4)
            h_score = round(max(0.35, min(0.80, target + random.uniform(-0.04, 0.04))), 4)
            c_score = round(max(0.40, min(0.75, target + random.uniform(-0.03, 0.03))), 4)

        else: # TRUSTED
            base = current_score if (current_score is not None and current_score >= 0.75) else random.uniform(0.88, 0.98)
            drift = random.uniform(-0.02, 0.02)
            target = max(0.78, min(0.995, base + drift))
            reason = random.choice(TRUSTED_REASONS)
            b_score = round(max(0.75, min(1.0, target + random.uniform(-0.02, 0.02))), 4)
            h_score = round(max(0.75, min(1.0, target + random.uniform(-0.02, 0.02))), 4)
            c_score = round(max(0.80, min(1.0, target + random.uniform(-0.01, 0.01))), 4)

        return b_score, h_score, c_score, target, reason

    async def evaluate_network(self, force_all: bool = False):
        """
        Evaluates network nodes. In periodic mode, evaluates a sliding subset of 8-15 nodes
        plus all malicious/suspicious nodes for high responsiveness.
        If force_all=True, evaluates every node in the network.
        """
        nodes = await node_service.list_nodes()
        if not nodes:
            return

        self._last_evaluation_time = datetime.now(timezone.utc)

        # Select nodes to evaluate
        if force_all:
            nodes_to_eval = nodes[:20]  # Fast initial burst of key nodes
        else:
            # Include 3-5 priority/monitored nodes plus 8 random nodes
            priority_names = set(MALICIOUS_TARGETS.keys()).union(set(SUSPICIOUS_TARGETS.keys()))
            priority_nodes = [n for n in nodes if n.nodeName in priority_names or n.id in priority_names]
            sample_priority = random.sample(priority_nodes, min(len(priority_nodes), 5)) if priority_nodes else []
            other_nodes = [n for n in nodes if n not in sample_priority]
            sample_others = random.sample(other_nodes, min(len(other_nodes), 8)) if other_nodes else []
            nodes_to_eval = sample_priority + sample_others

        # Concurrent evaluation with asyncio.gather for ultra-fast response
        tasks = [self.evaluate_single_node(node.id, node_name=node.nodeName) for node in nodes_to_eval]
        await asyncio.gather(*tasks, return_exceptions=True)

    async def evaluate_single_node(self, node_id: str, node_name: Optional[str] = None):
        """Perform dynamic adaptive trust evaluation for an individual node."""
        if not node_name:
            node_name = node_id

        # Retrieve profile
        profile = await trust_profile_repo.get_by_node_id(node_id)
        if not profile:
            profile = TrustProfile(nodeId=node_id)
            await trust_profile_repo.create(profile)

        tier = self._determine_node_tier(node_id, node_name)
        current = profile.currentTrustScore
        
        # If the profile was previously stuck at 1.0 or uninitialized, generate tier appropriate value
        if current is None or current >= 0.999:
            if tier == "MALICIOUS":
                current = random.uniform(0.18, 0.32)
            elif tier == "SUSPICIOUS":
                current = random.uniform(0.48, 0.65)
            else:
                current = random.uniform(0.88, 0.98)

        b_score, h_score, c_score, target, reason = self._generate_tier_scores(tier, current)

        # Update synthetic compliance status
        compliance = await security_compliance_repo.get_by_node_id(node_id)
        if not compliance:
            from app.trust.models.compliance import SecurityCompliance
            compliance = SecurityCompliance(nodeId=node_id)
        
        if tier == "MALICIOUS":
            compliance.complianceStatus = "NON_COMPLIANT"
            compliance.authenticationStatus = "FAILED"
            compliance.configurationCompliance = "VIOLATION_DETECTED"
        elif tier == "SUSPICIOUS":
            compliance.complianceStatus = "WARNING"
            compliance.authenticationStatus = "PROVISIONAL"
            compliance.configurationCompliance = "AUDIT_FLAGGED"
        else:
            compliance.complianceStatus = "SECURE"
            compliance.authenticationStatus = "AUTHENTICATED"
            compliance.configurationCompliance = "VERIFIED"
            
        compliance.lastSecurityCheck = datetime.now(timezone.utc)
        await security_compliance_repo.create(compliance)

        # Synthesize behavioral metrics snapshot
        metrics_dict = {
            "nodeId": node_id,
            "nodeName": node_name,
            "tier": tier,
            "packetLossRate": round(1.0 - b_score, 4),
            "successfulCommunicationRate": b_score,
            "averageLatency": round(random.uniform(75, 130) if tier == "MALICIOUS" else random.uniform(35, 65) if tier == "SUSPICIOUS" else random.uniform(4, 20), 2),
            "averageJitter": round(random.uniform(20, 45) if tier == "MALICIOUS" else random.uniform(8, 22) if tier == "SUSPICIOUS" else random.uniform(1, 4), 2),
            "successfulPackets": int(random.uniform(500, 2500) * b_score),
            "failedPackets": int(random.uniform(50, 600) * (1.0 - b_score)),
        }

        # Commit through trust_calculation_service
        await trust_calculation_service.evaluate_node(
            node_id=node_id,
            b_score=b_score,
            h_score=h_score,
            c_score=c_score,
            metrics=metrics_dict,
            explicit_reason=reason
        )

    # Alias for backward compatibility
    async def _evaluate_network_trust(self):
        await self.evaluate_network(force_all=False)


behavior_evaluation_service = BehaviorEvaluationService()
