# TrustChain-5G: Intelligent Cybersecurity Command Platform for 5G Networks
**Sprint 0 Architectural Foundation & Enterprise Scaffolding**

[![Build Status](https://img.shields.io/badge/Build-Passing-22C55E?style=for-the-badge&logo=github)](https://github.com/KuHarish/Trust_Build_5G)
[![Technology Stack](https://img.shields.io/badge/Tech_Stack-FastAPI_%7C_React_18_%7C_TypeScript_%7C_Vite_%7C_TailwindCSS-2563EB?style=for-the-badge)](https://github.com/KuHarish/Trust_Build_5G)
[![Architecture](https://img.shields.io/badge/Architecture-Decoupled_Enterprise_Monolith-14B8A6?style=for-the-badge)](https://github.com/KuHarish/Trust_Build_5G)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## Executive Summary
**TrustChain-5G** is a state-of-the-art cybersecurity platform engineered to protect advanced 3GPP 5G and next-generation communication network infrastructures against emerging threat vectors. By synthesizing real-time multi-slice network surveillance, decentralized Federated Learning, Bayesian anomaly detection, and tamper-proof Blockchain reputation storage, TrustChain-5G achieves autonomous closed-loop threat mitigation without human intervention delays.

In **Sprint 0**, our engineering team focused strictly on establishing an industrial-strength, enterprise-scalable project architecture. This deliverable unites a high-performance **Python FastAPI Asynchronous Backend** with a rich, interactive **TypeScript React Vite Frontend**, fully containerized via Docker and backed by robust modular design patterns that guarantee zero regression breaks as active complex mathematical algorithms are implemented across upcoming sprints.

---

## Architectural Highlights & Capabilities (Sprint 0 Deliverables)

### 1. Robust Enterprise Backend (`backend/`)
- **FastAPI & Asynchronous Design**: Configured with asynchronous I/O loops, modular APIRouter interfaces, structured event logging, and custom exception handlers.
- **Type-Safe Domain Modeling**: Comprehensive Pydantic schema contracts and MongoDB ODM models established across 9 cybersecurity domain sectors (Users, Nodes, Traffic, Trust, Attacks, Blockchain, Federated AI, Security Mitigation, and Analytics).
- **Graceful Fault Tolerance**: Asynchronous database connection pool (`Motor`) configured with defensive error wrapping. The API boots cleanly into a testable mock presentation mode even when local database clusters are down or disconnected.
- **Automated Verification**: Complete PyTest integrity validation suite checking router bindings, payload serialization, and mock authentication token loops.

### 2. State-of-the-Art Interactive Frontend (`frontend/`)
- **High-Performance Web Stack**: Built upon React 18, TypeScript, Vite, React Router 6, React Query, Framer Motion, and lightweight Chart.js rendering engines.
- **Breathtaking Cybersecurity Design System**: Powered by custom TailwindCSS dark theme tokens (`bg-[#020617]`), smooth glassmorphic containers (`.glass-card`), neon status indicators, and micro-interactions that deliver a premium command console experience.
- **Complete Feature Scaffolding**: Features 11 domain route modules (`Dashboard`, `Network`, `Nodes`, `Traffic`, `Attacks`, `Trust Engine`, `Machine Learning`, `Federated Learning`, `Blockchain`, `Security Controller`, and `Analytics`), supported by interactive KPI cards and live simulated chart data streams.
- **Decoupled Mock Auth & RBAC**: Real-time evaluation of role-based clearances (**Administrator**, **Researcher**, and **Viewer**) with interactive clearance level switcher located directly in the console navigation header.

---

## Technology Stack Summary
| Tier | Core Technologies | Architectural Responsibility |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, TypeScript, Vite, TailwindCSS | Interactive real-time cybersecurity command console & telemetry visualization. |
| **Data Visualization** | Chart.js, React-Chartjs-2, Framer Motion | Smooth, lightweight rendering of 5G slice throughput and threat attack distributions. |
| **Backend API** | Python 3.11, FastAPI, Uvicorn, Pydantic v2 | Asynchronous REST routing, validation, JWT authentication, and AI model orchestration bridge. |
| **Database Layer** | MongoDB 6.0, Motor Async Driver | High-speed NoSQL document storage for network packets, trust histories, and immutable blocks. |
| **DevOps & Testing** | Docker, Docker Compose, PyTest, ESLint | Reproducible multi-stage container deployments and continuous automated quality checks. |

---

## Quick-Start Deployment & Verification Guide

### Option 1: Automated Docker Compose Boot (Recommended)
1. Open terminal at root project workspace (`Trust_Build_5G`).
2. Build and launch all container services:
   ```bash
   docker-compose up --build -d
   ```
3. Open your web browser and evaluate platform endpoints:
   - **Frontend Command Hub**: http://localhost:3000
   - **Backend API Swagger Interactive Docs**: http://localhost:8000/docs
   - **Backend System Diagnostic Healthcheck**: http://localhost:8000/api/v1/health

---

### Option 2: Local Manual Setup (Decoupled Development Mode)
#### A. Start FastAPI Backend Server
```bash
cd backend
python -m venv venv
# Activate virtual environment (.venv\Scripts\Activate.ps1 on Windows / source venv/bin/activate on Linux)
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

#### B. Start React Vite Frontend Console
```bash
cd frontend
npm install
npm run dev
# Open browser to displayed local development link (e.g. http://localhost:5173 or http://localhost:3000)
```

---

## Verification & Interactive Evaluation Plan
When testing the Sprint 0 foundation deliverable, execute the following interactive verification workflow:
1. **Authentication Loop**: On the login screen, notice the pre-filled credentials and click **Authenticate Session**. Notice the floating glassmorphic toast confirmation in the bottom right corner.
2. **Dashboard Surveillance**: On the main dashboard, review the 4 KPI telemetry cards, the interactive 5G Throughput vs Threat Volume line graph, and the Attack Taxonomy doughnut chart.
3. **Interactive Security Countermeasures**: On the **Live Security Controller Alerts** card, click **Inspect & Seal** next to an alert to simulate real-time automated firewall mitigation firings.
4. **RBAC Role Switching**: Click your user profile avatar in the top right navbar. Toggle between **Administrator**, **Researcher**, and **Viewer** roles to confirm real-time identity context updates without page reloading.
5. **Domain Placeholder Evaluation**: Using the collapsible left sidebar, navigate to future sprint modules (such as **Federated Learning** or **Adaptive Trust Engine**) to examine clean, production-grade architectural specification blueprints and "Coming Soon" roadmap integrations.

---

## Complete Enterprise Documentation Suite
For comprehensive details regarding module decoupling, engineering contribution rules, and environment parameter tuning, consult our documentation library in `docs/`:
- **[Folder Structure & Domain Layout](file:///d:/ponsangeetha/Trust_Build_5G/docs/folder_structure.md)**: Full directory explanations for frontend and backend modules.
- **[Installation & Deployment Guide](file:///d:/ponsangeetha/Trust_Build_5G/docs/installation.md)**: Manual setups, Python virtual environments, and Docker instructions.
- **[Developer Handbook & Roadmap](file:///d:/ponsangeetha/Trust_Build_5G/docs/development.md)**: Engineering separation rules and future sprint blueprints (Sprints 1 through 8).
- **[Contribution & Quality Standards](file:///d:/ponsangeetha/Trust_Build_5G/docs/contribution.md)**: Git feature branch protocols, pull request rules, and coding style manuals.
- **[Environment Variables Template](file:///d:/ponsangeetha/Trust_Build_5G/docs/env_template.md)**: Exhaustive breakdown of runtime `.env` variables for server and client tiers.

---
*Engineered by Antigravity for the TrustChain-5G Research & Command Center.*
