import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const ML_API = `${API_BASE_URL}/api/v1/ml`;

export const mlModelApi = {
  // Training
  trainModel: (data: { datasetId: string; modelName: string; description: string; parameters: any }) => 
    axios.post(`${ML_API}/models/train`, data),
  getJobs: () => axios.get(`${ML_API}/training/jobs`),
  getJob: (jobId: string) => axios.get(`${ML_API}/training/jobs/${jobId}`),

  // Registry
  getModels: () => axios.get(`${ML_API}/models`),
  getModel: (modelId: string) => axios.get(`${ML_API}/models/${modelId}`),
  getModelMetrics: (modelId: string) => axios.get(`${ML_API}/models/${modelId}/metrics`),
  getConfusionMatrix: (modelId: string) => axios.get(`${ML_API}/models/${modelId}/confusion-matrix`),
  evaluateModel: (modelId: string) => axios.post(`${ML_API}/models/${modelId}/evaluate`),
  activateModel: (modelId: string) => axios.post(`${ML_API}/models/${modelId}/activate`),
  archiveModel: (modelId: string) => axios.post(`${ML_API}/models/${modelId}/archive`),
};
