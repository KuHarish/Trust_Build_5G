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
};

export const trustApi = {
  getScores: () => apiClient.get('/trust/scores'),
  getHistory: (nodeId: string) => apiClient.get(`/trust/history/${nodeId}`),
};

export const blockchainApi = {
  getBlocks: (page = 1) => apiClient.get(`/blockchain/blocks?page=${page}`),
};

export const mlApi = {
  evaluate: (payload: Record<string, unknown>) => apiClient.post('/ml/evaluate', payload),
};

export const federatedApi = {
  getModels: () => apiClient.get('/federated/models'),
};

export const securityApi = {
  mitigate: (nodeId: string, action: string) => apiClient.post(`/security/mitigate/${nodeId}?action=${action}`),
};

export const analyticsApi = {
  getSummary: (timeWindow = '24h') => apiClient.get(`/analytics/summary?time_window=${timeWindow}`),
};
