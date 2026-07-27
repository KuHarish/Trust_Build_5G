# TrustChain-5G Enterprise Installation & Deployment Guide

This handbook provides clear, reproducible procedures for deploying the TrustChain-5G platform in local development environments and containerized DevOps staging servers.

---

## 1. Quick-Start Containerized Deployment (Recommended)

Using Docker Compose ensures zero-configuration initialization of the entire technology stack (MongoDB 6.0, FastAPI Python Backend, and React Nginx Frontend).

### Prerequisites
- Docker Desktop 4.20+ or Docker Engine 24+
- Docker Compose v2.0+

### Deployment Procedure
1. Open a terminal in the root workspace directory (`Trust_Build_5G`).
2. Execute the orchestration build command:
   ```bash
   docker-compose up --build -d
   ```
3. Verify container health status:
   ```bash
   docker-compose ps
   ```
   *You should see `trustchain_mongodb`, `trustchain_backend`, and `trustchain_frontend` operating with `healthy` or `running` states.*

4. Access the platform endpoints:
   - **Frontend Command & Control Hub**: http://localhost:3000
   - **Backend REST OpenAPI Interactive Docs**: http://localhost:8000/docs
   - **Backend Healthcheck Diagnostics**: http://localhost:8000/api/v1/health

---

## 2. Local Development Setup (Manual Decoupled Mode)

For real-time code reloading and direct interactive testing during upcoming sprint cycles, set up both tiers independently.

### A. Backend FastAPI Initialization
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python 3.11 virtual environment:
   ```bash
   # On Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # On macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install locked enterprise dependencies:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
4. Copy environment configuration template:
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env

   # Linux / macOS
   cp .env.example .env
   ```
5. Launch Uvicorn asynchronous development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   *Note: Sprint 0 architecture includes graceful degradation. If a local MongoDB instance on port 27017 is unreachable, the server logs a warning and boots into decoupled memory mode without breaking.*

---

### B. Frontend React Vite Initialization
1. Open a second terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node.js package dependencies:
   ```bash
   npm install
   ```
3. Launch the high-speed Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser to the printed local port (typically http://localhost:5173 or http://localhost:3000).

---

## 3. Verifying the Installation
Once deployed, perform the **Sprint 0 Acceptance Validation**:
1. Navigate to the Login view and sign in with the pre-filled Administrator account (`admin@trustchain5g.org`).
2. Verify that the **5G Cybersecurity Command & Control** dashboard loads immediately without console exceptions.
3. Check that the **Live 5G Slice Telemetry** line chart and **Intrusion Taxonomy** doughnut chart render smoothly.
4. Use the top navigation profile switcher to transition clearance levels between **Administrator**, **Researcher**, and **Viewer**.
5. Click **Sync Telemetry** on the dashboard header to observe live interactive toast alarms in the bottom right corner.
