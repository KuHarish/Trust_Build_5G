/**
 * TrustChain-5G Module 1 Node Simulation API Client.
 * Routes directly to '/api/nodes' as specified in Sprint 1.1 architecture.
 */

import axios from 'axios';
import { API_BASE } from '@/constants';
import { NodeCreateInput, NodeUpdateInput, SimulationNodeStatus } from '@/types/node';

// Derive root API base path (strips any ending /v1 to match exact /api/nodes requirement)
const normalizedBase = API_BASE.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
const BASE_NODES_URL = `${normalizedBase}/nodes`;

const nodeClient = axios.create({
  baseURL: BASE_NODES_URL,
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
  getStatistics: () => nodeClient.get('/statistics'),
  listNodes: (params?: Record<string, unknown>) => nodeClient.get('', { params }),
  getNode: (id: string) => nodeClient.get(`/${id}`),
  createNode: (data: NodeCreateInput) => nodeClient.post('', data),
  updateNode: (id: string, data: NodeUpdateInput) => nodeClient.put(`/${id}`, data),
  updateStatus: (id: string, status: SimulationNodeStatus) => nodeClient.patch(`/${id}/status`, { status }),
  deleteNode: (id: string) => nodeClient.delete(`/${id}`),
};
