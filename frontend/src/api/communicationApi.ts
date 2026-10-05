/**
 * TrustChain-5G Module 3 Communication Engine & Traffic Generation API Client.
 * Routes directly to '/api/communication' to inspect sessions, packets, streaming feeds, and KPIs.
 */

import axios from 'axios';
import { API_BASE } from '@/constants';

const ROOT_API = API_BASE.replace(/\/v1\/?$/, '');

const commClient = axios.create({
  baseURL: ROOT_API,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
});

commClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('trustchain_token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export interface SessionQueryParams {
  limit?: number;
  offset?: number;
  status?: string;
  source?: string;
  target?: string;
}

export interface PacketQueryParams {
  limit?: number;
  offset?: number;
  sessionId?: string;
  protocol?: string;
}

export const communicationApi = {
  listSessions: (params?: SessionQueryParams) => commClient.get('/communication/sessions', { params }),
  getSession: (id: string) => commClient.get(`/communication/sessions/${id}`),
  listPackets: (params?: PacketQueryParams) => commClient.get('/communication/packets', { params }),
  getPacket: (id: string) => commClient.get(`/communication/packets/${id}`),
  getLiveFeed: () => commClient.get('/communication/live'),
  getStatistics: () => commClient.get('/communication/statistics'),
};
