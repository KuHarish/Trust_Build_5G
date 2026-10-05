# TrustChain-5G Enterprise Folder Structure Architecture

This document outlines the directory hierarchy established in **Sprint 0** for the TrustChain-5G platform. The structure mandates strict decoupling between UI layer presenting telemetry, asynchronous APIs, domain data schemas, and future AI/Blockchain algorithmic engines.

```
Trust_Build_5G/
├── backend/                         # Python FastAPI Asynchronous Services Server
│   ├── app/
│   │   ├── api/                    # REST Application Programming Interface
│   │   │   ├── v1/                 # Version 1 Router Namespace
│   │   │   │   ├── endpoints.py    # Subsystem routing bridges (Auth, Nodes, ML, etc.)
│   │   │   │   └── router.py       # API router aggregator & prefix wiring
│   │   │   ├── health.py           # Container healthcheck probe (/api/v1/health)
│   │   │   └── version.py          # Platform build diagnostics (/api/v1/version)
│   │   ├── core/                   # Kernel configuration & security security tools
│   │   │   ├── config.py           # Pydantic BaseSettings environment runtime parameters
│   │   │   └── security.py         # JWT Token signing, Bcrypt hashing & verification
│   │   ├── database/               # Asynchronous Motor (MongoDB) Data Access Layer
│   │   │   ├── client.py           # Connection pooling & collection index initialization
│   │   │   └── mock_data.py        # Sprint 0 synthetic test records
│   │   ├── models/                 # Complete Domain Schemas (Pydantic / Mongo ODM)
│   │   │   ├── alert.py            # Security Controller mitigation incidents
│   │   │   ├── analytics.py        # Executive telemetry KPI aggregates
│   │   │   ├── attack.py           # Intrusion detection event payloads
│   │   │   ├── blockchain.py       # Tamper-proof trust blocks & transaction hashes
│   │   │   ├── federated.py        # Federated Learning edge model weights & epochs
│   │   │   ├── node.py             # 5G Network Entities (gNodeB, UPF, MEC, AMF)
│   │   │   ├── traffic.py          # High-speed packet sampling & NetFlow window summaries
│   │   │   ├── trust.py            # Bayesian reputation indices & transition ledgers
│   │   │   └── user.py             # Role-Based Access Control (RBAC) security clearances
│   │   └── main.py                 # FastAPI Uvicorn Application Entrypoint & Middleware
│   ├── simulator/                  # Placeholder: 3GPP 5G Network Topological Simulation (NS-3)
│   ├── intrusion/                  # Placeholder: ML Threat Classifier Engines & Autoencoders
│   ├── trust/                      # Placeholder: Adaptive Multi-Factor Bayesian Trust Formula
│   ├── federated/                  # Placeholder: Decentralized Federated Average Aggregation
│   ├── blockchain/                 # Placeholder: Proof-of-Trust cryptographic block seal loops
│   ├── security/                   # Placeholder: Autonomous SDN Controller rule enforcement
│   ├── datasets/                   # Synthetic and PCAP Packet Capture storage volumes
│   ├── models/                     # Serialized AI model artifacts (.pt, .pkl, .h5)
│   ├── tests/                      # Automated Test Suite (PyTest API integrity verification)
│   ├── scripts/                    # Database seeding and DevSecOps utility automation
│   ├── requirements.txt            # Locked Python 3.11 enterprise package dependencies
│   ├── Dockerfile                  # Multi-stage lightweight production containerization
│   └── .env.example                # Runtime backend configuration variables template
│
├── frontend/                       # TypeScript React Vite Interactive Command Center
│   ├── src/
│   │   ├── api/                    # HTTP Service Client Layer
│   │   │   ├── endpoints.ts        # Modular REST client bridges per cybersecurity domain
│   │   │   └── index.ts            # API service export root
│   │   ├── components/
│   │   │   ├── common/             # Reusable Core UI Design System Library (Tailwind)
│   │   │   │   ├── Button.tsx      # Multi-variant responsive buttons with load states
│   │   │   │   ├── Card.tsx        # Glassmorphic glowing containers
│   │   │   │   ├── Table.tsx       # Universal data streaming table with dynamic columns
│   │   │   │   ├── Modal.tsx       # Keyboard accessible dialog overlay
│   │   │   │   ├── Input.tsx       # Icon-integrated form controls with error indicators
│   │   │   │   ├── Select.tsx      # Dropdown pickers with custom cyber styling
│   │   │   │   ├── Badge.tsx       # Status indicator pills with pulse animations
│   │   │   │   ├── Avatar.tsx      # User profile shields with online indicators
│   │   │   │   ├── LoadingSpinner  # Animated cyber loading symbols
│   │   │   │   ├── ToastNotification # Floating threat incident alarm system
│   │   │   │   ├── StatusIndicator # Colored telemetry status dot system
│   │   │   │   └── EmptyState.tsx  # Empty view guidance placeholders
│   │   │   └── widgets/            # Interactive Executive Dashboard Graphs & KPIs
│   │   │       ├── MetricCard.tsx  # Real-time KPI delta comparison card
│   │   │       ├── LineChartPlaceholder # Chart.js 5G throughput vs threat volume
│   │   │       ├── PieChartPlaceholder  # Doughnut intrusion detection taxonomy
│   │   │       ├── NetworkStatusCard # Live 3GPP network slicing monitor
│   │   │       ├── AlertCard.tsx   # Interactive security countermeasure firing widget
│   │   │       └── ActivityTable.tsx # Cross-module audit trail log correlation
│   │   ├── contexts/               # Global React Context State Management
│   │   │   ├── ThemeContext.tsx    # Mandatory dark cybersecurity aesthetic persistence
│   │   │   ├── AuthContext.tsx     # Decoupled mock RBAC session switcher
│   │   │   ├── NotificationContext # Event queue orchestrator for real-time alerts
│   │   │   └── SettingsContext.tsx # Telemetry synchronization & slice view preferences
│   │   ├── layouts/                # Enterprise Shell Structural Layouts
│   │   │   ├── Navbar.tsx          # Command header with search and clearance switching
│   │   │   ├── Sidebar.tsx         # Collapsible menu across all 11 security routes
│   │   │   ├── PageHeader.tsx      # Page banner with action slot and sprint tags
│   │   │   ├── MainLayout.tsx      # Persistent dashboard workspace wrapper
│   │   │   └── AuthLayout.tsx      # Centered cyber-gradient login view wrapper
│   │   ├── pages/                  # Route-Bound Presentation Modules
│   │   │   ├── auth/               # Credential validation & recovery views
│   │   │   ├── Dashboard.tsx       # Master command & control presentation hub
│   │   │   ├── Network.tsx         # 5G virtual radio network topology
│   │   │   ├── Nodes.tsx           # Base station entity registry
│   │   │   ├── Traffic.tsx         # Netflow surveillance and DPI sampling
│   │   │   ├── Attacks.tsx         # Intrusion threat incident logs
│   │   │   ├── TrustEngine.tsx     # Bayesian reputation computation visualization
│   │   │   ├── MachineLearning.tsx # AI anomaly detection accuracy parameters
│   │   │   ├── FederatedLearning   # Collaborative decentralized gradient monitoring
│   │   │   ├── Blockchain.tsx      # Tamper-proof cryptographic block explorer
│   │   │   ├── SecurityController  # Closed-loop mitigation quarantine firing
│   │   │   ├── Analytics.tsx       # Historical time-window audit trends
│   │   │   └── Settings.tsx        # Command console configuration
│   │   ├── routes/                 # Router Hierarchy & Protected Guards
│   │   ├── services/               # Axios HTTP instance & Interceptor middleware
│   │   ├── styles/                 # Global Tailwind directive definitions & glassmorphism
│   │   ├── types/                  # Enterprise TypeScript interface contracts
│   │   ├── utils/                  # Class name combinations and formatting helpers
│   │   ├── App.tsx                 # React Query & Provider integration root
│   │   └── main.tsx                # BrowserDOM dehydration entry script
│   ├── index.html                  # Responsive meta headers & typography font links
│   ├── package.json                # Verified Vite, React 18 & Chart.js package manifest
│   ├── tailwind.config.js          # Cybersecurity color theme tokens & keyframe rules
│   ├── tsconfig.json               # Absolute import (@/) resolution paths
│   ├── vite.config.ts              # Bundler optimization and development proxy proxying
│   └── Dockerfile                  # Node build engine + Nginx static serving container
│
├── docs/                           # Architectural Documentation Suite
├── docker-compose.yml              # Multi-container orchestration architecture
└── README.md                       # Platform executive handbook & quickstart reference
```

## Separation of Concerns
Each directory has an immutable operational responsibility:
- `backend/app/models/`: The **Single Source of Truth** for database schemas and JSON serialization across all future sprints.
- `backend/app/api/`: Handles network transport, request authorization, and protocol error mapping. Never directly executes numerical ML computations.
- `frontend/src/api/`: Acts as the clean API bridge, allowing UI components in `src/pages/` to be completely oblivious to underlying network protocols or URL structures.
