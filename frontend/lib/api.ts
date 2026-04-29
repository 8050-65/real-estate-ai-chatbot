import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = '/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Track if refresh is in progress to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (token: string | null, error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Function to refresh token
async function refreshToken(): Promise<string | null> {
  try {
    const email = localStorage.getItem('userEmail');
    const password = localStorage.getItem('userPassword');

    if (!email || !password) {
      console.error('[API] No credentials found for token refresh');
      return null;
    }

    console.log('[API] 🔄 Refreshing token...');

    const response = await axios.post('/api/v1/auth/login', {
      email,
      password,
    });

    const newToken = response.data?.data?.accessToken;
    if (newToken) {
      localStorage.setItem('accessToken', newToken);
      console.log('[API] ✅ Token refreshed successfully');
      return newToken;
    }
    return null;
  } catch (error) {
    console.error('[API] ❌ Failed to refresh token:', error);
    return null;
  }
}

// Request interceptor — add JWT token to every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && token.includes('.')) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] ✅ Token attached to request:', config.url, '| Token valid:', token.substring(0, 20) + '...');
      } else {
        console.error('[API] ❌ NO VALID TOKEN found! Token:', token ? 'exists but invalid format' : 'not in localStorage');
        console.error('[API] 📋 Available localStorage keys:', Object.keys(localStorage));
        // Still include whatever token we have so backend can return proper error
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor — handle auth errors and token refresh
api.interceptors.response.use(
  (response) => {
    console.debug('[API] ✅ Response OK:', response.config.url, '| Status:', response.status);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';

    console.debug('[API] ❌ Response Error:', { status, url, message: errorMessage });

    // Handle 403 — Try to refresh token and retry
    if (status === 403 && !url?.includes('/auth/login')) {
      console.warn('[API] 🔄 Got 403, attempting token refresh...');

      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshToken();
        isRefreshing = false;

        if (newToken) {
          // Token refreshed successfully, retry original request
          console.log('[API] 🔁 Retrying original request with new token');
          error.config.headers.Authorization = `Bearer ${newToken}`;
          processQueue(newToken);
          return api.request(error.config);
        } else {
          // Token refresh failed, redirect to login
          console.error('[API] ❌ Token refresh failed, redirecting to login');
          processQueue(null, error);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('crm_auth_user');
            window.location.href = '/login';
          }
        }
      } else {
        // Refresh already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          error.config.headers.Authorization = `Bearer ${token}`;
          return api.request(error.config);
        }).catch(err => Promise.reject(err));
      }
    }

    // Handle 401 — Always redirect to login
    if (status === 401) {
      console.warn('[API] 🚫 401 Unauthorized — redirecting to login');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('crm_auth_user');
        window.location.href = '/login';
      }
    }

    // Connection errors
    if (!status && error.code === 'ECONNREFUSED') {
      console.debug('[API] Connection refused — Spring Boot may be unavailable');
    }

    return Promise.reject(error);
  },
);

export default api;
