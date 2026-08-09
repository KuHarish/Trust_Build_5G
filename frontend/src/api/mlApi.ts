import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const ML_API = `${API_BASE_URL}/api/v1/ml`;

export interface DatasetProcessRequest {
  removeColumns?: string[];
  handleMissing?: string;
  handleInfinite?: string;
  removeDuplicates?: boolean;
  encodeCategorical?: boolean;
  scaleNumerical?: boolean;
  scalerType?: string;
  testSize?: number;
  valSize?: number;
  randomSeed?: number;
}

export const mlApi = {
  getDatasets: () => axios.get(`${ML_API}/datasets`),
  getDataset: (id: string) => axios.get(`${ML_API}/datasets/${id}`),
  registerDataset: (data: any) => axios.post(`${ML_API}/datasets/register`, data),
  processDataset: (id: string, config: DatasetProcessRequest) => axios.post(`${ML_API}/datasets/${id}/process`, config),
  getFeatures: () => axios.get(`${ML_API}/features`),
};
