# TrustChain-5G Environment Variables & Configuration Template

This document catalogs all runtime environmental variables utilized across the FastAPI backend and Vite React frontend tiers.

---

## 1. Backend Server Configuration (`backend/.env`)

When deploying locally or within Docker containers, create a `.env` file inside the `backend/` directory copying `backend/.env.example`.

| Variable Name | Default Value (Sprint 0) | Description & Production Guidance |
| :--- | :--- | :--- |
| `PROJECT_NAME` | `"TrustChain-5G Platform API"` | Application title injected into automated Swagger / OpenAPI document headers. |
| `VERSION` | `"0.1.0-sprint.0"` | Current engineering milestone release version tag. |
| `API_V1_STR` | `"/api/v1"` | Master routing prefix for all asynchronous domain service routers. |
| `SECRET_KEY` | `"enterprise-super-secret..."` | **CRITICAL**: SHA-256 / HS256 cryptographic signing key for JWT session generation. Must be replaced with a high-entropy randomized secret in production deployments. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Duration in minutes before authenticated user bearer tokens expire. |
| `MONGODB_URL` | `"mongodb://localhost:27017"` | Connection string pointing to target MongoDB 6.0 cluster. When running via Docker Compose, set to `"mongodb://mongodb:27017"`. |
| `MONGODB_DB_NAME` | `"trustchain5g"` | Target database schema namespace where domain models are archived. |
| `ENVIRONMENT` | `"development"` | Set to `"production"` to disable verbose debugging error tracebacks and Swagger documentation exposure. |
| `CORS_ORIGINS` | `["http://localhost:3000", ...]` | JSON list of trusted web UI origins allowed to perform cross-origin resource sharing (CORS) against the backend. |

---

## 2. Frontend Web App Configuration (`frontend/.env`)

For frontend customizations, create a `.env` file inside `frontend/`. In Vite applications, only variables prefixed with `VITE_` are bundled into the client-side JavaScript execution environment.

| Variable Name | Default Value (Sprint 0) | Description & Production Guidance |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `"http://localhost:8000/api/v1"` | Target absolute HTTP address for asynchronous axios REST calls. When deployed via Docker internal routing, this can be mapped to `"/api/v1"`. |
| `VITE_APP_TITLE` | `"TrustChain-5G Command Center"` | Application page header string rendered in browser tab headers and navigation menus. |
| `VITE_DEFAULT_THEME` | `"dark"` | Sets initial color interface aesthetic. Mandatory dark cybersecurity visual mode is recommended for operational monitoring centers. |

---

## 3. Applying Settings Change
After modifying `.env` variables:
- **Backend Uvicorn**: Will automatically re-evaluate settings if running with `--reload`.
- **Frontend Vite**: Requires restarting the terminal execution process (`Ctrl+C` followed by `npm run dev`) or executing a clean container build (`docker-compose build`).
