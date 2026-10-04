/**
 * TrustChain-5G API Domain Endpoint Clients (Placeholder Scaffolds).
 * Organized cleanly by domain area per Sprint 0 architecture specifications.
 */

import { apiClient } from '@/services/apiClient';

export const authApi = {
  login: (data: Record<string, unknown>) => apiClient.post('/auth/login', data),
  forgotPassword: (email: string) => apiClient.post(`/auth/forgot-password?email=${email}`),
  resetPassword: (data: Record<string, unknown>) => apiClient.post('/auth/reset-password', data),
  getMe: () => apiClient.get('/auth/me'),
};

export const nodesApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/nodes', { params }),
  register: (data: Record<string, unknown>) => apiClient.post('/nodes', data),
};

export const trafficApi = {
  getLogs: (params?: Record<string, unknown>) => apiClient.get('/traffic/logs', { params }),
  getPackets: (params?: Record<string, unknown>) => apiClient.get('/traffic/packets', { params }),
};

export const attacksApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/attacks', { params }),
  getDetails: (attackId: string) => apiClient.get(`/attacks/${attackId}`),
};

export const trustApi = {
  getProfiles: () => apiClient.get('/trust/profiles'),
  getProfile: (nodeId: string) => apiClient.get(`/trust/profiles/${nodeId}`),
  getCurrentProfile: (nodeId: string) => apiClient.get(`/trust/${nodeId}/current`),
  getBehavior: (nodeId: string) => apiClient.get(`/trust/behavior/${nodeId}`),
  getHistory: (nodeId: string) => apiClient.get(`/trust/history/${nodeId}`),
  getCompliance: (nodeId: string) => apiClient.get(`/trust/compliance/${nodeId}`),
  getStatistics: () => apiClient.get('/trust/statistics'),
  getConfiguration: () => apiClient.get('/trust/configuration'),
  updateConfiguration: (data: Record<string, unknown>) => apiClient.put('/trust/configuration', data),
  evaluateNode: (nodeId: string) => apiClient.post(`/trust/${nodeId}/evaluate`),
  evaluateAll: () => apiClient.post('/trust/evaluate-all'),
};

export const blockchainApi = {
  getBlocks: (page = 1, eventType?: string) => {
    let url = `/blockchain/blocks?page=${page}`;
    if (eventType) url += `&event_type=${eventType}`;
    return apiClient.get(url);
  },
  getOverview: () => apiClient.get('/blockchain/overview'),
  validateChain: () => apiClient.get('/blockchain/validate'),
};

export const mlApi = {
  evaluate: (payload: Record<string, unknown>) => apiClient.post('/ml/evaluate', payload),
};

export const federatedApi = {
  getModels: () => apiClient.get('/federated/models'),
};

export const securityApi = {
  mitigate: (nodeId: string, action: string) => apiClient.post(`/security/mitigate/${nodeId}?action=${action}`),
  getAuditTimeline: (correlationId: string) => apiClient.get(`/security/audit/timeline/${correlationId}`),
  getNodeAuditHistory: (nodeId: string, limit = 50, skip = 0) => apiClient.get(`/security/audit/node/${nodeId}?limit=${limit}&skip=${skip}`),
};

export const analyticsApi = {
  getSummary: (timeWindow = '24h') => apiClient.get(`/analytics/summary?time_window=${timeWindow}`),
};
