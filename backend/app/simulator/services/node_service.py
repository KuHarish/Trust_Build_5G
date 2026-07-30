"""
TrustChain-5G Node Management Service.
Business logic layer coordinating validation, repository operations, filtering, sorting,
and network population telemetry statistics computation.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from app.simulator.models.node import SimulationNode, SimulationNodeStatus, SimulationNodeType
from app.simulator.schemas.node import NodeCreate, NodeUpdate, NodeStatusPatch, NodeStatisticsResponse
from app.simulator.repositories.node_repository import node_repository

logger = logging.getLogger("trustchain.simulator.service")


class NodeService:
    """Service layer abstraction for Node CRUD and analytical aggregations."""

    @classmethod
    async def create_node(cls, create_data: NodeCreate) -> SimulationNode:
        """Validate and create a new simulation node."""
        data_dict = create_data.model_dump(exclude_unset=True)
        
        # Assign appropriate default deviceCategory based on type if omitted or generic
        if not data_dict.get("deviceCategory"):
            category_mapping = {
                SimulationNodeType.SMARTPHONE: "Mobile 5G User Equipment (UE)",
                SimulationNodeType.IOT_SENSOR: "Low-Power Wide-Area (LPWA) Sensor",
                SimulationNodeType.EDGE_DEVICE: "Multi-Access Edge Computing Server",
                SimulationNodeType.GATEWAY: "5G Core gNodeB / UPF Transport Gateway",
                SimulationNodeType.AUTONOMOUS_VEHICLE: "Cellular V2X Autonomous Vehicle Node",
                SimulationNodeType.INDUSTRIAL_DEVICE: "Cyber-Physical Factory Automation Node",
                SimulationNodeType.MEDICAL_DEVICE: "Critical Healthcare IoMT Telemetry Unit",
                SimulationNodeType.DRONE: "Unmanned Aerial Radio Relay UAV"
            }
            data_dict["deviceCategory"] = category_mapping.get(create_data.nodeType, "Standard 5G Entity")

        now = datetime.now(timezone.utc)
        node = SimulationNode(
            **data_dict,
            createdAt=now,
            updatedAt=now,
            lastSeen=now
        )
        return await node_repository.create(node)

    @classmethod
    async def list_nodes(
        cls,
        search: Optional[str] = None,
        node_type: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "asc"
    ) -> List[SimulationNode]:
        """List simulated nodes with filtering, searching, and sorting capabilities."""
        nodes = await node_repository.get_all()

        # Filter by node type
        if node_type and node_type.strip() and node_type != "ALL":
            nodes = [n for n in nodes if n.nodeType.value.lower() == node_type.strip().lower()]

        # Filter by operational status
        if status and status.strip() and status != "ALL":
            nodes = [n for n in nodes if n.status.value.lower() == status.strip().lower()]

        # Search query matching ID, Name, IP, or MAC
        if search and search.strip():
            query = search.strip().lower()
            nodes = [
                n for n in nodes
                if query in n.nodeName.lower()
                or query in n.id.lower()
                or query in n.ipAddress.lower()
                or query in n.macAddress.lower()
                or query in n.nodeType.value.lower()
            ]

        # Sorting
        if sort_by and sort_by in ["nodeName", "signalStrength", "batteryLevel", "latency", "bandwidth", "status", "lastSeen"]:
            reverse = (sort_order.lower() == "desc")
            def sort_key(item: SimulationNode):
                val = getattr(item, sort_by, None)
                if val is None:
                    return "" if isinstance(item.nodeName, str) else 0
                if hasattr(val, "value"):
                    return val.value
                return val

            nodes.sort(key=sort_key, reverse=reverse)

        return nodes

    @classmethod
    async def get_node(cls, node_id: str) -> Optional[SimulationNode]:
        """Retrieve node by unique ID."""
        return await node_repository.get_by_id(node_id)

    @classmethod
    async def update_node(cls, node_id: str, update_data: NodeUpdate) -> Optional[SimulationNode]:
        """Modify attributes of an existing node."""
        existing = await node_repository.get_by_id(node_id)
        if not existing:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        for k, v in update_dict.items():
            if v is not None:
                setattr(existing, k, v)
        
        existing.updatedAt = datetime.now(timezone.utc)
        return await node_repository.update(existing)

    @classmethod
    async def delete_node(cls, node_id: str) -> bool:
        """Delete a simulation node."""
        return await node_repository.delete(node_id)

    @classmethod
    async def patch_node_status(cls, node_id: str, patch_data: NodeStatusPatch) -> Optional[SimulationNode]:
        """Toggle node status state."""
        existing = await node_repository.get_by_id(node_id)
        if not existing:
            return None
        existing.status = patch_data.status
        existing.updatedAt = datetime.now(timezone.utc)
        return await node_repository.update(existing)

    @classmethod
    async def get_statistics(cls) -> NodeStatisticsResponse:
        """Compute aggregate KPIs across all simulation nodes."""
        nodes = await node_repository.get_all()
        total_nodes = len(nodes)
        
        if total_nodes == 0:
            # Re-check or return initial zeros
            return NodeStatisticsResponse(
                totalNodes=0,
                onlineNodes=0,
                offlineNodes=0,
                nodeTypes={},
                averageSignalStrength=0.0
            )

        online_nodes = sum(1 for n in nodes if n.status == SimulationNodeStatus.ONLINE)
        offline_nodes = sum(1 for n in nodes if n.status == SimulationNodeStatus.OFFLINE)
        
        node_types_map: Dict[str, int] = {}
        total_signal_online = 0.0
        signal_contributors = 0

        for n in nodes:
            t_str = n.nodeType.value if hasattr(n.nodeType, "value") else str(n.nodeType)
            node_types_map[t_str] = node_types_map.get(t_str, 0) + 1
            if n.status in [SimulationNodeStatus.ONLINE, SimulationNodeStatus.BUSY]:
                total_signal_online += float(n.signalStrength)
                signal_contributors += 1

        avg_signal = round(total_signal_online / signal_contributors, 1) if signal_contributors > 0 else -70.0

        return NodeStatisticsResponse(
            totalNodes=total_nodes,
            onlineNodes=online_nodes,
            offlineNodes=offline_nodes,
            nodeTypes=node_types_map,
            averageSignalStrength=avg_signal
        )
