import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import { useDispatch } from 'react-redux';
import { setAuthUser } from '../redux/slices/authSlice';
import { setConversations, clearSelectedPeople, setIsChatOpen, updateOnlineUsers } from '../redux/slices/chatSlice';
import { setPosts } from '../redux/slices/postSlice';

import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false); // Track if auth check is done
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Only check auth status once on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axiosInstance.get('/api/auth/me');
      
      if (response.data.status === 'success') {
        setUser(response.data.data);
        dispatch(setAuthUser(response.data.data));
        if (response.data.data?._id) {
          localStorage.setItem('userId', response.data.data._id);
        }
      } else {
        setUser(null);
        dispatch(setAuthUser(null));
        localStorage.removeItem('userId');
      }
    } catch (error) {
      setUser(null);
      dispatch(setAuthUser(null));
      localStorage.removeItem('userId');
    } finally {
      setLoading(false);
      setHasCheckedAuth(true);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', {
        email,
        password
      });

      if (response.data.status === 'success') {      
        
        setUser({ _id: response.data.userid, username: response.data.username }); // Set minimal user info in context
        localStorage.setItem('userId', response.data.userid);
        // await checkAuthStatus(); // Call checkAuthStatus to immediately update Redux with full user data

        return { success: true };
      } else {
         return {
           success: false,
           error: response.data.message || 'Login failed with unexpected status'
         };
      }
    } catch (error) {
      console.error('Login error:', error);
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
      setUser(null);
      dispatch(setAuthUser(null)); // Clear user data in Redux
      localStorage.removeItem('userId');
      // Clear Redux slices
      dispatch(setConversations([]));
      dispatch(clearSelectedPeople());
      dispatch(setIsChatOpen(false));
      dispatch(updateOnlineUsers([]));
      dispatch(setPosts([]));
      // Clear React Query cache
      try { queryClient.clear(); } catch {}
      // Notify other providers (e.g., sockets) to cleanup
      try { window.dispatchEvent(new Event('app:logout')); } catch {}
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasCheckedAuth, login, logout }}>
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