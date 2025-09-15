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
    // Use regex to match public routes 
    const publicPaths = ['/login', '/register', '/reset-password'];
    const isPublicRoute = publicPaths.some(path => window.location.pathname.includes(path));

    // Helper to extract a friendly message from many possible error shapes
    const extractErrorMessage = (err) => {
      if (!err) return 'An unexpected error occurred.';
      // Prefer response data obj shapes
      const resp = err.response?.data;
      if (resp) {
        // Common app error: { message }
        if (typeof resp.message === 'string' && resp.message.length) return resp.message;
        // Razorpay test/production obj: { error: { description } } or { error: { reason/message } }
        if (resp.error) {
          if (typeof resp.error === 'string' && resp.error.length) return resp.error;
          if (typeof resp.error.description === 'string' && resp.error.description.length) return resp.error.description;
          if (typeof resp.error.reason === 'string' && resp.error.reason.length) return resp.error.reason;
          if (typeof resp.error.message === 'string' && resp.error.message.length) return resp.error.message;
        }
        // other: { error_description }
        if (typeof resp.error_description === 'string' && resp.error_description.length) return resp.error_description;
        if (typeof resp.description === 'string' && resp.description.length) return resp.description;
        //  attempt to stringify the response
        try {
          const s = JSON.stringify(resp);
          if (s && s !== '{}' ) return s;
        } catch (e) {
          // ignore
        }
      }

      // Fallback to axios error message
      if (err.message) return err.message;
      return 'An unexpected error occurred.';
    };

    const message = extractErrorMessage(error);

    if (!isPublicRoute && typeof showGlobalToast === 'function') {
      if (error.response?.status === 401) {
        showGlobalToast(message || 'Please login to access this resource.', 'error');
      } else {
        showGlobalToast(message, 'error');
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
