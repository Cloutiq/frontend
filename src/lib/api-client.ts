import axios, {
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import { setRefreshTokenCookie, clearAuthCookies } from '@/lib/auth-cookie';
import type { ApiErrorResponse } from '@/types/auth';

// Route API calls through Next.js rewrite proxy (/backend/*)
// to avoid cross-origin issues (Safari blocks api.cloutiq.ai from cloutiq.ai)
const apiClient = axios.create({
  baseURL: '/backend',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });
  failedQueue = [];
}

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401 and if we haven't already retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't retry refresh or login endpoints
    const url = originalRequest.url || '';
    if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request while refresh is in progress
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const { refreshToken, setTokens, logout } = useAuthStore.getState();

    if (!refreshToken) {
      logout();
      clearAuthCookies();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    try {
      const response = await axios.post(
        '/backend/auth/refresh',
        { refreshToken }
      );

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        response.data.data;

      setTokens(newAccessToken, newRefreshToken);
      setRefreshTokenCookie(newRefreshToken);
      processQueue(null, newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      logout();
      clearAuthCookies();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
