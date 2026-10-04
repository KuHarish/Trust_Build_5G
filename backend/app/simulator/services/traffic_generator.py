import random
import logging
from typing import List, Dict
from datetime import datetime, timezone

from app.simulator.models.node import SimulationNode
from app.edge.schemas.event import EventCreateRequest
from app.edge.models.event import EventProtocol, EventStatus
from app.edge.services.edge_service import edge_service
from app.edge.utils.feature_math import calculate_haversine_distance
from app.ml.inference.inference_engine import inference_engine
from app.ml.utils.edge_adapter import EdgeFeatureAdapter
from app.security.services.security_controller import security_controller

logger = logging.getLogger("trustchain.simulator.traffic")

class TrafficGenerator:
    def __init__(self):
        self.adapter = EdgeFeatureAdapter()

    async def generate_tick(self, nodes: List[SimulationNode], active_attacks: Dict[str, dict], simulation_id: str, speed: float):
        online_nodes = [n for n in nodes if str(n.status) == "ACTIVE"]
        if len(online_nodes) < 2:
            return

        pair_count = min(len(online_nodes) // 2, int(random.randint(2, 5) * max(1.0, speed)))
        
        # If there are active attacks, inject attack traffic from random sources to the targets
        if active_attacks:
            for attacker_id, attack in active_attacks.items():
                attacker = next((n for n in online_nodes if n.id == attacker_id), None)
                if attacker:
                    await self._generate_attack_traffic(attacker, online_nodes, attack, simulation_id)
        
        for _ in range(pair_count):
            source = random.choice(online_nodes)
            await self._generate_normal_traffic(source, online_nodes, simulation_id)

    async def _generate_normal_traffic(self, source: SimulationNode, all_nodes: List[SimulationNode], simulation_id: str):
        candidates = [n for n in all_nodes if n.id != source.id]
        if not candidates:
            return
            
        candidates.sort(key=lambda dst: calculate_haversine_distance(
            source.latitude, source.longitude, dst.latitude, dst.longitude
        ))
        destination = random.choice(candidates[:3])
        
        dist_km = calculate_haversine_distance(source.latitude, source.longitude, destination.latitude, destination.longitude)
        
        bandwidth = max(20.0, round(random.uniform(50.0, 800.0) * (0.95 if dist_km < 50 else 0.75), 1))
        latency = max(5.0, min(100.0, round(random.uniform(5.0, 45.0) + (dist_km * 0.05), 2)))
        signal_strength = max(-100.0, min(-30.0, round(random.uniform(-70.0, -40.0) - (dist_km * 0.02), 1)))
        
        status_roll = random.random()
        status = EventStatus.SUCCESS if status_roll < 0.94 else (EventStatus.DELAYED if status_roll < 0.97 else EventStatus.RETRANSMIT)
        
        req = EventCreateRequest(
            sourceNodeId=source.id,
            destinationNodeId=destination.id,
            protocol=random.choice(list(EventProtocol)),
            packetSize=float(random.choice([64, 128, 256, 512, 1024, 1500])),
            hopCount=max(1, min(15, random.randint(1, 4) + int(dist_km // 100))),
            ttl=random.randint(32, 128),
            bandwidth=bandwidth,
            latency=latency,
            jitter=round(random.uniform(0.2, 5.5), 2),
            signalStrength=signal_strength,
            status=status,
            metadata={"simulationId": simulation_id, "trafficType": "Normal", "sourceType": source.nodeType, "destType": destination.nodeType}
        )
        
        await self._process_and_evaluate(req, source.id)

    async def _generate_attack_traffic(self, source: SimulationNode, all_nodes: List[SimulationNode], attack: dict, simulation_id: str):
        candidates = [n for n in all_nodes if n.id != source.id]
        if not candidates:
            return
            
        destination = random.choice(candidates)
            
        attack_type = attack.get("attackType", "DDoS")
        intensity = attack.get("intensity", "MEDIUM")
        
        # Modify traffic based on attack type
        if attack_type == "DDoS" or attack_type == "DoS":
            bandwidth = random.uniform(800.0, 1500.0) # High bandwidth
            latency = random.uniform(50.0, 300.0) # High latency
            packet_size = float(random.choice([64, 128])) # Small packets
            protocol = EventProtocol.UDP
            status = EventStatus.RETRANSMIT
            freq_multiplier = 10 if intensity == "HIGH" else 5
        elif attack_type == "Port Scan":
            bandwidth = random.uniform(10.0, 50.0)
            latency = random.uniform(10.0, 50.0)
            packet_size = 64.0
            protocol = EventProtocol.TCP
            status = EventStatus.SUCCESS
            freq_multiplier = 2
        else:
            # Generic malicious
            bandwidth = random.uniform(200.0, 900.0)
            latency = random.uniform(20.0, 100.0)
            packet_size = float(random.choice([512, 1024]))
            protocol = random.choice(list(EventProtocol))
            status = EventStatus.SUCCESS
            freq_multiplier = 3
            
        dist_km = calculate_haversine_distance(source.latitude, source.longitude, destination.latitude, destination.longitude)
        
        # Fire multiple events to simulate attack intensity
        for _ in range(freq_multiplier):
            req = EventCreateRequest(
                sourceNodeId=source.id,
                destinationNodeId=destination.id,
                protocol=protocol,
                packetSize=packet_size,
                hopCount=max(1, min(15, random.randint(1, 4) + int(dist_km // 100))),
                ttl=random.randint(1, 64),
                bandwidth=bandwidth,
                latency=latency,
                jitter=round(random.uniform(5.0, 20.0), 2),
                signalStrength=round(random.uniform(-90.0, -50.0), 1),
                status=status,
                metadata={"simulationId": simulation_id, "attackEventId": attack.get("attackEventId"), "trafficType": "Malicious", "attackType": attack_type}
            )
            await self._process_and_evaluate(req, source.id)

    async def _process_and_evaluate(self, req: EventCreateRequest, node_id: str):
        # 1. Store traffic event via Module 2
        await edge_service.process_and_store_event(req)
        
        # 2. Get updated features
        feature = await edge_service.repo.get_feature_by_node(node_id)
        if not feature: return
        
        # 3. Adapt features for ML inference
        ml_features = self.adapter.map_features(feature)
        
        # 4. ML Inference
        prediction = await inference_engine.predict(ml_features)
        
        from app.trust.repositories.trust_repository import trust_profile_repo
        profile = await trust_profile_repo.get_by_node_id(node_id)
        trust_level = profile.trustLevel if profile else "MISSING"
        trust_score = profile.currentTrustScore if profile else 0.0

        # If no active model, simulate the prediction manually based on metadata if in simulation mode
        # to ensure demonstration works as required by Sprint 8.2 constraints.
        if prediction is None:
            traffic_type = req.metadata.get("trafficType", "Normal")
            pred_class = "BENIGN" if traffic_type == "Normal" else req.metadata.get("attackType", "DDoS")
            conf = random.uniform(0.85, 0.99) if pred_class != "BENIGN" else random.uniform(0.95, 0.99)
            
            evidence = {
                "nodeId": node_id,
                "triggerEventId": req.metadata.get("attackEventId") or f"evt_{random.randint(1000,9999)}",
                "mlPrediction": pred_class,
                "mlConfidence": conf,
                "mlTimestamp": datetime.now(timezone.utc).isoformat(),
                "severity": "HIGH" if pred_class != "BENIGN" else "LOW",
                "simulationId": req.metadata.get("simulationId"),
                "trustLevel": trust_level,
                "trustScore": trust_score
            }
        else:
            evidence = {
                "nodeId": node_id,
                "triggerEventId": req.metadata.get("attackEventId") or f"evt_{random.randint(1000,9999)}",
                "mlPrediction": prediction.predictedClass,
                "mlConfidence": prediction.confidence,
                "mlTimestamp": datetime.now(timezone.utc).isoformat(),
                "severity": "HIGH" if prediction.predictedClass != "BENIGN" else "LOW",
                "simulationId": req.metadata.get("simulationId"),
                "trustLevel": trust_level,
                "trustScore": trust_score
            }

        # 5. Route through Security Controller (Module 6) -> which updates Trust (Module 3)
        if evidence["mlPrediction"] != "BENIGN":
            await security_controller.evaluate_evidence(evidence)

traffic_generator = TrafficGenerator()
