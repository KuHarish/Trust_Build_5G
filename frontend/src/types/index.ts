/**
 * TrustChain-5G Enterprise TypeScript Domain Types.
 * Defines models for User Roles, Nodes, Threats, Trust Ledgers, and Navigation items.
 */

export type UserRole = 'Administrator' | 'Researcher' | 'Viewer';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string;
}

export type NodeStatus = 'Active' | 'Warning' | 'Compromised' | 'Offline' | 'Maintenance';

export type NodeType = 'gNodeB' | 'UPF' | 'AMF' | 'SMF' | 'EdgeServer' | 'IoTDevice' | 'CoreRouter';

export interface NetworkNode {
  _id: string;
  name: string;
  nodeType: NodeType;
  status: NodeStatus;
  ipAddress: string;
  location?: { lat: number; lng: number };
  bandwidthMbps: number;
  latencyMs: number;
  packetLossRate: number;
  currentTrustScore: number;
  lastPing: string;
  metadata?: Record<string, unknown>;
}

export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export interface AlertLog {
  _id: string;
  attackType: string;
  severity: SeverityLevel;
  targetNodeId: string;
  sourceIp?: string;
  detectedAt: string;
  confidenceScore: number;
  mitigationStatus: string;
  description?: string;
}

export interface MetricWidgetData {
  id: string;
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: string;
  series?: number[];
}

export type NotificationType = 'success' | 'danger' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

export interface NavItem {
  label: string;
  path: string;
  iconName: string;
  badge?: string | number;
  badgeColor?: 'primary' | 'danger' | 'warning' | 'success' | 'accent';
}

export * from './edge';
export * from './communication';
