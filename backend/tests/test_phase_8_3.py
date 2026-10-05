import pytest
import asyncio
from httpx import AsyncClient
from app.main import app
from app.security.repositories.security_repository import security_repository
from app.trust.repositories.trust_repository import trust_profile_repo
from app.simulator.repositories.node_repository import node_repository
from app.blockchain.services.blockchain_service import blockchain_service

@pytest.mark.asyncio
async def test_end_to_end_security_pipeline():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # 1. Fetch simulation nodes
        nodes_resp = await client.get("/api/v1/simulation/nodes")
        nodes = nodes_resp.json().get("data", [])
        assert len(nodes) > 0, "Simulation nodes not found"
        
        target_node = nodes[0]["id"]
        
        # 2. Trigger Attack
        attack_req = {
            "attackerNodeId": target_node,
            "attackType": "DDoS",
            "intensity": "HIGH",
            "duration": 30
        }
        attack_resp = await client.post("/api/v1/simulation/attack", json=attack_req)
        assert attack_resp.status_code == 200
        
        # Wait for simulation to process traffic and ML to evaluate
        await asyncio.sleep(5)
        
        # 3. Verify Trust Score dropped
        profile = await trust_profile_repo.get_by_node_id(target_node)
        assert profile is not None
        assert profile.trustScore < 0.9, "Trust score did not drop after attack"
        
        # 4. Verify Security Decision created
        decisions = await security_repository.decisions_collection.find({"nodeId": target_node}).to_list(10)
        assert len(decisions) > 0, "Security decision was not generated"
        
        decision = decisions[-1]
        assert decision["decision"] in ["QUARANTINE", "BLOCK", "RATE_LIMIT", "MONITOR", "WARN"]
        correlation_id = decision["explanation"].get("correlationId")
        assert correlation_id is not None, "Correlation ID is missing"
        
        # 5. Verify Mitigation Action created
        actions = await security_repository.actions_collection.find({"correlationId": correlation_id}).to_list(10)
        assert len(actions) > 0, "Mitigation action was not triggered"
        action = actions[-1]
        assert action["status"] in ["COMPLETED", "IN_PROGRESS", "FAILED"]
        
        # 6. Verify Blockchain Record
        db = security_repository.db.get_db()
        audit_events = await db["audit_events"].find({"correlationId": correlation_id}).to_list(10)
        assert len(audit_events) > 0, "Audit events were not created for blockchain submission"
        
        blockchain_confirmed = False
        for evt in audit_events:
            if evt.get("auditStatus") == "CONFIRMED":
                blockchain_confirmed = True
                break
        
        assert blockchain_confirmed, "Security events were not confirmed on the blockchain"

@pytest.mark.asyncio
async def test_fl_simulation_nodes_mapping():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Start FL round
        req = {
            "datasetId": "CICIDS2017",
            "modelName": "TrustChain_Federated_Model",
            "totalClients": 2,
            "minimumClients": 2,
            "trainingRounds": 1,
            "participationRate": 1.0,
            "partitionStrategy": "IID",
            "randomSeed": 42
        }
        fl_resp = await client.post("/api/v1/federated/trigger_start", json=req)
        
        await asyncio.sleep(3)
        
        # Fetch clients
        clients_resp = await client.get("/api/v1/federated/clients")
        clients = clients_resp.json().get("data", [])
        
        assert len(clients) > 0, "FL clients not registered"
        # Check if they map to simulation nodes by ensuring they have UUID format instead of 'client-1'
        for client in clients:
            assert "client-" not in client["clientId"], "FL client is not mapped to an actual simulated node ID"
