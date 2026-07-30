"""
TrustChain-5G Module 2: Edge Server & Feature Extraction Service Engine.
Preprocesses communication traffic events, applies mathematical feature extraction pipelines,
and prepares normalized parameters for downstream Module 3 (Trust) and Module 4 (FL/ML) ingestion.
"""
import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict
from app.edge.models.event import CommunicationEvent, EventStatus
from app.edge.models.feature import NetworkFeature
from app.edge.schemas.event import EventCreateRequest, EdgeStatisticsResponse
from app.edge.repositories.edge_repository import edge_repository
from app.edge.utils.feature_math import update_running_average, compute_normalized_features

logger = logging.getLogger("trustchain.edge.service")

class EdgeService:
    def __init__(self, repo=edge_repository):
        self.repo = repo
        self._start_time = datetime.now(timezone.utc)

    async def process_and_store_event(self, req: EventCreateRequest) -> CommunicationEvent:
        """
        Ingest, validate, and preprocess a communication event, then trigger feature extraction updates.
        """
        # Calculate derived payload and transmission time if unspecified
        packet_size = req.packetSize
        payload_size = req.payloadSize if req.payloadSize is not None else max(1.0, round(packet_size * 0.82, 2))
        
        if req.transmissionTime is not None:
            transmission_time = req.transmissionTime
        else:
            # Physical bit transmission duration over bandwidth channel: bits / (Mbps * 1000)
            transmission_time = round(max(0.2, (packet_size * 8.0) / max(10.0, req.bandwidth * 1000.0)), 4)
            
        event = CommunicationEvent(
            sourceNodeId=req.sourceNodeId,
            destinationNodeId=req.destinationNodeId,
            protocol=req.protocol,
            packetSize=packet_size,
            payloadSize=payload_size,
            hopCount=req.hopCount,
            ttl=req.ttl,
            bandwidth=req.bandwidth,
            latency=req.latency,
            jitter=req.jitter,
            signalStrength=req.signalStrength,
            transmissionTime=transmission_time,
            status=req.status,
            metadata=req.metadata,
        )

        # 1. Store Communication Event in database/memory store
        stored_event = await self.repo.insert_event(event)

        # 2. Extract & update features for both communicating entities
        await self._extract_node_features(req.sourceNodeId, stored_event)
        await self._extract_node_features(req.destinationNodeId, stored_event)

        return stored_event

    async def _extract_node_features(self, node_id: str, event: CommunicationEvent) -> NetworkFeature:
        """
        Applies mathematical running averages and zero-to-one normalizations to active node features.
        """
        feature = await self.repo.get_feature_by_node(node_id)
        if not feature:
            feature = NetworkFeature(nodeId=node_id)

        current_count = feature.communicationCount

        # Update rolling averages
        feature.avgPacketSize = update_running_average(feature.avgPacketSize, current_count, event.packetSize)
        feature.avgPayloadSize = update_running_average(feature.avgPayloadSize, current_count, event.payloadSize)
        feature.avgLatency = update_running_average(feature.avgLatency, current_count, event.latency)
        feature.avgBandwidth = update_running_average(feature.avgBandwidth, current_count, event.bandwidth)
        feature.avgJitter = update_running_average(feature.avgJitter, current_count, event.jitter)
        feature.avgSignalStrength = update_running_average(feature.avgSignalStrength, current_count, event.signalStrength)
        feature.avgTtl = update_running_average(feature.avgTtl, current_count, float(event.ttl))
        feature.avgHopCount = update_running_average(feature.avgHopCount, current_count, float(event.hopCount))
        
        # Accumulate connection duration
        feature.connectionDuration = round(feature.connectionDuration + (event.transmissionTime / 1000.0) + (event.latency / 1000.0), 4)

        # Update protocol distribution mapping
        proto_key = event.protocol.value
        feature.protocolDistribution[proto_key] = feature.protocolDistribution.get(proto_key, 0) + 1

        # Increment total event tally
        feature.communicationCount += 1

        # Update transmission success rate
        is_success = 1.0 if event.status == EventStatus.SUCCESS else 0.0
        feature.transmissionSuccessRate = update_running_average(feature.transmissionSuccessRate, current_count, is_success)

        # Estimate packet frequency (packets / second since server ignition)
        uptime_sec = max(1.0, (datetime.now(timezone.utc) - self._start_time).total_seconds())
        feature.packetFrequency = round(feature.communicationCount / uptime_sec, 4)
        feature.timestamp = datetime.now(timezone.utc).isoformat()

        # Re-compute downstream AI/ML and Trust zero-to-one normalized parameter matrix
        feature.normalizedFeatures = compute_normalized_features(
            avg_latency=feature.avgLatency,
            avg_bandwidth=feature.avgBandwidth,
            avg_signal_strength=feature.avgSignalStrength,
            avg_jitter=feature.avgJitter,
            success_rate=feature.transmissionSuccessRate,
            avg_packet_size=feature.avgPacketSize
        )

        await self.repo.upsert_feature(feature)
        return feature

    async def list_events(
        self, limit: int = 50, offset: int = 0, search: Optional[str] = None, protocol: Optional[str] = None
    ) -> Tuple[List[CommunicationEvent], int]:
        return await self.repo.list_events(limit=limit, offset=offset, search=search, protocol=protocol)

    async def get_event(self, event_id: str) -> Optional[CommunicationEvent]:
        return await self.repo.get_event_by_id(event_id)

    async def delete_event(self, event_id: str) -> bool:
        return await self.repo.delete_event(event_id)

    async def list_features(self) -> List[NetworkFeature]:
        return await self.repo.list_features()

    async def get_node_feature(self, node_id: str) -> Optional[NetworkFeature]:
        return await self.repo.get_feature_by_node(node_id)

    async def get_statistics(self) -> EdgeStatisticsResponse:
        """
        Aggregate overall network traffic KPIs from stored events and extracted node features.
        """
        total_events = await self.repo.count_total_events()
        features = await self.repo.list_features()
        active_nodes = len(features)
        
        uptime_sec = max(1.0, (datetime.now(timezone.utc) - self._start_time).total_seconds())
        events_per_sec = round(total_events / uptime_sec, 2)

        if active_nodes == 0:
            return EdgeStatisticsResponse(
                totalEvents=0,
                eventsPerSecond=0.0,
                averagePacketSize=0.0,
                averageLatency=0.0,
                averageBandwidth=0.0,
                protocolDistribution={},
                activeNodes=0,
                averageSignalStrength=-65.0,
                success=True,
            )

        sum_packet_size = sum(f.avgPacketSize for f in features)
        sum_latency = sum(f.avgLatency for f in features)
        sum_bandwidth = sum(f.avgBandwidth for f in features)
        sum_signal = sum(f.avgSignalStrength for f in features)
        
        merged_protocols: Dict[str, int] = {}
        for f in features:
            for p, count in f.protocolDistribution.items():
                merged_protocols[p] = merged_protocols.get(p, 0) + count

        return EdgeStatisticsResponse(
            totalEvents=total_events,
            eventsPerSecond=events_per_sec,
            averagePacketSize=round(sum_packet_size / active_nodes, 2),
            averageLatency=round(sum_latency / active_nodes, 2),
            averageBandwidth=round(sum_bandwidth / active_nodes, 2),
            protocolDistribution=merged_protocols,
            activeNodes=active_nodes,
            averageSignalStrength=round(sum_signal / active_nodes, 2),
            success=True,
        )

edge_service = EdgeService()
