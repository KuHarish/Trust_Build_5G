"""
TrustChain-5G Module 2: Edge Server & Feature Extraction - Background Traffic Simulation Daemon.
Automatically pairs active ONLINE simulation nodes every 4 seconds, utilizing Haversine coordinate distances
to prioritize closer geographical node pairings while synthesizing realistic protocol parameters.
No attacks, Machine Learning, or Blockchain calculations are generated here.
"""
import asyncio
import random
import logging
from typing import List, Tuple, Optional
from app.simulator.services.node_service import NodeService as node_service
from app.edge.services.edge_service import edge_service
from app.edge.schemas.event import EventCreateRequest
from app.edge.models.event import EventProtocol, EventStatus
from app.edge.utils.feature_math import calculate_haversine_distance

logger = logging.getLogger("trustchain.edge.simulation")

class EdgeSimulationService:
    def __init__(self):
        self._is_running = False
        self._task: Optional[asyncio.Task] = None
        self._interval_sec = 4.0

    async def start(self):
        if self._is_running:
            return
        self._is_running = True
        self._task = asyncio.create_task(self._simulation_loop())
        logger.info("Module 2 Edge Server Traffic Simulation Daemon started (Interval: 4.0s).")

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
        logger.info("Module 2 Edge Server Traffic Simulation Daemon stopped.")

    async def _simulation_loop(self):
        while self._is_running:
            try:
                await asyncio.sleep(self._interval_sec)
                await self._generate_traffic_tick()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error during Edge Server traffic simulation tick: {e}", exc_info=True)

    async def _generate_traffic_tick(self):
        # 1. Fetch active ONLINE nodes from Sprint 1.1 simulation registry
        all_nodes = await node_service.list_nodes(status="ONLINE")
        nodes = all_nodes
        if len(nodes) < 2:
            # Need at least 2 online entities to avoid self-communication loops
            return

        # 2. Select between 2 to 6 communicating pairs per cycle
        pair_count = min(len(nodes) // 2, random.randint(2, 5))
        
        for _ in range(pair_count):
            source = random.choice(nodes)
            # Find candidate destinations excluding the source node itself
            candidates = [n for n in nodes if n.id != source.id and n.nodeName != source.nodeName]
            if not candidates:
                continue

            # Prefer nearby nodes via geographic GPS coordinate sorting
            candidates.sort(key=lambda dst: calculate_haversine_distance(
                source.latitude, source.longitude, dst.latitude, dst.longitude
            ))

            # Pick from the closest 3 candidates with higher probability
            top_near = candidates[:3]
            destination = random.choice(top_near)

            dist_km = calculate_haversine_distance(
                source.latitude, source.longitude, destination.latitude, destination.longitude
            )

            # Synthesize realistic RF parameters adjusted by distance
            base_bandwidth = random.uniform(20.0, 1000.0)
            bandwidth = max(20.0, round(base_bandwidth * (0.95 if dist_km < 50 else 0.75), 1))

            base_latency = random.uniform(5.0, 60.0)
            latency = max(5.0, min(100.0, round(base_latency + (dist_km * 0.05), 2)))

            base_signal = random.uniform(-85.0, -35.0)
            signal_strength = max(-100.0, min(-30.0, round(base_signal - (dist_km * 0.02), 1)))

            packet_size = float(random.choice([64, 128, 256, 512, 1024, 1500]))
            ttl = random.randint(32, 128)
            hop_count = max(1, min(15, random.randint(1, 4) + int(dist_km // 100)))

            protocol = random.choice(list(EventProtocol))
            
            # Outcome status: predominantly SUCCESS under nominal Sprint 1.2 bounds
            status_roll = random.random()
            if status_roll < 0.94:
                status = EventStatus.SUCCESS
            elif status_roll < 0.97:
                status = EventStatus.DELAYED
            else:
                status = EventStatus.RETRANSMIT

            req = EventCreateRequest(
                sourceNodeId=source.nodeName,
                destinationNodeId=destination.nodeName,
                protocol=protocol,
                packetSize=packet_size,
                hopCount=hop_count,
                ttl=ttl,
                bandwidth=bandwidth,
                latency=latency,
                jitter=round(random.uniform(0.2, 5.5), 2),
                signalStrength=signal_strength,
                status=status,
                metadata={"distance_km": dist_km, "sourceType": source.nodeType, "destType": destination.nodeType}
            )

            await edge_service.process_and_store_event(req)

edge_simulation_service = EdgeSimulationService()
