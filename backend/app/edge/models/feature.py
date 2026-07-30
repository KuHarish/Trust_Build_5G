"""
TrustChain-5G Module 2: Edge Server & Feature Extraction - Extracted Network Features Model.
Designed strictly to provide preprocessed, mathematically aggregated, and normalized telemetry parameters
that can be directly consumed by Module 3 (Adaptive Trust Engine) and Module 4 (AI / FL) in future sprints.
"""
from datetime import datetime, timezone
from typing import Dict
from pydantic import BaseModel, Field

class NetworkFeature(BaseModel):
    nodeId: str = Field(..., description="UUID or designation name of the network node entity")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat(), description="Last calculation update timestamp")
    communicationCount: int = Field(default=0, description="Total communication events processed involving this node")
    avgPacketSize: float = Field(default=0.0, description="Rolling average transmitted packet size in bytes")
    avgPayloadSize: float = Field(default=0.0, description="Rolling average payload size in bytes")
    avgLatency: float = Field(default=0.0, description="Rolling average transit latency in milliseconds")
    avgBandwidth: float = Field(default=0.0, description="Rolling average throughput bandwidth in Mbps")
    avgJitter: float = Field(default=0.0, description="Rolling average jitter delay variation in milliseconds")
    avgSignalStrength: float = Field(default=0.0, description="Rolling average received signal strength in dBm")
    avgTtl: float = Field(default=64.0, description="Rolling average Time To Live value")
    avgHopCount: float = Field(default=1.0, description="Rolling average network router hops")
    transmissionSuccessRate: float = Field(default=1.0, description="Ratio of SUCCESS events to total transmissions (0.0 to 1.0)")
    packetFrequency: float = Field(default=0.0, description="Estimated packet transmission velocity (events per second)")
    connectionDuration: float = Field(default=0.0, description="Cumulative simulated operational connection time in seconds")
    protocolDistribution: Dict[str, int] = Field(default_factory=dict, description="Frequency counts of each network protocol utilized")
    
    # Normalized features specifically prepared for downstream AI/ML neural inputs and Trust Quotient weighting
    normalizedFeatures: Dict[str, float] = Field(
        default_factory=lambda: {
            "norm_latency": 0.0,      # 0.0 (fastest 5ms) to 1.0 (slowest >=100ms)
            "norm_bandwidth": 0.0,    # 0.0 (lowest 20Mbps) to 1.0 (highest 1000Mbps)
            "norm_signal": 1.0,       # 0.0 (-100 dBm weakest) to 1.0 (-30 dBm strongest)
            "norm_jitter": 0.0,       # 0.0 (0.1ms stable) to 1.0 (>=10ms unstable)
            "norm_success_rate": 1.0, # Directly maps 0.0 to 1.0
            "norm_packet_size": 0.5   # 0.0 (64B) to 1.0 (1500B)
        },
        description="Normalized zero-to-one bounded features ready for direct ingestion by Module 3 and Module 4"
    )
