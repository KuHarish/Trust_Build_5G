"""
TrustChain-5G Sprint 1.4: Real-Time Network Monitoring & System Integration Centralized Service.
Aggregates operational telemetry from Node Management (Module 1), Edge Server (Module 2), and Communication Engine (Module 3)
without duplicating logic or modifying existing architectures. Evaluates system health, formats operational radio alarms,
interfaces simulation daemon controllers, and prepares multi-format CSV/JSON log exports.
Strictly excludes attacks, Machine Learning, Trust Scores, and Blockchain processing.
"""
import csv
import io
import json
import logging
import random
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple
from app.dashboard.schemas.dashboard import (
    SystemOverview,
    NetworkHealthStatus,
    HealthCriteria,
    ActivityEvent,
    ExtractedFeatureItem,
    SimulationStatus,
    SimulationControlRequest,
    DashboardLiveResponse,
    ChartSeriesData,
    DashboardStatisticsResponse,
)
from app.simulator.services.node_service import NodeService as node_service
from app.simulator.models.node import SimulationNodeStatus
from app.edge.services.edge_service import edge_service
from app.communication.services.communication_service import communication_service
from app.communication.repositories.communication_repository import communication_repository

# Background simulation daemons
from app.simulator.services.simulation_service import simulation_service as node_sim_daemon
from app.edge.services.edge_simulation_service import edge_simulation_service as edge_sim_daemon
from app.communication.simulation.communication_simulation_service import communication_simulation_service as comm_sim_daemon
from app.communication.simulation.traffic_generator import traffic_generator

logger = logging.getLogger("trustchain.dashboard.service")


