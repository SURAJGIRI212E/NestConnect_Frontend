import axios from 'axios';

import { showGlobalToast } from '../components/Toast';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
  timeout: 60000, // Increase timeout for mobile networks
  headers: {
    'Content-Type': 'application/json',
    // 'ngrok-skip-browser-warning': 'any', // ✅ Add this line
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
    // Use regex to match /reset-password and /reset-password/:token
   const publicPaths = ['/login', '/register', '/reset-password'];
    const isPublicRoute = publicPaths.some(path => window.location.pathname.includes(path));
console.log(error)
    if (
      error.response?.status === 401 &&
      !isPublicRoute &&
      showGlobalToast
    ) {
      showGlobalToast(error.response.data.message || 'Please login to access this resource.', 'error');
    } else if (!isPublicRoute && error.response?.data?.message && showGlobalToast) {
      showGlobalToast(error.response.data.message, 'error');
    } else if (!isPublicRoute && showGlobalToast) {
      showGlobalToast(error.message || 'An unexpected error occurred.', 'error');
    }

    return Promise.reject(error);
  }
);

export default instance;
