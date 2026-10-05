/**
 * TrustChain-5G Module 1 Node Simulation API Client.
 * Routes directly to '/api/nodes' as specified in Sprint 1.1 architecture.
 */

import axios from 'axios';
import { API_BASE } from '@/constants';
import { NodeCreateInput, NodeUpdateInput, SimulationNodeStatus } from '@/types/node';

// Derive root API base path (strips any ending /v1 to match exact /api/nodes requirement)
const ROOT_API = API_BASE.replace(/\/v1\/?$/, '');

const nodeClient = axios.create({
  baseURL: ROOT_API,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
});

nodeClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('trustchain_token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const simulationNodeApi = {
  getStatistics: () => nodeClient.get('/nodes/statistics'),
  listNodes: (params?: Record<string, unknown>) => nodeClient.get('/nodes', { params }),
  getNode: (id: string) => nodeClient.get(`/nodes/${id}`),
  createNode: (data: NodeCreateInput) => nodeClient.post('/nodes', data),
  updateNode: (id: string, data: NodeUpdateInput) => nodeClient.put(`/nodes/${id}`, data),
  updateStatus: (id: string, status: SimulationNodeStatus) => nodeClient.patch(`/nodes/${id}/status`, { status }),
  deleteNode: (id: string) => nodeClient.delete(`/nodes/${id}`),
};
