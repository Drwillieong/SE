import axios from 'axios';

// Determine the base URL based on the environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8800';

console.log(`API Client is using base URL: ${API_URL}`);

const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor to add the auth token to every request if it exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;