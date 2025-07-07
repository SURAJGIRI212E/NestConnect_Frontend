import axios from 'axios';
import { API_URL } from '../config/config';
import { showGlobalToast } from '../components/Toast';

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
    if (showGlobalToast) {
      showGlobalToast(error.message || 'Request failed', 'error');
    }
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

    // Display specific error message from backend if available
    if (error.response?.data?.message && showGlobalToast) {
      showGlobalToast(error.response.data.message, 'error');
    } else if (showGlobalToast) {
      showGlobalToast(error.message || 'An unexpected error occurred.', 'error');
    }

    return Promise.reject(error);
  }
);

export default instance;