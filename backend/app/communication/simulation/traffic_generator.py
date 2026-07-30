"""
TrustChain-5G Module 3: Intelligent Network Traffic & Routing Generator.
Enforces domain rules (no self-talk, Gateway scaling, IoT/Medical/Vehicle device affinity, Haversine proximity),
generates multi-protocol packet frames, and automatically feeds every transmitted event to the Module 2 Edge Server.
"""
import math
import random
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.simulator.models.node import SimulationNode, SimulationNodeStatus, SimulationNodeType
from app.edge.models.event import EventProtocol, EventStatus
from app.edge.schemas.event import EventCreateRequest
from app.edge.services.edge_service import edge_service
from app.edge.utils.feature_math import calculate_haversine_distance
from app.communication.models.session import CommunicationSession, SessionStatus, TrafficType
from app.communication.models.packet import Packet
from app.communication.repositories.communication_repository import communication_repository

logger = logging.getLogger("trustchain.communication.traffic")


class TrafficGenerator:
    def __init__(self, max_sessions_per_node: int = 5):
        self.max_sessions_per_node = max_sessions_per_node
        self._seq_counters: Dict[str, int] = {}

    async def select_compatible_target(self, source: SimulationNode, online_nodes: List[SimulationNode]) -> Optional[SimulationNode]:
        """
        Enforces 5G topology rules:
        - Must be ONLINE
        - Cannot communicate with self
        - Obey concurrent session capacity limits (Gateways handle up to 30 sessions, devices handle up to 5)
        - Prefer nearby nodes using Haversine distance calculation
        - Obey device affinity rules (IoT -> Gateways, Medical -> Edge, Vehicles -> Vehicles/Gateways)
        """
        candidates = [n for n in online_nodes if n.id != source.id and n.nodeName != source.nodeName and n.status == SimulationNodeStatus.ONLINE]
        if not candidates:
            return None

        # Filter out nodes over their simultaneous session limit
        available_candidates = []
        for n in candidates:
            active_sessions = await communication_repository.list_active_sessions_by_node(n.nodeName)
            limit = 30 if n.nodeType == SimulationNodeType.GATEWAY else self.max_sessions_per_node
            if len(active_sessions) < limit:
                available_candidates.append(n)

        if not available_candidates:
            return None

        # Apply device affinity preference rules
        affinity_candidates = []
        if source.nodeType == SimulationNodeType.IOT_SENSOR:
            affinity_candidates = [n for n in available_candidates if n.nodeType == SimulationNodeType.GATEWAY]
        elif source.nodeType == SimulationNodeType.MEDICAL_DEVICE:
            affinity_candidates = [n for n in available_candidates if n.nodeType in (SimulationNodeType.EDGE_DEVICE, SimulationNodeType.GATEWAY)]
        elif source.nodeType == SimulationNodeType.AUTONOMOUS_VEHICLE:
            affinity_candidates = [n for n in available_candidates if n.nodeType in (SimulationNodeType.AUTONOMOUS_VEHICLE, SimulationNodeType.GATEWAY, SimulationNodeType.EDGE_DEVICE)]

        # Fallback to any available online node if preferred affinity peers aren't currently available
        pool = affinity_candidates if affinity_candidates else available_candidates

        # Prefer nearby nodes via Haversine distance ranking
        pool_with_dist = [
            (n, calculate_haversine_distance(source.latitude, source.longitude, n.latitude, n.longitude))
            for n in pool
        ]
        pool_with_dist.sort(key=lambda x: x[1])

        # Pick randomly among the closest 3 neighbors to simulate dynamic multi-path routing
        top_closest = [x[0] for x in pool_with_dist[:3]]
        return random.choice(top_closest) if top_closest else None

    async def generate_session(self, source: SimulationNode, target: SimulationNode) -> CommunicationSession:
        """
        Instantiates a realistic communication session with appropriate protocol and traffic type profiling.
        """
        # Select appropriate protocol & profile based on source node type
        if source.nodeType == SimulationNodeType.IOT_SENSOR:
            protocol = random.choice([EventProtocol.MQTT, EventProtocol.COAP, EventProtocol.UDP])
            traffic = random.choice([TrafficType.SENSOR_DATA, TrafficType.TELEMETRY, TrafficType.HEARTBEAT])
        elif source.nodeType == SimulationNodeType.MEDICAL_DEVICE:
            protocol = random.choice([EventProtocol.HTTPS, EventProtocol.TCP])
            traffic = random.choice([TrafficType.TELEMETRY, TrafficType.HEARTBEAT, TrafficType.CONTROL_MESSAGES])
        elif source.nodeType == SimulationNodeType.AUTONOMOUS_VEHICLE:
            protocol = random.choice([EventProtocol.UDP, EventProtocol.TCP, EventProtocol.HTTPS])
            traffic = random.choice([TrafficType.TELEMETRY, TrafficType.STATUS_UPDATES, TrafficType.CONTROL_MESSAGES])
        else:
            protocol = random.choice([EventProtocol.HTTP, EventProtocol.HTTPS, EventProtocol.TCP, EventProtocol.ICMP])
            traffic = random.choice([TrafficType.FILE_TRANSFER, TrafficType.STATUS_UPDATES, TrafficType.TELEMETRY])

        dist = calculate_haversine_distance(source.latitude, source.longitude, target.latitude, target.longitude)
        est_latency = round(max(1.5, min(45.0, dist * 0.12 + random.uniform(1.0, 5.0))), 2)
        est_bw = round(max(20.0, min(1000.0, (source.bandwidth + target.bandwidth) / 2.0 * random.uniform(0.8, 1.1))), 2)
        signal = round((source.signalStrength + target.signalStrength) / 2.0, 2)

        session = CommunicationSession(
            sourceNodeId=source.nodeName,
            destinationNodeId=target.nodeName,
            protocol=protocol,
            trafficType=traffic,
            averageLatency=est_latency,
            averageBandwidth=est_bw,
            signalStrength=signal,
            metadata={"sourceType": source.nodeType.value, "destinationType": target.nodeType.value, "haversineKm": round(dist, 2)}
        )

        self._seq_counters[session.sessionId] = 0
        return await communication_repository.insert_session(session)

    async def generate_packet_for_session(self, session: CommunicationSession, source: SimulationNode, target: SimulationNode) -> Packet:
        """
        Synthesizes a realistic packet frame, updates cumulative session metrics, and forwards directly to Edge Server APIs.
        """
        self._seq_counters[session.sessionId] = self._seq_counters.get(session.sessionId, 0) + 1
        seq_num = self._seq_counters[session.sessionId]

        # Sizing rules according to protocol and payload characterization
        if session.protocol in (EventProtocol.MQTT, EventProtocol.COAP, EventProtocol.ICMP):
            pkt_size = random.randint(64, 512)
        elif session.trafficType == TrafficType.FILE_TRANSFER:
            pkt_size = random.randint(1024, 8192)
        else:
            pkt_size = random.randint(256, 1500)

        payload_size = max(1, int(pkt_size * 0.82))

        # Dynamic physical telemetry variations
        dist = calculate_haversine_distance(source.latitude, source.longitude, target.latitude, target.longitude)
        latency = round(max(1.0, dist * 0.1 + random.uniform(0.5, 6.0)), 2)
        bandwidth = round(max(10.0, session.averageBandwidth * random.uniform(0.9, 1.05)), 2)

        packet = Packet(
            sessionId=session.sessionId,
            sourceNodeId=session.sourceNodeId,
            destinationNodeId=session.destinationNodeId,
            sequenceNumber=seq_num,
            packetSize=pkt_size,
            payloadSize=payload_size,
            protocol=session.protocol,
            trafficType=session.trafficType,
            ttl=random.choice([64, 128]),
            latency=latency,
            bandwidth=bandwidth,
            status=EventStatus.SUCCESS,
            metadata={"sequence": seq_num, "distanceKm": round(dist, 2)}
        )

        # 1. Save packet into Communication Engine repository
        await communication_repository.insert_packet(packet)

        # 2. Update parent communication session metrics
        session.packetsSent += 1
        if packet.status == EventStatus.SUCCESS:
            session.packetsReceived += 1
            session.bytesTransferred += payload_size
        
        # Roll running averages on session
        session.averageLatency = round((session.averageLatency * 0.8) + (latency * 0.2), 2)
        session.averageBandwidth = round((session.averageBandwidth * 0.8) + (bandwidth * 0.2), 2)
        await communication_repository.update_session(session)

        # 3. CRITICAL: Automatically forward communication event to existing Sprint 1.2 Edge Server!
        # Do NOT bypass Sprint 1.2 feature extraction APIs.
        try:
            edge_req = EventCreateRequest(
                sourceNodeId=session.sourceNodeId,
                destinationNodeId=session.destinationNodeId,
                protocol=session.protocol,
                packetSize=packet.packetSize,
                payloadSize=packet.payloadSize,
                hopCount=max(1, int(packet.ttl / 15)),
                ttl=packet.ttl,
                bandwidth=packet.bandwidth,
                latency=packet.latency,
                jitter=round(random.uniform(0.1, 2.8), 2),
                signalStrength=session.signalStrength,
                status=packet.status,
                metadata={"sessionId": session.sessionId, "packetId": packet.packetId, "trafficType": session.trafficType.value}
            )
            await edge_service.process_and_store_event(edge_req)
        except Exception as e:
            logger.error(f"Failed to forward communication packet {packet.packetId} to Edge Server: {e}")

        return packet


traffic_generator = TrafficGenerator()
