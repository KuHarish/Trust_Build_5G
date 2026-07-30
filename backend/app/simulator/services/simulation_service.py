"""
TrustChain-5G Background Network Simulation Service.
Every 5 seconds, asynchronously updates simulated nodes' Signal Strength, Battery, Latency,
Bandwidth, Last Seen timestamp, and Node Status within realistic radio/hardware tolerances.
No attack vectors or complex routing interactions are generated in Module 1.
"""

import asyncio
import logging
import random
from datetime import datetime, timezone
from typing import Optional
from app.simulator.repositories.node_repository import node_repository
from app.simulator.models.node import SimulationNodeStatus

logger = logging.getLogger("trustchain.simulator.engine")


class SimulationService:
    """
    Asynchronous 5-second recurring telemetry simulation loop for registered virtual nodes.
    """
    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        self._running = False
        self._interval_seconds = 5.0

    async def start(self) -> None:
        """Start the background simulation daemon."""
        if self._running:
            return
        self._running = True
        # Ensure default baseline nodes exist
        await node_repository.initialize_default_nodes_if_empty()
        self._task = asyncio.create_task(self._simulation_loop())
        logger.info(f"TrustChain-5G Network Node Simulation Service started (Interval: {self._interval_seconds}s).")

    async def stop(self) -> None:
        """Terminate the simulation loop gracefully on server teardown."""
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("TrustChain-5G Network Node Simulation Service stopped gracefully.")

    async def _simulation_loop(self) -> None:
        """Main recurring simulation loop."""
        while self._running:
            try:
                await asyncio.sleep(self._interval_seconds)
                await self._update_simulation_telemetry()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error during network node simulation cycle: {str(e)}", exc_info=True)

    async def _update_simulation_telemetry(self) -> None:
        """Perform realistic random perturbations on every node's radio and physical parameters."""
        nodes = await node_repository.get_all()
        now = datetime.now(timezone.utc)
        modified_count = 0

        for node in nodes:
            # 1. Update Last Seen timestamp for non-offline nodes
            if node.status != SimulationNodeStatus.OFFLINE:
                node.lastSeen = now

            # 2. Realistic Signal Strength fluctuation (within -110 dBm to -40 dBm)
            signal_delta = random.uniform(-2.5, 2.5)
            new_signal = max(-115.0, min(-35.0, node.signalStrength + signal_delta))
            node.signalStrength = round(new_signal, 1)

            # 3. Realistic Battery consumption & regenerative solar/grid recharging
            # If battery drops below 15%, simulate docking/grid recharge
            if node.batteryLevel < 18.0:
                node.batteryLevel = round(min(100.0, node.batteryLevel + random.uniform(15.0, 35.0)), 1)
                if node.status == SimulationNodeStatus.OFFLINE:
                    node.status = SimulationNodeStatus.ONLINE
            else:
                battery_drain = random.uniform(0.05, 0.4)
                node.batteryLevel = round(max(0.0, node.batteryLevel - battery_drain), 1)

            # 4. Realistic Latency jitter (1.0ms to 45.0ms)
            latency_delta = random.uniform(-1.2, 1.2)
            new_latency = max(0.5, min(60.0, node.latency + latency_delta))
            node.latency = round(new_latency, 2)

            # 5. Bandwidth utilization variation (±3% of nominal capacity)
            bw_variation = random.uniform(0.97, 1.03)
            node.bandwidth = round(max(10.0, node.bandwidth * bw_variation), 1)

            # 6. Occasional realistic state transitions (approx 8% chance per cycle)
            if random.random() < 0.08:
                if node.status == SimulationNodeStatus.ONLINE:
                    # Occasional transition to BUSY or SLEEPING (for IoT/Drones)
                    node.status = random.choice([SimulationNodeStatus.BUSY, SimulationNodeStatus.SLEEPING])
                elif node.status in [SimulationNodeStatus.BUSY, SimulationNodeStatus.SLEEPING]:
                    # Wake up back to ONLINE
                    node.status = SimulationNodeStatus.ONLINE
                elif node.status == SimulationNodeStatus.MAINTENANCE and random.random() < 0.3:
                    node.status = SimulationNodeStatus.ONLINE

            node.updatedAt = now
            await node_repository.update(node)
            modified_count += 1

        logger.debug(f"Simulation Service cycle completed: updated telemetry for {modified_count} virtual 5G nodes.")


# Instantiate global simulation service engine
simulation_service = SimulationService()
