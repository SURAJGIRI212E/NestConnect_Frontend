import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { updateConversationWithMessage, updateConversationUnreadCount, deleteConversation, setConversations } from '../redux/slices/chatSlice';
import { useAuth } from './AuthContext';
import axiosInstance from '../utils/axios';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const dispatch = useDispatch();
  const { user } = useAuth();
  // Fetch initial conversations
  useEffect(() => {
    if (!user?._id) return;

    const fetchInitialConversations = async () => {      try {
        const response = await axiosInstance.get('/api/chat/conversations');
        if (response.data.status === 'success') {
          dispatch(setConversations(response.data.data));
        }
      } catch (error) {
        console.error('Error fetching initial conversations:', error);
      }
    };

    fetchInitialConversations();
  }, [user, dispatch]);

  // Initialize socket connection
  useEffect(() => {
    if (!user?._id || socketRef.current) return;

    // Create socket instance
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:8000', {
      withCredentials: true,
      auth: { userId: user._id }
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      socket.emit('addUser', user._id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('getOnlineUsers', (users) => {
      setOnlineUsers(users);
    });    // Message handlers
    socket.on('receiveMessage', ({ message, conversationId }) => {
      const currentUserId = localStorage.getItem('userId');
      dispatch(updateConversationWithMessage({ 
        conversationId, 
        message,
        skipUnreadIncrement: message.senderId._id === currentUserId
      }));
    });

    socket.on('messageSent', (message) => {
      // Don't increment unread count for own messages
      dispatch(updateConversationWithMessage({
        conversationId: message.conversationId,
        message,
        skipUnreadIncrement: true
      }));
    });    socket.on('unreadCountUpdated', ({ conversationId, unreadCount }) => {
      dispatch(updateConversationUnreadCount({ conversationId, unreadCount }));
    });

    socket.on('messagesRead', ({ conversationId }) => {
      // Update the conversation to show messages as read
      dispatch(updateConversationUnreadCount({ 
        conversationId, 
        unreadCount: 0
      }));
    });

    socket.on('conversationDeleted', ({ conversationId }) => {
      dispatch(deleteConversation({ conversationId }));
    });

    // Keep-alive ping
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping', user._id);
      }
    }, 30000);

    // Clean up
    return () => {
      clearInterval(pingInterval);
      if (socket.connected) {
        socket.emit('userOffline', user._id);
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [user, dispatch]);

  // Handle tab visibility
  useEffect(() => {
    if (!socketRef.current || !user?._id) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        socketRef.current.emit('userOffline', user._id);
      } else if (socketRef.current.connected) {
        socketRef.current.emit('addUser', user._id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const emitEvent = (eventName, data) => {
    if (!socketRef.current?.connected || !user?._id) return;
    socketRef.current.emit(eventName, data);
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    emitEvent,
    isUserOnline: (userId) => onlineUsers.includes(userId),
    onlineUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};