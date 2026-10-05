"""
TrustChain-5G Module 1 Network Node Management Test Suite.
Verifies CRUD operations, field validation (IP, MAC, coordinates, duplicate names), and simulation KPI statistics.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_01_initial_statistics_and_default_population():
    """Verify that starting the test client initializes default nodes and statistics calculation."""
    res = client.get("/api/nodes/statistics")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["success"] is True
    stats = body["data"]
    assert "totalNodes" in stats
    assert "onlineNodes" in stats
    assert "offlineNodes" in stats
    assert "nodeTypes" in stats
    assert "averageSignalStrength" in stats

def test_02_register_new_node_success():
    """Verify registering a valid virtual 5G simulation node."""
    payload = {
        "nodeName": "Test-Unit-GNB-01",
        "nodeType": "Gateway",
        "deviceCategory": "Automated Test Base Station",
        "status": "ONLINE",
        "ipAddress": "192.168.50.10",
        "macAddress": "00:AA:BB:CC:DD:EE",
        "latitude": 35.6895,
        "longitude": 139.6917,
        "signalStrength": -50.0,
        "bandwidth": 1000.0,
        "latency": 2.5,
        "batteryLevel": 100.0
    }
    res = client.post("/api/nodes", json=payload)
    assert res.status_code == 201, res.text
    data = res.json()["data"]
    assert data["nodeName"] == payload["nodeName"]
    assert data["macAddress"] == payload["macAddress"].upper()
    assert "id" in data
    assert data["status"] == "ONLINE"

def test_03_duplicate_node_name_rejection():
    """Verify attempting to register a node with a duplicate name fails with 400."""
    payload = {
        "nodeName": "Test-Unit-GNB-01",  # Same as above
        "nodeType": "Edge Device",
        "ipAddress": "192.168.50.11",
        "macAddress": "11:AA:BB:CC:DD:FF",
        "latitude": 30.0,
        "longitude": 130.0
    }
    res = client.post("/api/nodes", json=payload)
    assert res.status_code == 400
    assert "Duplicate Node Name" in res.text

def test_04_field_validation_errors():
    """Verify invalid IP Address, MAC Address, or Coordinates are rejected with 422 Unprocessable Entity."""
    # Invalid IP
    res_ip = client.post("/api/nodes", json={
        "nodeName": "Invalid-IP-Node", "nodeType": "Smartphone", "ipAddress": "999.999.999.999",
        "macAddress": "00:11:22:33:44:55", "latitude": 0.0, "longitude": 0.0
    })
    assert res_ip.status_code == 422

    # Invalid MAC
    res_mac = client.post("/api/nodes", json={
        "nodeName": "Invalid-MAC-Node", "nodeType": "Smartphone", "ipAddress": "10.0.0.1",
        "macAddress": "NOT-A-MAC-ADDRESS", "latitude": 0.0, "longitude": 0.0
    })
    assert res_mac.status_code == 422

    # Out of bounds Latitude
    res_lat = client.post("/api/nodes", json={
        "nodeName": "Invalid-Lat-Node", "nodeType": "Smartphone", "ipAddress": "10.0.0.2",
        "macAddress": "00:11:22:33:44:66", "latitude": 150.0, "longitude": 0.0
    })
    assert res_lat.status_code == 422

def test_05_list_nodes_and_filtering():
    """Verify searching and filtering node listings."""
    res = client.get("/api/nodes?search=Test-Unit-GNB-01")
    assert res.status_code == 200
    body = res.json()
    assert body["total_count"] >= 1
    node_id = body["data"][0]["id"]

    # Test GET /{id}
    res_single = client.get(f"/api/nodes/{node_id}")
    assert res_single.status_code == 200
    assert res_single.json()["data"]["id"] == node_id

def test_06_update_and_patch_node_status():
    """Verify modifying attributes and patching status of a node."""
    res_list = client.get("/api/nodes?search=Test-Unit-GNB-01")
    node = res_list.json()["data"][0]
    node_id = node["id"]

    # Patch Status to SLEEPING
    res_patch = client.patch(f"/api/nodes/{node_id}/status", json={"status": "SLEEPING"})
    assert res_patch.status_code == 200
    assert res_patch.json()["data"]["status"] == "SLEEPING"

    # Put Update
    res_put = client.put(f"/api/nodes/{node_id}", json={
        "signalStrength": -60.5,
        "batteryLevel": 85.0
    })
    assert res_put.status_code == 200
    assert res_put.json()["data"]["signalStrength"] == -60.5

def test_07_delete_node():
    """Verify deletion of an existing node."""
    res_list = client.get("/api/nodes?search=Test-Unit-GNB-01")
    node_id = res_list.json()["data"][0]["id"]

    res_del = client.delete(f"/api/nodes/{node_id}")
    assert res_del.status_code == 200

    # Ensure it is removed
    res_check = client.get(f"/api/nodes/{node_id}")
    assert res_check.status_code == 404
