/**
 * TrustChain-5G Module 2 - Edge Server & Feature Extraction TypeScript Interfaces.
 */

export type EventProtocol = 'TCP' | 'UDP' | 'HTTP' | 'HTTPS' | 'ICMP' | 'MQTT' | 'CoAP';
export type EventStatus = 'SUCCESS' | 'DROPPED' | 'DELAYED' | 'RETRANSMIT';

export interface CommunicationEvent {
  eventId: string;
  sourceNodeId: string;
  destinationNodeId: string;
  protocol: EventProtocol;
  timestamp: string;
  packetSize: number;
  payloadSize: number;
  hopCount: number;
  ttl: number;
  bandwidth: number;
  latency: number;
  jitter: number;
  signalStrength: number;
  transmissionTime: number;
  status: EventStatus;
  metadata?: Record<string, unknown>;
}

export interface NetworkFeature {
  nodeId: string;
  timestamp: string;
  communicationCount: number;
  avgPacketSize: number;
  avgPayloadSize: number;
  avgLatency: number;
  avgBandwidth: number;
  avgJitter: number;
  avgSignalStrength: number;
  avgTtl: number;
  avgHopCount: number;
  transmissionSuccessRate: number;
  packetFrequency: number;
  connectionDuration: number;
  protocolDistribution: Record<string, number>;
  normalizedFeatures: {
    norm_latency?: number;
    norm_bandwidth?: number;
    norm_signal?: number;
    norm_jitter?: number;
    norm_success_rate?: number;
    norm_packet_size?: number;
    [key: string]: number | undefined;
  };
}

export interface EdgeStatistics {
  totalEvents: number;
  eventsPerSecond: number;
  averagePacketSize: number;
  averageLatency: number;
  averageBandwidth: number;
  protocolDistribution: Record<string, number>;
  activeNodes: number;
  averageSignalStrength: number;
  success: boolean;
}

export interface EventFilterParams {
  limit?: number;
  offset?: number;
  search?: string;
  protocol?: string;
}
