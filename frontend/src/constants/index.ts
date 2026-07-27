/**
 * TrustChain-5G Application Constants & Navigation Settings.
 */
import { NavItem, MetricWidgetData } from '@/types';

export const APP_TITLE = 'TrustChain-5G';
export const APP_SUBTITLE = 'Intelligent Cybersecurity Command Platform';
export const API_BASE = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const SIDEBAR_NAVIGATION: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', iconName: 'LayoutDashboard' },
  { label: 'Network', path: '/network', iconName: 'Network' },
  { label: 'Traffic', path: '/traffic', iconName: 'Activity', badge: 'LIVE', badgeColor: 'accent' },
  { label: 'Attacks', path: '/attacks', iconName: 'ShieldAlert', badge: 2, badgeColor: 'danger' },
  { label: 'Trust Engine', path: '/trust', iconName: 'ShieldCheck', badge: '98%', badgeColor: 'success' },
  { label: 'Machine Learning', path: '/ml', iconName: 'Cpu' },
  { label: 'Federated Learning', path: '/federated', iconName: 'Share2' },
  { label: 'Blockchain', path: '/blockchain', iconName: 'Boxes' },
  { label: 'Security Controller', path: '/security', iconName: 'Lock' },
  { label: 'Analytics', path: '/analytics', iconName: 'BarChart3' },
  { label: 'Settings', path: '/settings', iconName: 'Settings' },
];

export const MOCK_DASHBOARD_METRICS: MetricWidgetData[] = [
  { id: '1', title: 'Network Trust Quotient', value: '96.8%', change: '+0.4% from yesterday', isPositive: true, icon: 'ShieldCheck' },
  { id: '2', title: 'Active 5G Entities', value: '1,240', change: 'All Slices Stable', isPositive: true, icon: 'Radio' },
  { id: '3', title: 'Intrusion Attempts (24h)', value: '142', change: '-12.5% vs previous week', isPositive: true, icon: 'ShieldAlert' },
  { id: '4', title: 'FL Global Round Accuracy', value: '98.2%', change: 'Round #42 Consensus Sealed', isPositive: true, icon: 'Cpu' },
];
