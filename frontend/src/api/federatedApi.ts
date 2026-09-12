import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const FEDERATED_API = `${API_BASE_URL}/api/v1/ml/federated`;

const api = axios.create({
  baseURL: FEDERATED_API,
});

export const federatedApi = {
  startTraining: async (config: any) => {
    const response = await api.post('/start', config);
    return response.data;
  },
  
  stopTraining: async () => {
    const response = await api.post('/stop');
    return response.data;
  },
  
  getStatus: async () => {
    const response = await api.get('/status');
    return response.data;
  },
  
  getClients: async () => {
    const response = await api.get('/clients');
    return response.data;
  },
  
  getRounds: async (jobId?: string) => {
    const response = await api.get('/rounds', { params: { jobId } });
    return response.data;
  }
};
