import apiClient from './axios'; // Use the centralized apiClient

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshResponse = await apiClient.post(`/auth/refresh`, {
          token: localStorage.getItem('token')
        });

        if (refreshResponse.data.token) {
          // Update the stored token
          localStorage.setItem('token', refreshResponse.data.token);
          // The request interceptor in axios.js will handle adding the new token.
          
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
          return apiClient(originalRequest);
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
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        authUtils.logout();
      }
      throw error;
    }
  }
};

export default authUtils;
