import { dashboardApi } from '../api/dashboardApi';
import {
  DashboardLiveResponse,
  DashboardStatisticsResponse,
  SimulationControlRequest,
  SimulationStatus,
  SystemOverview,
  NetworkHealthStatus,
} from '../types/dashboard';

/**
 * Service wrapper layer managing real-time dashboard data queries and browser CSV/JSON file downloads.
 */
export const dashboardService = {
  getOverview: async (): Promise<SystemOverview> => {
    const res = await dashboardApi.fetchOverview();
    return res.data;
  },

  getHealth: async (): Promise<NetworkHealthStatus> => {
    const res = await dashboardApi.fetchHealth();
    return res.data;
  },

  getLiveFeed: async (): Promise<DashboardLiveResponse> => {
    return await dashboardApi.fetchLiveFeed();
  },

  getStatistics: async (): Promise<DashboardStatisticsResponse> => {
    return await dashboardApi.fetchStatisticsTrend();
  },

  controlSimulation: async (req: SimulationControlRequest): Promise<SimulationStatus> => {
    return await dashboardApi.sendSimulationCommand(req);
  },

  triggerExportDownload: (resource: 'sessions' | 'packets' | 'features', format: 'csv' | 'json') => {
    const url = dashboardApi.getExportEndpointUrl(resource, format);
    // Create hidden link element to safely trigger browser file attachment download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trustchain_${resource}_log.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
