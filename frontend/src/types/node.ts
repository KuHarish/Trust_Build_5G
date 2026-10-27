/**
 * TrustChain-5G Module 1 - Network Node Simulation TypeScript Interfaces.
 * Matches backend Pydantic models in app/simulator/models/node.py.
 */

export type SimulationNodeType =
  // 5G Network Infrastructure Classifications
  | 'Core / Server Node'
  | 'Aggregation Node'
  | 'Gateway Node'
  | 'Edge Processing Node'
  | 'Edge / IoT Node'
  // 5G Physical & IoT Device Categories
  | 'Smartphone'
  | 'IoT Sensor'
  | 'Edge Device'
  | 'Gateway'
  | 'Autonomous Vehicle'
  | 'Industrial Device'
  | 'Medical Device'
  | 'Drone'
  | (string & {});

export type SimulationNodeStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ONLINE'
  | 'OFFLINE'
  | 'BUSY'
  | 'SLEEPING'
  | 'MAINTENANCE';

export interface SimulationNode {
  id: string;
  nodeName: string;
  nodeType: SimulationNodeType;
  deviceCategory: string;
  status: SimulationNodeStatus;
  ipAddress: string;
  macAddress: string;
  latitude: number;
  longitude: number;
  signalStrength: number;
  bandwidth: number;
  latency: number;
  batteryLevel: number;
  firmwareVersion: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
  connections?: number;
  relationships?: Array<{ targetId: string; relationshipType: string }>;
  metadata?: Record<string, unknown>;
}

export interface NodeCreateInput {
  nodeName: string;
  nodeType: SimulationNodeType;
  deviceCategory?: string;
  status?: SimulationNodeStatus;
  ipAddress: string;
  macAddress: string;
  latitude: number;
  longitude: number;
  signalStrength?: number;
  bandwidth?: number;
  latency?: number;
  batteryLevel?: number;
  firmwareVersion?: string;
  connections?: number;
  metadata?: Record<string, unknown>;
}

export type NodeUpdateInput = Partial<NodeCreateInput>;

export interface NodeStatistics {
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  nodeTypes: Record<string, number>;
  averageSignalStrength: number;
}
