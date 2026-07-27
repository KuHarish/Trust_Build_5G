"""
TrustChain-5G Backend Test Suite.

Verifies operational readiness, routing integrity, and schema compliance of the Sprint 0 foundational deliverable.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_welcome_endpoint():
    """Verify core API gateway welcoming banner works without error."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["platform"] == "TrustChain-5G"
    assert "Sprint 0" in data["milestone"]


def test_health_check_endpoint():
    """Verify system health check endpoint exposes service list and diagnostic parameters."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "0.1.0-sprint.0"
    assert len(data["active_services"]) > 0


def test_version_api_endpoint():
    """Verify version endpoint outputs accurate module feature readiness mapping."""
    response = client.get("/api/v1/version")
    assert response.status_code == 200
    data = response.json()
    assert data["project_name"] == "TrustChain-5G"
    assert "network_simulation" in data["modules_ready"]
    assert "Scaffold Ready" in data["modules_ready"]["ml_intrusion_detection"]


def test_mock_login_authentication_flow():
    """Verify mock authentication token issuance for admin and researcher personas."""
    payload = {
        "username_or_email": "administrator@trustchain5g.org",
        "password": "secure-enterprise-password",
        "requested_role_demo": "Administrator"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "access_token" in body["data"]
    assert body["data"]["role"] == "Administrator"
    assert body["data"]["token_type"] == "bearer"


def test_nodes_registry_endpoint_mock():
    """Verify nodes discovery router returns initial simulated items."""
    response = client.get("/api/v1/nodes")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["total_count"] >= 3
