"""
TrustChain-5G Sprint 1.4 - Real-Time Network Monitoring & System Integration Automated Test Suite.
Verifies centralized KPI aggregation, dynamic system health calculations (Healthy, Warning, Critical),
live event ticker compilation, interactive simulation controls, and multi-format CSV/JSON log exports.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_01_dashboard_overview_metrics():
    response = client.get("/api/dashboard/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    overview = data["data"]
    assert "totalNodes" in overview
    assert "onlineNodes" in overview
    assert "activeSessions" in overview
    assert "packetsPerSecond" in overview
    assert "featureExtractionRate" in overview
    assert overview["totalNodes"] >= 0


def test_02_dashboard_health_diagnostics():
    response = client.get("/api/dashboard/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    health = data["data"]
    assert health["status"] in ["Healthy", "Warning", "Critical"]
    assert 0.0 <= health["healthScore"] <= 100.0
    assert "criteria" in health
    assert isinstance(health["criteria"]["details"], list)
    assert len(health["criteria"]["details"]) >= 1


def test_03_dashboard_live_telemetry_feed():
    response = client.get("/api/dashboard/live")
    assert response.status_code == 200
    live = response.json()
    assert live["success"] is True
    assert "overview" in live
    assert "health" in live
    assert "recentEvents" in live
    assert "recentFeatures" in live
    assert "simulationStatus" in live
    assert isinstance(live["recentEvents"], list)


def test_04_dashboard_statistics_trends():
    response = client.get("/api/dashboard/statistics")
    assert response.status_code == 200
    stats = response.json()
    assert stats["success"] is True
    assert "packetsPerSecondTrend" in stats
    assert "bandwidthUsageTrend" in stats
    assert "latencyTrend" in stats
    assert "protocolDistribution" in stats
    assert len(stats["packetsPerSecondTrend"]["timestamps"]) >= 1
    assert len(stats["packetsPerSecondTrend"]["values"]) >= 1


def test_05_interactive_simulation_controls():
    # 1. Test PAUSE command
    pause_res = client.post("/api/dashboard/simulation/control", json={"action": "PAUSE"})
    assert pause_res.status_code == 200
    pause_data = pause_res.json()
    assert pause_data["paused"] is True
    
    # 2. Test RESUME command with 2.5x speed scaling
    resume_res = client.post("/api/dashboard/simulation/control", json={
        "action": "RESUME",
        "speedMultiplier": 2.5,
        "packetFrequency": 2.0
    })
    assert resume_res.status_code == 200
    resume_data = resume_res.json()
    assert resume_data["paused"] is False
    assert resume_data["speedMultiplier"] == 2.5
    assert resume_data["packetFrequency"] == 2.0


def test_06_csv_and_json_data_export():
    # 1. Test CSV Sessions export
    csv_res = client.get("/api/dashboard/export/sessions?format=csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "attachment; filename=" in csv_res.headers["content-disposition"]
    
    # 2. Test JSON Extracted Features export
    json_res = client.get("/api/dashboard/export/features?format=json")
    assert json_res.status_code == 200
    assert "application/json" in json_res.headers["content-type"]
    
    # 3. Test Invalid Resource rejection
    bad_res = client.get("/api/dashboard/export/invalid_table?format=csv")
    assert bad_res.status_code == 400
