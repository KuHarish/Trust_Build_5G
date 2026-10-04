import asyncio
import logging
import random
from datetime import datetime, timezone
from typing import Optional, List

from app.core.config import settings
from app.simulator.repositories.node_repository import node_repository
from app.simulator.models.node import SimulationNodeStatus
from app.simulator.models.simulation import (
    SimulationState, 
    SimulationEventType, 
    SimulationEvent,
    SimulationStatusResponse
)
from app.simulator.services.topology_generator import generate_topology
from app.simulator.services.traffic_generator import traffic_generator

logger = logging.getLogger("trustchain.simulator.engine")


class SimulationService:
    """
    Central Simulation Engine for TrustChain-5G.
    Manages Simulation State, Node Registry, Clock, and Lifecycle.
    """
    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        self._state: SimulationState = SimulationState.STOPPED
        self._speed: float = settings.SIMULATION_DEFAULT_SPEED
        self._interval_seconds: float = 5.0
        self._simulation_time: float = 0.0
        self._events: List[SimulationEvent] = []
        self._simulation_id: str = "sim_default"
        self._active_attacks: dict = {}

    def _add_event(self, event_type: SimulationEventType, metadata: dict = None, node_id: str = None):
        event = SimulationEvent(
            simulationId=self._simulation_id,
            eventType=event_type,
            simulationTime=self._simulation_time,
            nodeId=node_id,
            metadata=metadata or {}
        )
        self._events.append(event)
        # Keep recent events bounded to avoid memory leaks if no database is hooked up for events
        if len(self._events) > 1000:
            self._events = self._events[-1000:]
        return event

    async def _initialize_nodes(self):
        """Creates the deterministic simulation topology based on the seed."""
        # Clear existing nodes for a clean slate
        nodes = await node_repository.get_all()
        for node in nodes:
            await node_repository.delete(node.id)

        # Generate topology
        new_nodes = generate_topology()
        for node in new_nodes:
            await node_repository.create(node)
            # self._add_event(SimulationEventType.NODE_CREATED, node_id=node.id)
            
        logger.info(f"Initialized {len(new_nodes)} simulated nodes in the registry.")

    async def startSimulation(self) -> None:
        if not settings.ENABLE_NETWORK_SIMULATION:
            logger.warning("Simulation mode is disabled in settings.")
            return

        if self._state in [SimulationState.RUNNING, SimulationState.STARTING]:
            return

        self._state = SimulationState.STARTING
        
        # Check if we need to initialize
        nodes = await node_repository.get_all()
        if not nodes:
            await self._initialize_nodes()

        self._state = SimulationState.RUNNING
        self._add_event(SimulationEventType.SIMULATION_STARTED, {"speed": self._speed})
        self._task = asyncio.create_task(self._simulation_loop())
        logger.info(f"Simulation Engine started at {self._speed}x speed.")

    async def pauseSimulation(self) -> None:
        if self._state == SimulationState.RUNNING:
            self._state = SimulationState.PAUSED
            self._add_event(SimulationEventType.SIMULATION_PAUSED)
            logger.info("Simulation Engine paused.")

    async def resumeSimulation(self) -> None:
        if self._state == SimulationState.PAUSED:
            self._state = SimulationState.RUNNING
            self._add_event(SimulationEventType.SIMULATION_RESUMED, {"speed": self._speed})
            logger.info("Simulation Engine resumed.")

    async def stopSimulation(self) -> None:
        if self._state == SimulationState.STOPPED:
            return
            
        self._state = SimulationState.STOPPING
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
                
        self._state = SimulationState.STOPPED
        self._add_event(SimulationEventType.SIMULATION_STOPPED)
        logger.info("Simulation Engine stopped.")

    async def resetSimulation(self) -> None:
        await self.stopSimulation()
        self._simulation_time = 0.0
        self._events.clear()
        
        # Reset the topology
        await self._initialize_nodes()
        
        self._add_event(SimulationEventType.SIMULATION_RESET)
        logger.info("Simulation Engine reset successfully.")

    def getSimulationStatus(self) -> SimulationStatusResponse:
        return SimulationStatusResponse(
            enabled=settings.ENABLE_NETWORK_SIMULATION,
            state=self._state,
            speed=self._speed,
            nodeCount=0, # Will be filled by router
            activeNodes=0, # Will be filled by router
            simulationTime=self._simulation_time
        )
        
    async def getSimulationStatusAsync(self) -> SimulationStatusResponse:
        nodes = await node_repository.get_all()
        active_nodes = sum(1 for n in nodes if n.status == SimulationNodeStatus.ACTIVE)
        return SimulationStatusResponse(
            enabled=settings.ENABLE_NETWORK_SIMULATION,
            state=self._state,
            speed=self._speed,
            nodeCount=len(nodes),
            activeNodes=active_nodes,
            simulationTime=self._simulation_time
        )

    def get_events(self) -> List[SimulationEvent]:
        return self._events

    async def _simulation_loop(self) -> None:
        """Main recurring simulation loop."""
        while self._state in [SimulationState.RUNNING, SimulationState.PAUSED]:
            try:
                await asyncio.sleep(self._interval_seconds)
                if self._state == SimulationState.RUNNING:
                    # Advance simulation clock
                    self._simulation_time += self._interval_seconds * self._speed
                    await self._update_simulation_telemetry()
                    await self._generate_traffic()
                    self._cleanup_attacks()
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
            if node.batteryLevel < 18.0:
                node.batteryLevel = round(min(100.0, node.batteryLevel + random.uniform(15.0, 35.0)), 1)
                if node.status == SimulationNodeStatus.OFFLINE:
                    node.status = SimulationNodeStatus.ACTIVE
                    self._add_event(SimulationEventType.NODE_STATUS_CHANGED, {"new_status": node.status}, node_id=node.id)
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
                old_status = node.status
                if node.status == SimulationNodeStatus.ACTIVE:
                    node.status = random.choice([SimulationNodeStatus.INACTIVE, SimulationNodeStatus.MAINTENANCE])
                elif node.status in [SimulationNodeStatus.INACTIVE, SimulationNodeStatus.MAINTENANCE]:
                    node.status = SimulationNodeStatus.ACTIVE
                
                if old_status != node.status:
                    self._add_event(SimulationEventType.NODE_STATUS_CHANGED, {"old_status": old_status, "new_status": node.status}, node_id=node.id)

            node.updatedAt = now
            await node_repository.update(node)
            modified_count += 1

        # logger.debug(f"Simulation Service cycle completed: updated telemetry for {modified_count} virtual 5G nodes.")

    # Keeping old start() and stop() signatures for backward compatibility in main.py
    async def start(self) -> None:
        await self.startSimulation()

    async def stop(self) -> None:
        await self.stopSimulation()

    async def trigger_attack(self, attacker_node_id: str, attack_type: str, intensity: str, duration: int) -> dict:
        if not settings.ENABLE_NETWORK_SIMULATION or self._state != SimulationState.RUNNING:
            raise ValueError("Simulation is not running.")
            
        import uuid
        attack_event_id = str(uuid.uuid4())
        
        self._active_attacks[attacker_node_id] = {
            "attackEventId": attack_event_id,
            "attackerNodeId": attacker_node_id,
            "attackType": attack_type,
            "intensity": intensity,
            "duration": duration,
            "startTime": self._simulation_time
        }
        
        self._add_event(SimulationEventType.SIMULATION_STARTED, {
            "message": f"Attack {attack_type} triggered from compromised node {attacker_node_id}",
            "attackEventId": attack_event_id,
            "intensity": intensity
        }, node_id=attacker_node_id)
        
        return self._active_attacks[attacker_node_id]

    async def _generate_traffic(self) -> None:
        nodes = await node_repository.get_all()
        await traffic_generator.generate_tick(nodes, self._active_attacks, self._simulation_id, self._speed)

    def _cleanup_attacks(self) -> None:
        expired = []
        for node_id, attack in self._active_attacks.items():
            if (self._simulation_time - attack["startTime"]) >= attack["duration"]:
                expired.append(node_id)
                
        for node_id in expired:
            attack = self._active_attacks.pop(node_id)
            self._add_event(SimulationEventType.SIMULATION_STOPPED, {
                "message": f"Attack {attack['attackType']} ended on node {node_id}",
                "attackEventId": attack["attackEventId"]
            }, node_id=node_id)


# Instantiate global simulation service engine
simulation_service = SimulationService()
