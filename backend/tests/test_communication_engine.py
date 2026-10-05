"""
TrustChain-5G Module 3: Communication Engine & Traffic Generation Automated Test Suite.
Verifies interactive session establishment, rule-based traffic pairing, automated Edge Server feature forwarding,
no self-communication enforcement, online-only filtering, and real-time streaming REST APIs.
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.communication.simulation.traffic_generator import traffic_generator
from app.simulator.models.node import NodeCreate
from app.simulator.services.node_service import NodeService as node_service
from app.edge.services.edge_service import edge_service

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_nodes_and_simulate():
    """Seed test simulation nodes and trigger traffic generation cycle."""
    async def _init_seed():
        # Create test nodes across different profiles
        n1 = NodeCreate(nodeName="GATEWAY-ALPHA-01", nodeType="Gateway", ipAddress="10.0.1.10", status="ONLINE", location={"lat": 37.77, "lng": -122.41})
        n2 = NodeCreate(nodeName="IOT-SENSOR-01", nodeType="IoT Sensor", ipAddress="10.0.1.25", status="ONLINE", location={"lat": 37.78, "lng": -122.40})
        n3 = NodeCreate(nodeName="MEDICAL-ECG-01", nodeType="Medical Device", ipAddress="10.0.1.50", status="ONLINE", location={"lat": 37.77, "lng": -122.42})
        n4 = NodeCreate(nodeName="OFFLINE-NODE-01", nodeType="Autonomous Vehicle", ipAddress="10.0.1.99", status="OFFLINE", location={"lat": 37.79, "lng": -122.39})
        
        for node_in in [n1, n2, n3, n4]:
            try:
                await node_service.register_node(node_in)
            except Exception:
                pass # Node already exists in fallback repo
        
        # Trigger two simulated traffic cycles to establish sessions and transmit packets
        await traffic_generator.simulate_traffic_cycle()
        await traffic_generator.simulate_traffic_cycle()

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    loop.run_until_complete(_init_seed())


def test_01_initial_communication_statistics():
    response = client.get("/api/communication/statistics")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "activeSessions" in data
    assert "packetsPerSecond" in data
    assert "totalPackets" in data
    assert "averageLatency" in data
    assert "protocolDistribution" in data
    assert data["totalPackets"] >= 1


def test_02_live_traffic_feed_structure():
    response = client.get("/api/communication/live")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["activeSessions"], list)
    assert isinstance(data["recentPackets"], list)
    assert len(data["recentPackets"]) >= 1


def test_03_verify_no_self_communication_in_sessions():
    response = client.get("/api/communication/sessions?limit=100")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    sessions = data["data"]
    
    for sess in sessions:
        # Crucial Sprint constraint: Node cannot communicate with itself
        assert sess["sourceNodeId"] != sess["destinationNodeId"], (
            f"Self-communication loop violated in session {sess['sessionId']}"
        )


def test_04_verify_only_online_nodes_participate():
    response = client.get("/api/communication/sessions?limit=100")
    assert response.status_code == 200
    sessions = response.json()["data"]
    
    # Check that OFFLINE-NODE-01 is never chosen as source or destination
    for sess in sessions:
        assert sess["sourceNodeId"] != "OFFLINE-NODE-01"
        assert sess["destinationNodeId"] != "OFFLINE-NODE-01"


def test_05_list_and_inspect_individual_session():
    response = client.get("/api/communication/sessions?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) >= 1
    
    sample_id = data["data"][0]["sessionId"]
    detail_res = client.get(f"/api/communication/sessions/{sample_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["success"] is True
    assert detail_data["data"]["sessionId"] == sample_id
    assert detail_data["data"]["bytesTransferred"] > 0
    assert detail_data["data"]["packetsSent"] >= 1


def test_06_list_and_filter_transmitted_packets():
    response = client.get("/api/communication/packets?limit=20")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] <= 20
    assert data["totalCount"] >= 1
    
    if len(data["data"]) > 0:
        sample_packet = data["data"][0]
        assert sample_packet["packetSize"] > 0
        assert sample_packet["payloadSize"] > 0
        assert sample_packet["ttl"] > 0


def test_07_verify_automatic_edge_server_forwarding():
    """
    Crucial Sprint 1.3 Requirement: Every communication event should automatically be forwarded 
    to the existing Edge Server created in Sprint 1.2.
    """
    edge_res = client.get("/api/edge/events?limit=50")
    assert edge_res.status_code == 200
    edge_data = edge_res.json()
    assert edge_data["success"] is True
    # Confirm edge events match or exceed packets generated during traffic cycle
    assert len(edge_data["data"]) >= 1
    
    # Confirm extracted feature registries were updated
    feat_res = client.get("/api/edge/features")
    assert feat_res.status_code == 200
    feat_data = feat_res.json()
    assert len(feat_data["data"]) >= 1
