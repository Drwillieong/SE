import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8800';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Optional: Interceptor to add the auth token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});



export default apiClient;