class DashboardService:
    def __init__(self):
        self._sim_paused = False
        self._speed_multiplier = 1.0
        # Caching rolling history for visual time-series trend charts
        self._chart_history: Dict[str, List[Tuple[str, float]]] = {
            "pps": [],
            "bandwidth": [],
            "latency": [],
            "signal": [],
            "volume": []
        }
        self._init_mock_history()

    def _init_mock_history(self):
        """Seed 15 historical data points for realistic startup visual trend lines."""
        now = datetime.now(timezone.utc)
        for i in range(15, 0, -1):
            ts = (now - timedelta(seconds=i * 4)).strftime("%H:%M:%S")
            self._chart_history["pps"].append((ts, round(random.uniform(8.0, 25.0), 1)))
            self._chart_history["bandwidth"].append((ts, round(random.uniform(220.0, 680.0), 1)))
            self._chart_history["latency"].append((ts, round(random.uniform(12.0, 38.0), 2)))
            self._chart_history["signal"].append((ts, round(random.uniform(-78.0, -52.0), 1)))
            self._chart_history["volume"].append((ts, round(random.uniform(5.0, 15.0), 1)))

    async def get_overview(self) -> SystemOverview:
        """Aggregate high-level system KPIs from existing Module 1, 2, and 3 services."""
        # Module 1: Node statistics
        node_stats = await node_service.get_statistics()  # NodeService classmethod call
        total_nodes = node_stats.totalNodes
        online_nodes = node_stats.onlineNodes
        offline_nodes = node_stats.offlineNodes

        # Module 3: Communication statistics
        comm_stats = await communication_service.get_statistics()
        active_sessions = comm_stats.activeSessions
        pps = comm_stats.packetsPerSecond
        avg_bw = comm_stats.averageBandwidth
        avg_lat = comm_stats.averageLatency

        # Module 2: Edge statistics
        edge_stats = await edge_service.get_statistics()
        eps = edge_stats.eventsPerSecond
        avg_signal = edge_stats.averageSignalStrength if hasattr(edge_stats, "averageSignalStrength") else -70.0
        # Feature extraction rate closely mirrors event ingestion velocity
        ext_rate = round(eps * (1.0 + random.uniform(-0.05, 0.05)), 2)

        overview = SystemOverview(
            totalNodes=total_nodes,
            onlineNodes=online_nodes,
            offlineNodes=offline_nodes,
            activeSessions=active_sessions,
            packetsPerSecond=pps,
            eventsPerSecond=eps,
            averageLatency=avg_lat,
            averageBandwidth=avg_bw,
            averageSignalStrength=avg_signal,
            featureExtractionRate=max(0.1, ext_rate),
        )

        # Update historical time-series chart arrays with latest snapshot
        now_ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
        self._update_history("pps", now_ts, pps)
        self._update_history("bandwidth", now_ts, avg_bw)
        self._update_history("latency", now_ts, avg_lat)
        self._update_history("signal", now_ts, avg_signal)
        self._update_history("volume", now_ts, float(active_sessions))

        return overview

    def _update_history(self, key: str, ts: str, value: float):
        self._chart_history[key].append((ts, value))
        if len(self._chart_history[key]) > 20:
            self._chart_history[key].pop(0)

    async def get_health(self) -> NetworkHealthStatus:
        """Calculate overall operational network health (Healthy, Warning, Critical) based purely on physical RF thresholds."""
        overview = await self.get_overview()
        
        # Availability calculation
        avail = round((overview.onlineNodes / max(1, overview.totalNodes)) * 100.0, 1)
        lat = overview.averageLatency
        bw_util = round(min(100.0, (overview.averageBandwidth / 1000.0) * 100.0), 1)
        
        # Estimate packet loss based on latency and signal strength
        loss = 0.5
        if lat > 50.0 or overview.averageSignalStrength < -80.0:
            loss += round((lat - 35.0) * 0.08, 2)
        loss = max(0.1, min(25.0, round(loss, 2)))

        details = []
        status = "Healthy"
        score = 100.0

        if avail < 50.0:
            status = "Critical"
            score -= 40.0
            details.append(f"CRITICAL: Low node availability ({avail}% online).")
        elif avail < 75.0:
            status = "Warning"
            score -= 15.0
            details.append(f"WARNING: Reduced radio entity reachability ({avail}% online).")
        else:
            details.append(f"Nominal 3GPP and IoT entity reachability ({avail}% online).")

        if lat > 80.0:
            status = "Critical"
            score -= 30.0
            details.append(f"CRITICAL: High Haversine propagation lag ({lat} ms avg).")
        elif lat > 45.0:
            if status != "Critical":
                status = "Warning"
            score -= 12.0
            details.append(f"WARNING: Moderate transit delay ({lat} ms avg).")
        else:
            details.append(f"Optimal low-latency routing ({lat} ms avg).")

        if loss > 8.0:
            if status != "Critical":
                status = "Warning"
            score -= 15.0
            details.append(f"WARNING: Elevated RF frame retransmissions ({loss}% loss).")
        else:
            details.append(f"Nominal transmission reliability ({loss}% estimated loss).")

        score = max(5.0, min(100.0, round(score, 1)))

        return NetworkHealthStatus(
            status=status,
            healthScore=score,
            criteria=HealthCriteria(
                availability=avail,
                latency=lat,
                packetLoss=loss,
                bandwidthUtilization=bw_util,
                details=details
            )
        )

    async def get_live_stream(self) -> DashboardLiveResponse:
        """Synthesize real-time unified dashboard telemetry stream for WebSockets, SSE, and polling clients."""
        overview = await self.get_overview()
        health = await self.get_health()

        # Compile recent operational events & informational alerts
        recent_events = await self._compile_activity_stream()
        
        # Compile recent feature extraction data from Module 2
        recent_features = await self._compile_feature_stream()

        # Determine daemon simulation status
        sim_status = SimulationStatus(
            running=(node_sim_daemon._running or comm_sim_daemon.running) and not self._sim_paused,
            paused=self._sim_paused,
            speedMultiplier=self._speed_multiplier,
            nodeCount=overview.totalNodes,
            packetFrequency=comm_sim_daemon.interval,
            communicationInterval=edge_sim_daemon._interval_sec,
        )

        return DashboardLiveResponse(
            success=True,
            overview=overview,
            health=health,
            recentEvents=recent_events,
            recentFeatures=recent_features,
            activeSessionsCount=overview.activeSessions,
            simulationStatus=sim_status,
        )

    async def _compile_activity_stream(self) -> List[ActivityEvent]:
        """Generate scrolling operational events and informational radio alarms. Excludes attacks/ML."""
        events: List[ActivityEvent] = []
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Retrieve recent transmitted packets from Module 3
        packets, _ = await communication_service.list_packets(limit=8)
        for i, pkt in enumerate(packets[:6]):
            # Check for operational informational alerts (Low Signal / High Latency)
            if pkt.latency > 45.0:
                events.append(ActivityEvent(
                    eventId=f"ev-lat-{pkt.packetId}",
                    timestamp=pkt.timestamp,
                    eventType="ALERT",
                    severity="WARNING",
                    sourceNode=pkt.sourceNodeId,
                    destinationNode=pkt.destinationNodeId,
                    protocol=pkt.protocol,
                    description=f"High latency spike ({pkt.latency}ms) observed on circuit to {pkt.destinationNodeId}"
                ))
            else:
                desc = "Gateway transmitted telemetry packet"
                if "SENSOR" in pkt.sourceNodeId:
                    desc = "Sensor updated real-time monitoring payload"
                elif "MEDICAL" in pkt.sourceNodeId:
                    desc = "Medical Device performed secure HTTPS handshake"
                
                events.append(ActivityEvent(
                    eventId=f"ev-pkt-{pkt.packetId}",
                    timestamp=pkt.timestamp,
                    eventType="PACKET_TX",
                    severity="INFO",
                    sourceNode=pkt.sourceNodeId,
                    destinationNode=pkt.destinationNodeId,
                    protocol=pkt.protocol,
                    description=f"{desc} ({pkt.packetSize} B via {pkt.protocol})"
                ))

        # Check nodes for OFFLINE alerts
        all_nodes = await node_service.list_nodes()
        nodes = all_nodes[:20]
        for n in nodes:
            if n.status == SimulationNodeStatus.OFFLINE:
                events.append(ActivityEvent(
                    eventId=f"ev-off-{n.id}",
                    timestamp=n.updatedAt.isoformat() if hasattr(n.updatedAt, "isoformat") else now_iso,
                    eventType="ALERT",
                    severity="WARNING",
                    sourceNode=n.nodeName,
                    description=f"Informational Alert: Node {n.nodeName} is currently OFFLINE or unreachable"
                ))
            elif n.signalStrength < -88.0 and n.status == SimulationNodeStatus.ONLINE:
                events.append(ActivityEvent(
                    eventId=f"ev-sig-{n.id}",
                    timestamp=now_iso,
                    eventType="ALERT",
                    severity="WARNING",
                    sourceNode=n.nodeName,
                    description=f"Low RSSI radio signal alert ({n.signalStrength} dBm) detected near cell boundary"
                ))

        # Sort by timestamp descending
        events.sort(key=lambda x: x.timestamp, reverse=True)
        return events[:15]

    async def _compile_feature_stream(self) -> List[ExtractedFeatureItem]:
        """Fetch latest extracted mathematical feature vectors from Module 2 Edge Server."""
        features_res = await edge_service.list_features()
        items: List[ExtractedFeatureItem] = []
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Pull latest communication events from Edge Server to correlate parameters
        events_res = await edge_service.list_events()
        events_list = events_res.get("data", [])

        for i, ev in enumerate(events_list[:10]):
            items.append(ExtractedFeatureItem(
                featureId=f"ext-{ev.eventId}",
                protocol=str(ev.protocol),
                packetSize=ev.packetSize,
                latency=ev.latency,
                bandwidth=ev.bandwidth,
                signalStrength=ev.signalStrength,
                communicationCount=random.randint(1, 45),
                transmissionTime=round(ev.latency * 0.8, 2),
                extractionTime=ev.receivedAt.isoformat() if hasattr(ev.receivedAt, "isoformat") else str(ev.receivedAt),
                sourceNode=ev.sourceNodeId,
                destinationNode=ev.destinationNodeId,
            ))
        return items

    async def get_statistics_trend(self) -> DashboardStatisticsResponse:
        """Return time-series trend arrays and protocol distributions for real-time chart rendering."""
        comm_stats = await communication_service.get_statistics()
        proto_dist = comm_stats.protocolDistribution

        return DashboardStatisticsResponse(
            success=True,
            packetsPerSecondTrend=ChartSeriesData(
                timestamps=[t[0] for t in self._chart_history["pps"]],
                values=[t[1] for t in self._chart_history["pps"]]
            ),
            bandwidthUsageTrend=ChartSeriesData(
                timestamps=[t[0] for t in self._chart_history["bandwidth"]],
                values=[t[1] for t in self._chart_history["bandwidth"]]
            ),
            latencyTrend=ChartSeriesData(
                timestamps=[t[0] for t in self._chart_history["latency"]],
                values=[t[1] for t in self._chart_history["latency"]]
            ),
            signalStrengthTrend=ChartSeriesData(
                timestamps=[t[0] for t in self._chart_history["signal"]],
                values=[t[1] for t in self._chart_history["signal"]]
            ),
            protocolDistribution=proto_dist,
            communicationVolume=ChartSeriesData(
                timestamps=[t[0] for t in self._chart_history["volume"]],
                values=[t[1] for t in self._chart_history["volume"]]
            ),
        )

    async def control_simulation(self, req: SimulationControlRequest) -> SimulationStatus:
        """Handle interactive simulation command console instructions (Start, Pause, Resume, Reset, Tuning)."""
        action = req.action.upper()
        logger.info(f"Received Simulation Control Command: [{action}] (Speed: {req.speedMultiplier}x, Freq: {req.packetFrequency}s)")

        if action in ["PAUSE"]:
            self._sim_paused = True
            await node_sim_daemon.stop()
            await edge_sim_daemon.stop()
            await comm_sim_daemon.stop()
            logger.info("Simulation Daemons PAUSED by user control command.")
        
        elif action in ["START", "RESUME"]:
            self._sim_paused = False
            await node_sim_daemon.start()
            await edge_sim_daemon.start()
            await comm_sim_daemon.start()
            logger.info("Simulation Daemons RESUMED / STARTED by user control command.")

        elif action in ["RESET"]:
            self._sim_paused = False
            # Force trigger fresh traffic cycles and reset parameters to default
            self._speed_multiplier = 1.0
            comm_sim_daemon.interval = 3.5
            edge_sim_daemon._interval_sec = 4.0
            await node_sim_daemon.start()
            await edge_sim_daemon.start()
            await comm_sim_daemon.start()
            await traffic_generator.simulate_traffic_cycle()
            logger.info("Simulation Daemons RESET to baseline operational defaults.")

        if req.speedMultiplier is not None:
            self._speed_multiplier = float(req.speedMultiplier)
            # Adjust interval durations inversely proportional to speed multiplier
            base_comm_int = 3.5
            base_edge_int = 4.0
            comm_sim_daemon.interval = max(0.5, round(base_comm_int / self._speed_multiplier, 1))
            edge_sim_daemon._interval_sec = max(0.5, round(base_edge_int / self._speed_multiplier, 1))
            logger.info(f"Updated simulation speed to {self._speed_multiplier}x (Communication interval: {comm_sim_daemon.interval}s).")

        if req.packetFrequency is not None:
            comm_sim_daemon.interval = float(req.packetFrequency)
        if req.communicationInterval is not None:
            edge_sim_daemon._interval_sec = float(req.communicationInterval)

        overview = await self.get_overview()
        return SimulationStatus(
            running=(node_sim_daemon._running or comm_sim_daemon.running) and not self._sim_paused,
            paused=self._sim_paused,
            speedMultiplier=self._speed_multiplier,
            nodeCount=overview.totalNodes,
            packetFrequency=comm_sim_daemon.interval,
            communicationInterval=edge_sim_daemon._interval_sec,
        )

    async def export_data(self, resource: str, export_format: str) -> Tuple[str, str, str]:
        """
        Generate structured CSV or JSON exports for Communication Sessions, Packet Logs, and Extracted Features.
        Returns: (file_content_str, content_type, suggested_filename)
        """
        resource = resource.lower()
        export_format = export_format.lower()
        now_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

        if resource == "sessions":
            sessions, _ = await communication_service.list_sessions(limit=500)
            filename = f"trustchain_sessions_{now_str}"
            if export_format == "csv":
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(["sessionId", "sourceNodeId", "destinationNodeId", "protocol", "trafficType", "status", "bytesTransferred", "packetsSent", "averageLatency", "startTime"])
                for s in sessions:
                    writer.writerow([s.sessionId, s.sourceNodeId, s.destinationNodeId, s.protocol, s.trafficType, str(s.status), s.bytesTransferred, s.packetsSent, s.averageLatency, s.startTime])
                return (output.getvalue(), "text/csv", f"{filename}.csv")
            else:
                data_list = [s.model_dump() for s in sessions]
                return (json.dumps(data_list, indent=2), "application/json", f"{filename}.json")

        elif resource == "packets":
            packets, _ = await communication_service.list_packets(limit=500)
            filename = f"trustchain_packets_{now_str}"
            if export_format == "csv":
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(["packetId", "sessionId", "sourceNodeId", "destinationNodeId", "sequenceNumber", "packetSize", "protocol", "latency", "bandwidth", "timestamp", "status"])
                for p in packets:
                    writer.writerow([p.packetId, p.sessionId, p.sourceNodeId, p.destinationNodeId, p.sequenceNumber, p.packetSize, p.protocol, p.latency, p.bandwidth, p.timestamp, str(p.status)])
                return (output.getvalue(), "text/csv", f"{filename}.csv")
            else:
                data_list = [p.model_dump() for p in packets]
                return (json.dumps(data_list, indent=2), "application/json", f"{filename}.json")

        elif resource == "features":
            features_res = await edge_service.list_features()
            features_list = features_res.get("data", [])
            filename = f"trustchain_extracted_features_{now_str}"
            if export_format == "csv":
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(["nodeId", "communicationCount", "avgPacketSize", "avgLatency", "avgBandwidth", "avgSignal", "norm_latency", "norm_signal", "lastUpdated"])
                for f in features_list:
                    norm_lat = f.normalizedFeatures.get("norm_latency", 0.0) if hasattr(f, "normalizedFeatures") and isinstance(f.normalizedFeatures, dict) else 0.0
                    norm_sig = f.normalizedFeatures.get("norm_signal", 0.0) if hasattr(f, "normalizedFeatures") and isinstance(f.normalizedFeatures, dict) else 0.0
                    writer.writerow([f.nodeId, f.communicationCount, f.avgPacketSize, f.avgLatency, f.avgBandwidth, f.avgSignal, norm_lat, norm_sig, str(f.lastUpdated)])
                return (output.getvalue(), "text/csv", f"{filename}.csv")
            else:
                data_list = [f.model_dump() for f in features_list]
                return (json.dumps(data_list, indent=2), "application/json", f"{filename}.json")

        raise ValueError(f"Unsupported export resource category: {resource}")


# Singleton export
dashboard_service = DashboardService()
