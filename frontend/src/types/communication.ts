/**
 * TrustChain-5G Module 3: Communication Engine & Traffic Generation TypeScript Domain Interfaces.
 * Defines models for interactive network sessions, packet transmission frames, real-time topology feeds, and KPI statistics.
 */

export type SessionStatus = 'ACTIVE' | 'CLOSED' | 'TIMEOUT';

export type TrafficType =
  | 'Heartbeat'
  | 'Telemetry'
  | 'File Transfer'
  | 'Sensor Data'
  | 'Control Messages'
  | 'Status Updates';

export type CommunicationProtocol = 'TCP' | 'UDP' | 'HTTP' | 'HTTPS' | 'ICMP' | 'MQTT' | 'CoAP';

export interface CommunicationSession {
  sessionId: string;
  sourceNodeId: string;
  destinationNodeId: string;
  protocol: string;
  trafficType: string;
  startTime: string;
  endTime?: string | null;
  status: SessionStatus | string;
  bytesTransferred: number;
  packetsSent: number;
  packetsReceived: number;
  averageLatency: number;
  averageBandwidth: number;
  signalStrength: number;
  metadata?: Record<string, unknown>;
}

export interface Packet {
  packetId: string;
  sessionId: string;
  sourceNodeId: string;
  destinationNodeId: string;
  sequenceNumber: number;
  packetSize: number;
  payloadSize: number;
  protocol: string;
  trafficType?: string;
  ttl: number;
  timestamp: string;
  latency: number;
  bandwidth: number;
  status: string;
  metadata?: Record<string, unknown>;
}

export interface SessionListResult {
  success: boolean;
  count: number;
  totalCount: number;
  data: CommunicationSession[];
}

export interface PacketListResult {
  success: boolean;
  count: number;
  totalCount: number;
  data: Packet[];
}

export interface LiveTrafficFeed {
  success: boolean;
  activeSessions: CommunicationSession[];
  recentPackets: Packet[];
}

export interface CommunicationStatistics {
  success: boolean;
  activeSessions: number;
  packetsPerSecond: number;
  totalPackets: number;
  averageSessionDuration: number;
  averageLatency: number;
  averageBandwidth: number;
  protocolDistribution: Record<string, number>;
}
