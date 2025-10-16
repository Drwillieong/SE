import axios from 'axios';

// Set up axios defaults
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8800';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          token: localStorage.getItem('token')
        });

        if (refreshResponse.data.token) {
          // Update the stored token
          localStorage.setItem('token', refreshResponse.data.token);
          api.defaults.headers.common['Authorization'] = `Bearer ${refreshResponse.data.token}`;

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth utility functions
export const authUtils = {
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user has required role
  hasRole: (requiredRole) => {
    const user = authUtils.getCurrentUser();
    if (!user) return false;

    if (requiredRole === 'user' && user.role === 'customer') {
      return true;
    }

    return user.role === requiredRole;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Validate token with server
  validateToken: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        authUtils.logout();
      }
      throw error;
    }
  }
};

export default api;
