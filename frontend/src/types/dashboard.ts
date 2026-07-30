/**
 * TrustChain-5G Sprint 1.4: Real-Time Network Monitoring & System Integration TypeScript Types.
 * Defines models for system overview, network health indicators, live activity tickers, simulation controls, and analytics charts.
 */

export interface SystemOverview {
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  activeSessions: number;
  packetsPerSecond: number;
  eventsPerSecond: number;
  averageLatency: number;
  averageBandwidth: number;
  averageSignalStrength: number;
  featureExtractionRate: number;
}

export interface HealthCriteria {
  availability: number;
  latency: number;
  packetLoss: number;
  bandwidthUtilization: number;
  details: string[];
}

export type HealthStatusType = 'Healthy' | 'Warning' | 'Critical';

export interface NetworkHealthStatus {
  status: HealthStatusType;
  healthScore: number;
  criteria: HealthCriteria;
}

export interface ActivityEvent {
  eventId: string;
  timestamp: string;
  eventType: 'NODE_CONNECT' | 'NODE_DISCONNECT' | 'PACKET_TX' | 'SESSION_CREATE' | 'FEATURE_EXTRACT' | 'ALERT' | string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  sourceNode?: string;
  destinationNode?: string;
  protocol?: string;
  description: string;
}

export interface ExtractedFeatureItem {
  featureId: string;
  protocol: string;
  packetSize: number;
  latency: number;
  bandwidth: number;
  signalStrength: number;
  communicationCount: number;
  transmissionTime: number;
  extractionTime: string;
  sourceNode: string;
  destinationNode: string;
}

export interface SimulationStatus {
  running: boolean;
  paused: boolean;
  speedMultiplier: number;
  nodeCount: number;
  packetFrequency: number;
  communicationInterval: number;
}

export interface SimulationControlRequest {
  action: 'START' | 'PAUSE' | 'RESUME' | 'RESET' | 'TUNING' | string;
  speedMultiplier?: number;
  nodeCount?: number;
  packetFrequency?: number;
  communicationInterval?: number;
}

export interface DashboardLiveResponse {
  success: boolean;
  overview: SystemOverview;
  health: NetworkHealthStatus;
  recentEvents: ActivityEvent[];
  recentFeatures: ExtractedFeatureItem[];
  activeSessionsCount: number;
  simulationStatus: SimulationStatus;
}

export interface ChartSeriesData {
  timestamps: string[];
  values: number[];
}

export interface DashboardStatisticsResponse {
  success: boolean;
  packetsPerSecondTrend: ChartSeriesData;
  bandwidthUsageTrend: ChartSeriesData;
  latencyTrend: ChartSeriesData;
  signalStrengthTrend: ChartSeriesData;
  protocolDistribution: Record<string, number>;
  communicationVolume: ChartSeriesData;
}
