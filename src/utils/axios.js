import axios from 'axios';
import { API_URL } from '../config/config';

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000, // Increase timeout for mobile networks
  headers: {
    'Content-Type': 'application/json',
    
  }
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    // You can add auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if we're not already on the login page
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('userId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;