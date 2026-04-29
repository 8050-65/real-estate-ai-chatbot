import axios, { AxiosInstance } from 'axios';

// Use Next.js API route proxy for browser requests
// /api/proxy/fastapi/* -> http://localhost:8000/*
const FASTAPI_BASE_URL = '/api/proxy/fastapi';

const fastApiClient: AxiosInstance = axios.create({
  baseURL: FASTAPI_BASE_URL,
  timeout: 10000,
});

// Log all requests/responses for debugging
fastApiClient.interceptors.request.use(
  (config) => {
    console.log(`[FastAPI] ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
    });
    return config;
  },
  (error) => Promise.reject(error)
);

fastApiClient.interceptors.response.use(
  (response) => {
    console.log(`[FastAPI Response] Status ${response.status}`, response.data);
    return response;
  },
  (error) => {
    console.warn('[FastAPI Error]', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
    });
    return Promise.reject(error);
  }
);

export default fastApiClient;
