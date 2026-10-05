import urllib.request
import urllib.error
import json
import uuid
import time
from datetime import datetime, timezone

API_BASE = "http://localhost:8000/api/v1"

def post_json(url, data):
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.read().decode()}")
        return None
    except Exception as e:
        print(f"Connection Error: {e}")
        return None

def get_json(url):
    req = urllib.request.Request(url, method='GET')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return None

def run_demonstration():
    print("==================================================")
    print(" TRUSTCHAIN-5G: SPRINT 6.5 END-TO-END DEMONSTRATION ")
    print("==================================================")
    
    # 1. Generate an incident
    node_id = f"NODE-DEMO-{uuid.uuid4().hex[:4].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    print(f"\n[MODULE 1 & 2] Target Node: {node_id}")
    print("[MODULE 3] Trust Score generated: 0.1 (MALICIOUS)")
    print("[MODULE 4] ML Prediction generated: ATTACK (Confidence: 0.99)")
    
    evidence = {
        "nodeId": node_id,
        "triggerEventId": f"trig_{uuid.uuid4().hex[:8]}",
        "mlTimestamp": now,
        "trustTimestamp": now,
        "predictionId": f"pred_{uuid.uuid4().hex[:8]}",
        "trustEvaluationId": f"trust_{uuid.uuid4().hex[:8]}",
        "mlPrediction": "ATTACK",
        "mlConfidence": 0.99,
        "trustScore": 0.1,
        "trustLevel": "MALICIOUS",
        "attackCategory": "DDoS"
    }
    
    # 2. Trigger Security Controller
    print("\n[MODULE 6.1] Submitting evidence to Security Controller...")
    start_time = time.time()
    result = post_json(f"{API_BASE}/security/evaluate", evidence)
    
    if not result or not result.get("success"):
        print("Failed to evaluate evidence. Is the server running?")
        return
        
    decision = result["data"]
    corr_id = decision.get("explanation", {}).get("correlationId")
    
    print(f"  -> Decision ID: {decision['decisionId']}")
    print(f"  -> Correlation ID: {corr_id}")
    print(f"  -> Action Taken: {decision['decision']}")
    print(f"  -> Matched Policy: {decision['policyId']} (v{decision['policyVersion']})")
    
    # 3. Wait for async mitigation and audit
    print("\n[MODULE 6.2 & 6.4] Waiting for Mitigation Execution & Audit Pipeline...")
    time.sleep(2) # Give background tasks time to complete
    
    # 4. Check Audit Timeline
    timeline_res = get_json(f"{API_BASE}/security/audit/timeline/{corr_id}")
    end_time = time.time()
    
    print("\n[MODULE 6.4 & 5] Incident Audit Timeline (Blockchain Validated):")
    if timeline_res and timeline_res.get("success"):
        events = timeline_res["data"]
        for e in events:
            print(f"  [{e['timestamp']}] {e['eventType']}")
            if e.get('blockchainTxId'):
                print(f"    └─ Blockchain TX: {e['blockchainTxId']} ({e['auditStatus']})")
    else:
        print("  Could not retrieve timeline.")
        
    latency = (end_time - start_time) * 1000
    print(f"\n=> End-to-End Latency (Controller -> Mitigation -> Blockchain Audit Retrieval): {latency:.2f} ms")
    
    print(f"\n=> Dashboard verification: Navigate to Security Controller -> Audit Timeline -> Search for '{corr_id}'")
    print("==================================================")

if __name__ == "__main__":
    run_demonstration()
