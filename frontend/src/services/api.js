import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Biometric service instance
const biometricApi = axios.create({
  baseURL: 'http://localhost:8001',
  timeout: 15000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Request interceptor to add JWT token (skip for registration endpoints)
api.interceptors.request.use(
  (config) => {
    // Skip adding token for registration and auth endpoints
    const skipTokenEndpoints = ['/voters/register', '/auth/login', '/auth/register'];
    const shouldSkipToken = skipTokenEndpoints.some(endpoint => 
      config.url && config.url.includes(endpoint)
    );
    
    if (!shouldSkipToken) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { api, biometricApi };

