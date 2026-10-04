import random
import uuid
from typing import List
from app.simulator.models.node import (
    SimulationNode, 
    SimulationNodeType, 
    SimulationNodeStatus,
    SimulationNodeRelationship
)
from app.core.config import settings

def _generate_ip(seed_val: int) -> str:
    return f"10.50.{seed_val // 255}.{seed_val % 255}"

def _generate_mac(seed_val: int) -> str:
    hex_str = f"{seed_val:06x}".zfill(12)
    return ":".join(hex_str[i:i+2] for i in range(0, 12, 2)).upper()

def generate_topology() -> List[SimulationNode]:
    """Generates a reproducible simulated network topology based on SIMULATION_SEED."""
    random.seed(settings.SIMULATION_SEED)
    
    total_nodes = settings.SIMULATION_NODE_COUNT
    # Suggested distribution: 
    # Core (2), Aggregation (4), Gateway (6), Edge Processing (12), Edge/IoT (36)
    
    # Calculate counts proportionally if node_count != 60
    core_count = max(1, int(total_nodes * (2/60)))
    agg_count = max(1, int(total_nodes * (4/60)))
    gw_count = max(1, int(total_nodes * (6/60)))
    edge_proc_count = max(1, int(total_nodes * (12/60)))
    iot_count = total_nodes - (core_count + agg_count + gw_count + edge_proc_count)
    if iot_count < 1:
        iot_count = 1

    nodes = []
    
    # 1. Generate Core Nodes
    core_nodes = []
    for i in range(core_count):
        nid = str(uuid.UUID(int=random.getrandbits(128)))
        node = SimulationNode(
            id=nid,
            nodeName=f"Core-Server-{i+1:02d}",
            nodeType=SimulationNodeType.CORE_SERVER,
            deviceCategory="5G Core Backend",
            status=SimulationNodeStatus.ACTIVE,
            ipAddress=_generate_ip(random.randint(1000, 9999)),
            macAddress=_generate_mac(random.randint(100000, 999999)),
            latitude=35.6 + random.uniform(-0.1, 0.1),
            longitude=139.6 + random.uniform(-0.1, 0.1),
            signalStrength=-40.0,
            bandwidth=10000.0,
            latency=1.0,
            batteryLevel=100.0,
            firmwareVersion="v5.0-core"
        )
        nodes.append(node)
        core_nodes.append(node)
        
    # 2. Generate Aggregation Nodes
    agg_nodes = []
    for i in range(agg_count):
        nid = str(uuid.UUID(int=random.getrandbits(128)))
        parent = random.choice(core_nodes)
        node = SimulationNode(
            id=nid,
            nodeName=f"Aggregation-Router-{i+1:02d}",
            nodeType=SimulationNodeType.AGGREGATION,
            deviceCategory="Regional Aggregator",
            status=SimulationNodeStatus.ACTIVE,
            ipAddress=_generate_ip(random.randint(1000, 9999)),
            macAddress=_generate_mac(random.randint(100000, 999999)),
            latitude=35.6 + random.uniform(-0.2, 0.2),
            longitude=139.6 + random.uniform(-0.2, 0.2),
            signalStrength=-50.0,
            bandwidth=5000.0,
            latency=2.5,
            batteryLevel=100.0,
            firmwareVersion="v3.1-agg",
            relationships=[SimulationNodeRelationship(targetId=parent.id, relationshipType="CONNECTED_TO")]
        )
        nodes.append(node)
        agg_nodes.append(node)

    # 3. Generate Gateway Nodes
    gw_nodes = []
    for i in range(gw_count):
        nid = str(uuid.UUID(int=random.getrandbits(128)))
        parent = random.choice(agg_nodes)
        node = SimulationNode(
            id=nid,
            nodeName=f"Edge-Gateway-{i+1:02d}",
            nodeType=SimulationNodeType.GATEWAY,
            deviceCategory="Local Edge Gateway",
            status=SimulationNodeStatus.ACTIVE,
            ipAddress=_generate_ip(random.randint(1000, 9999)),
            macAddress=_generate_mac(random.randint(100000, 999999)),
            latitude=35.6 + random.uniform(-0.3, 0.3),
            longitude=139.6 + random.uniform(-0.3, 0.3),
            signalStrength=-60.0,
            bandwidth=2000.0,
            latency=5.0,
            batteryLevel=100.0,
            firmwareVersion="v2.2-gw",
            relationships=[SimulationNodeRelationship(targetId=parent.id, relationshipType="CONNECTED_TO")]
        )
        nodes.append(node)
        gw_nodes.append(node)

    # 4. Generate Edge Processing Nodes
    proc_nodes = []
    for i in range(edge_proc_count):
        nid = str(uuid.UUID(int=random.getrandbits(128)))
        parent = random.choice(gw_nodes)
        node = SimulationNode(
            id=nid,
            nodeName=f"MEC-Processor-{i+1:02d}",
            nodeType=SimulationNodeType.EDGE_PROCESSING,
            deviceCategory="Multi-access Edge Compute",
            status=SimulationNodeStatus.ACTIVE,
            ipAddress=_generate_ip(random.randint(1000, 9999)),
            macAddress=_generate_mac(random.randint(100000, 999999)),
            latitude=35.6 + random.uniform(-0.4, 0.4),
            longitude=139.6 + random.uniform(-0.4, 0.4),
            signalStrength=-65.0,
            bandwidth=1000.0,
            latency=8.0,
            batteryLevel=95.0,
            firmwareVersion="v1.8-mec",
            relationships=[SimulationNodeRelationship(targetId=parent.id, relationshipType="CONNECTED_TO")]
        )
        nodes.append(node)
        proc_nodes.append(node)

    # 5. Generate Edge / IoT Nodes
    for i in range(iot_count):
        nid = str(uuid.UUID(int=random.getrandbits(128)))
        parent = random.choice(proc_nodes)
        
        # 10% chance to be INACTIVE initially
        status = SimulationNodeStatus.INACTIVE if random.random() < 0.1 else SimulationNodeStatus.ACTIVE
        
        node = SimulationNode(
            id=nid,
            nodeName=f"IoT-Sensor-{i+1:03d}",
            nodeType=SimulationNodeType.EDGE_IOT,
            deviceCategory="Field Sensor",
            status=status,
            ipAddress=_generate_ip(random.randint(1000, 9999)),
            macAddress=_generate_mac(random.randint(100000, 999999)),
            latitude=35.6 + random.uniform(-0.5, 0.5),
            longitude=139.6 + random.uniform(-0.5, 0.5),
            signalStrength=random.uniform(-90.0, -50.0),
            bandwidth=random.uniform(5.0, 50.0),
            latency=random.uniform(10.0, 50.0),
            batteryLevel=random.uniform(20.0, 100.0),
            firmwareVersion="v1.0-iot",
            relationships=[SimulationNodeRelationship(targetId=parent.id, relationshipType="CONNECTED_TO")]
        )
        nodes.append(node)

    return nodes
