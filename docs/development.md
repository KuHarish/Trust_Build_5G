# TrustChain-5G Developer Handbook & Sprint Transition Guide

This document outlines standard operational practices for engineers extending the TrustChain-5G architectural foundation into active algorithmic cybersecurity modules across upcoming sprints (Sprint 1 through Sprint 8).

---

## 1. Core Architectural Decoupling Principles

To maintain zero regression risk as complex mathematical computing architectures are deployed, all engineers must observe three cardinal rules:

### Rule 1: API Router Abstraction
Never write database query loops or complex machine learning mathematical calculations directly inside FastAPI routing functions (`backend/app/api/v1/endpoints.py`). 
- **Correct Workflow**: Routing endpoints receive validated Pydantic DTOs, invoke separate algorithmic service functions in domain modules (`backend/intrusion/`, `backend/trust/`), and return standardized JSON responses.

### Rule 2: Non-Blocking Graceful Degradation
When integrating complex subsystems such as NS-3 5G network simulations or Ethereum/Fabric blockchain sealers:
- Wrap initializers in asynchronous try/except connection guards.
- If an external hardware simulation interface or ledger node disconnects, fall back cleanly to simulated memory buffers. **A disconnected background module must never crash the master API server or freeze UI rendering.**

### Rule 3: Frontend Type Integrity & Design Consistency
- All REST data transfers must map cleanly to interfaces in `frontend/src/types/index.ts`.
- Avoid hardcoding arbitrary hex colors or inline pixel styles in component modules. Utilize standard design tokens defined in `tailwind.config.js` (`primary`, `accent`, `danger`, `success`, `glass-card`).
- Utilize reusable components from `src/components/common/` rather than re-creating duplicate buttons or tables.

---

## 2. Upcoming Sprint Implementation Roadmap

When advancing into specific technical deliverables, place new code files directly inside the assigned architectural scaffolds created during Sprint 0:

| Sprint Module | Primary Target Directory | Implementation Objectives & Scope |
| :--- | :--- | :--- |
| **Sprint 1: Network Simulation** | `backend/simulator/` | Integrate NS-3 Python bindings; simulate 3GPP gNodeB radio slices and UE handover packet generation. |
| **Sprint 2: Edge Feature Extractor** | `backend/intrusion/` | Build high-speed statistical feature generators (packet inter-arrival variance, byte dispersion rates). |
| **Sprint 3: ML Intrusion Engine** | `backend/intrusion/`, `models/` | Train Random Forest, Isolation Forest, and LSTM Autoencoder threat models; serve real-time evaluation inference at `/api/v1/ml/evaluate`. |
| **Sprint 4: Federated Learning Lab** | `backend/federated/` | Implement decentralized FedAvg weight aggregation; integrate outlier detection to reject malicious gradient poisoning attempts. |
| **Sprint 5: Adaptive Trust Engine** | `backend/trust/` | Deploy mathematical Bayesian multi-factor trust computation formulas; implement auto-decay rules upon threat observation. |
| **Sprint 6: Blockchain Storage** | `backend/blockchain/` | Build Merkle tree SHA-256 transaction hashing loops; persist historical node trust reputations to immutable ledgers. |
| **Sprint 7: Security Controller** | `backend/security/` | Connect closed-loop reactive rules to automatically quarantine compromised entities via OpenFlow / SDN firewall injections. |
| **Sprint 8: Analytics Dashboard** | `frontend/src/pages/`, `widgets/` | Link live WebSockets to replace simulated data buffers in interactive Chart.js widgets across all 11 UI pages. |

---

## 3. Debugging & Logging
- **Backend**: The FastAPI app utilizes structured logging initialized in `backend/app/main.py`. Consult terminal logs for immediate HTTP trace identification and request duration times.
- **Frontend**: Utilize the browser DevTools console in tandem with React Query DevTools to trace cache invalidation and mock state transformations.
