import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../utils/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axiosInstance.get('/api/auth/me');
      // Assuming /api/auth/me returns { status: 'success', data: userObject }
      if (response.data.status === 'success') {
        setUser(response.data.data);
        // Use the _id from the user object returned by /me
        if (response.data.data?._id) {
            localStorage.setItem('userId', response.data.data._id);
        }
      } else {
        setUser(null);
        localStorage.removeItem('userId');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      localStorage.removeItem('userId');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', {
        email,
        password
      });

      // Assuming /api/auth/login returns { status: 'success', userid: '...', username: '...', ... }
      if (response.data.status === 'success') {
        // Use userid and username directly from the login response
        setUser({ _id: response.data.userid, username: response.data.username }); // Set minimal user info
        localStorage.setItem('userId', response.data.userid);
        return { success: true };
      } else {
         // This case should ideally not be reached for typical API error responses (4xx status)
         // But as a fallback, handle if server returns 200 with status != 'success'
         return {
           success: false,
           error: response.data.message || 'Login failed with unexpected status'
         };
      }
    } catch (error) {
      console.error('Login error:', error);
      // Extract specific error message from backend response
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      setUser(null);
      localStorage.removeItem('userId');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 