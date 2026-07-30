/**
 * TrustChain-5G Module 2 Edge Server & Feature Extraction API Client.
 * Routes directly to '/api/edge' to query simulated communications and extracted feature metrics.
 */

import axios from 'axios';
import { API_BASE } from '@/constants';
import { EventFilterParams } from '@/types/edge';

const ROOT_API = API_BASE.replace(/\/v1\/?$/, '');

const edgeClient = axios.create({
  baseURL: ROOT_API,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
});

edgeClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('trustchain_token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const edgeApi = {
  getStatistics: () => edgeClient.get('/edge/statistics'),
  listEvents: (params?: EventFilterParams) => edgeClient.get('/edge/events', { params }),
  getEvent: (id: string) => edgeClient.get(`/edge/events/${id}`),
  deleteEvent: (id: string) => edgeClient.delete(`/edge/events/${id}`),
  listFeatures: () => edgeClient.get('/edge/features'),
  getNodeFeature: (nodeId: string) => edgeClient.get(`/edge/features/${nodeId}`),
};
