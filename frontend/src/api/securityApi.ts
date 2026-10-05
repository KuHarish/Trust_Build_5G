import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const SECURITY_API = `${API_BASE_URL}/api/v1/security`;

export const securityApi = {
  getDecisions: () => axios.get(`${SECURITY_API}/decisions`),
  getActions: () => axios.get(`${SECURITY_API}/actions`),
  getPolicies: () => axios.get(`${SECURITY_API}/policies`),
  getNodeStates: () => axios.get(`${SECURITY_API}/node-states`),
  evaluate: (evidence: any) => axios.post(`${SECURITY_API}/evaluate`, evidence),
  simulatePolicy: (policyId: string, evidence: any) => axios.post(`${SECURITY_API}/policies/${policyId}/simulate`, evidence),
  activatePolicy: (policyId: string) => axios.post(`${SECURITY_API}/policies/${policyId}/activate`),
  getAuditTimeline: (correlationId: string) => axios.get(`${SECURITY_API}/audit/timeline/${correlationId}`),
  getNodeAuditHistory: (nodeId: string) => axios.get(`${SECURITY_API}/audit/node/${nodeId}`)
};
