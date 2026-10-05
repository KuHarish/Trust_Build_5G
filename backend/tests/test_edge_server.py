"""
TrustChain-5G Module 2: Edge Server & Feature Extraction Automated Test Suite.
Verifies event ingestion, mathematical feature calculation, zero-to-one normalizations,
self-communication prevention, and geographical GPS distance calculations.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.edge.utils.feature_math import calculate_haversine_distance, normalize_min_max

client = TestClient(app)

def test_01_haversine_and_normalization_utils():
    # Test distance between New York (40.7128, -74.0060) and London (51.5074, -0.1278) -> approx 5570 km
    dist = calculate_haversine_distance(40.7128, -74.0060, 51.5074, -0.1278)
    assert 5500 < dist < 5600, f"Unexpected Haversine calculation: {dist}"
    
    # Test min-max normalization
    norm_val = normalize_min_max(50.0, min_val=0.0, max_val=100.0)
    assert norm_val == 0.5
    
    # Test clamping
    clamped_val = normalize_min_max(2000.0, min_val=0.0, max_val=100.0)
    assert clamped_val == 1.0

def test_02_initial_edge_statistics():
    response = client.get("/api/edge/statistics")
    assert response.status_code == 200
    data = response.json()
    assert "totalEvents" in data
    assert "eventsPerSecond" in data
    assert "averageLatency" in data

def test_03_submit_valid_communication_event():
    payload = {
        "sourceNodeId": "5G-NODE-ALPHA",
        "destinationNodeId": "5G-NODE-BETA",
        "protocol": "TCP",
        "packetSize": 1024,
        "bandwidth": 250.0,
        "latency": 12.5,
        "jitter": 1.2,
        "signalStrength": -55.0,
        "status": "SUCCESS",
        "metadata": {"test_run": True}
    }
    response = client.post("/api/edge/events", json=payload)
    assert response.status_code == 201
    res = response.json()
    assert res["success"] is True
    event_data = res["data"]
    assert event_data["sourceNodeId"] == "5G-NODE-ALPHA"
    assert event_data["destinationNodeId"] == "5G-NODE-BETA"
    assert event_data["payloadSize"] > 0
    assert event_data["transmissionTime"] > 0
    
    # Save ID for later tests
    pytest.test_event_id = event_data["eventId"]

def test_04_verify_extracted_node_features():
    # Both ALPHA and BETA should now exist in the extracted feature registry
    response = client.get("/api/edge/features/5G-NODE-ALPHA")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    feat = res["data"]
    assert feat["nodeId"] == "5G-NODE-ALPHA"
    assert feat["communicationCount"] >= 1
    assert feat["avgLatency"] == 12.5
    assert "norm_latency" in feat["normalizedFeatures"]
    assert 0.0 <= feat["normalizedFeatures"]["norm_latency"] <= 1.0
    assert 0.0 <= feat["normalizedFeatures"]["norm_signal"] <= 1.0

def test_05_list_and_filter_events():
    response = client.get("/api/edge/events?limit=10&protocol=TCP")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_count"] >= 1
    assert len(data["data"]) >= 1

def test_06_prevent_self_communication():
    payload = {
        "sourceNodeId": "SAME-NODE-LOOP",
        "destinationNodeId": "SAME-NODE-LOOP",
        "protocol": "UDP",
        "packetSize": 512
    }
    response = client.post("/api/edge/events", json=payload)
    # Pydantic field validator should reject self communication
    assert response.status_code in [400, 422]

def test_07_delete_event():
    if hasattr(pytest, "test_event_id"):
        event_id = pytest.test_event_id
        response = client.delete(f"/api/edge/events/{event_id}")
        assert response.status_code == 200
        
        # Confirm deleted
        check = client.get(f"/api/edge/events/{event_id}")
        assert check.status_code == 404
