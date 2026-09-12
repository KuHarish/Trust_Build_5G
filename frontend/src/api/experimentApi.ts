import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const EXPERIMENT_API = `${API_BASE_URL}/api/v1/ml/experiments`;

export const experimentApi = {
  createExperiment: (data: any) => axios.post(EXPERIMENT_API, data),
  runExperiment: (id: string) => axios.post(`${EXPERIMENT_API}/${id}/run`),
  listExperiments: () => axios.get(EXPERIMENT_API),
  getExperiment: (id: string) => axios.get(`${EXPERIMENT_API}/${id}`),
  getComparison: (id: string) => axios.get(`${EXPERIMENT_API}/comparison/${id}`)
};
