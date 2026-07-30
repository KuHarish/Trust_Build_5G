"""
TrustChain-5G Module 2 Services Package.
"""
from app.edge.services.edge_service import EdgeService, edge_service
from app.edge.services.edge_simulation_service import EdgeSimulationService, edge_simulation_service

__all__ = ["EdgeService", "edge_service", "EdgeSimulationService", "edge_simulation_service"]
