import { apiClient } from '../services/apiClient';
import {
  DashboardLiveResponse,
  DashboardStatisticsResponse,
  SimulationControlRequest,
  SimulationStatus,
  SystemOverview,
  NetworkHealthStatus,
} from '../types/dashboard';

/**
 * TrustChain-5G Module 4 Dashboard & System Integration REST Client.
 */
export const dashboardApi = {
  fetchOverview: async (): Promise<{ success: boolean; data: SystemOverview }> => {
    const response = await apiClient.get('/api/dashboard/overview');
    return response.data;
  },

  fetchHealth: async (): Promise<{ success: boolean; data: NetworkHealthStatus }> => {
    const response = await apiClient.get('/api/dashboard/health');
    return response.data;
  },

  fetchLiveFeed: async (): Promise<DashboardLiveResponse> => {
    const response = await apiClient.get('/api/dashboard/live');
    return response.data;
  },

  fetchStatisticsTrend: async (): Promise<DashboardStatisticsResponse> => {
    const response = await apiClient.get('/api/dashboard/statistics');
    return response.data;
  },

  sendSimulationCommand: async (cmd: SimulationControlRequest): Promise<SimulationStatus> => {
    const response = await apiClient.post('/api/dashboard/simulation/control', cmd);
    return response.data;
  },

  getExportEndpointUrl: (resource: 'sessions' | 'packets' | 'features', format: 'csv' | 'json'): string => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${baseUrl}/api/dashboard/export/${resource}?format=${format}`;
  },
};
