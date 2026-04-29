import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const FASTAPI_BASE_URL = 'http://localhost:8000';

// Create axios instance for Spring Boot backend
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for FastAPI backend
export const fastApiClient = axios.create({
  baseURL: FASTAPI_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle API errors globally
const handleApiError = (error: AxiosError, context: string) => {
  console.error(`API Error (${context}):`, error);

  if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  } else if (error.response?.status === 403) {
    toast.error('You do not have permission to perform this action');
  } else if (error.response?.status === 404) {
    toast.error('Resource not found');
  } else if (error.response?.status >= 500) {
    toast.error('Server error. Please try again later');
  } else {
    toast.error(error.response?.data?.message || `Error: ${context}`);
  }
};

// ============================================================================
// Lead APIs
// ============================================================================
export const LeadAPI = {
  getLeads: async (page = 1, size = 10, search = '') => {
    try {
      const response = await apiClient.get('/api/v1/leads', {
        params: { page, size, search },
      });
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError, 'Failed to fetch leads');
      throw error;
    }
  },

  getLead: async (id: string) => {
    try {
      const response = await apiClient.get(`/api/v1/leads/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError, 'Failed to fetch lead');
      throw error;
    }
  },

  createLead: async (data: any) => {
    try {
      const response = await apiClient.post('/api/v1/leads', data);
      toast.success('Lead created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError, 'Failed to create lead');
      throw error;
    }
  },

  updateLead: async (id: string, data: any) => {
    try {
      const response = await apiClient.put(`/api/v1/leads/${id}`, data);
      toast.success('Lead updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError, 'Failed to update lead');
      throw error;
    }
  },
};

// ============================================================================
// Property APIs
// ============================================================================
export const PropertyAPI = {
  getProperties: async (page = 1, size = 12) => {
    try {
      const response = await apiClient.get('/api/v1/properties', {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError, 'Failed to fetch properties');
      throw error;
    }
  },

  getProperty: async (id: string) => {
    try {
      const response = await apiClient.get(`/api/v1/properties/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError, 'Failed to fetch property');
      throw error;
    }
  },
};

// ============================================================================
// Visits APIs
// ============================================================================
export const VisitAPI = {
  getVisits: async (page = 1, size = 10, status?: string) => {
    try {
      const response = await apiClient.get('/api/v1/visits', {
        params: { page, size, status },
      });
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError, 'Failed to fetch visits');
      throw error;
    }
  },

  createVisit: async (data: any) => {
    try {
      const response = await apiClient.post('/api/v1/visits', data);
      toast.success('Visit scheduled successfully');
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError, 'Failed to schedule visit');
      throw error;
    }
  },

  updateVisit: async (id: string, data: any) => {
    try {
      const response = await apiClient.put(`/api/v1/visits/${id}`, data);
      toast.success('Visit updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError, 'Failed to update visit');
      throw error;
    }
  },
};

// ============================================================================
// Analytics APIs
// ============================================================================
export const AnalyticsAPI = {
  queryData: async (queryText: string) => {
    try {
      const response = await apiClient.post('/api/v1/analytics/query', {
        queryText,
      });
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError, 'Failed to execute query');
      throw error;
    }
  },

  exportData: async (format = 'xlsx') => {
    try {
      const response = await apiClient.get('/api/v1/analytics/export', {
        params: { format },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError, 'Failed to export data');
      throw error;
    }
  },
};

// ============================================================================
// Settings APIs
// ============================================================================
export const SettingsAPI = {
  getBotConfig: async () => {
    try {
      const response = await apiClient.get('/api/v1/settings/bot-config');
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError, 'Failed to fetch settings');
      throw error;
    }
  },

  updateBotConfig: async (data: any) => {
    try {
      const response = await apiClient.put('/api/v1/settings/bot-config', data);
      return response.data;
    } catch (error) {
      // Silently fail - frontend already saved to localStorage
      console.log('[Settings API] Backend sync failed (using localStorage)', (error as AxiosError).status);
      throw error;
    }
  },
};

// ============================================================================
// Chat/AI APIs
// ============================================================================
export const ChatAPI = {
  sendMessage: async (message: string) => {
    try {
      const response = await fastApiClient.post('/chat', {
        message,
        tenant_id: 'black',
        whatsapp_number: 'dashboard_user',
      });
      return response.data;
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  },
};

export default apiClient;
