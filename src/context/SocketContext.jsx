import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { updateConversationWithMessage, updateConversationUnreadCount, deleteConversation, setConversations } from '../redux/slices/chatSlice';
// import { addNotification } from '../redux/slices/notiSlice';
import { useAuth } from './AuthContext';
import axiosInstance from '../utils/axios';
import { useNotifications } from '../hooks/useNotifications';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socketError, setSocketError] = useState(null); // New state for socket errors
  const [callState, setCallState] = useState('idle'); // 'idle', 'calling', 'incoming', 'active'
  const [incomingCall, setIncomingCall] = useState(null); // { from: user object, signal: signal data }
  const [outgoingCall, setOutgoingCall] = useState(null); // { to: user object }
  const [currentCall, setCurrentCall] = useState(null); // { otherUser: user object, isCaller: boolean }
  const [canCall, setCanCall] = useState(true);
  const callCooldownTimeoutRef = useRef(null);
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { prependNotification } = useNotifications();
  const prependNotificationRef = useRef(prependNotification);
  useEffect(() => { prependNotificationRef.current = prependNotification; }, [prependNotification]);

  // Fetch initial conversations if there is
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
  }, [user?._id, dispatch]);

  // Initialize socket connection (only when user id becomes available)
  useEffect(() => {
    // Listen for global logout to hard reset socket state
    const onLogout = () => {
      try {
        const socket = socketRef.current;
        if (socket?.connected) {
          socket.emit('userOffline', user?._id);
          socket.disconnect();
        }
      } catch {}
      socketRef.current = null;
      setIsConnected(false);
      setOnlineUsers([]);
      setIncomingCall(null);
      setOutgoingCall(null);
      setCurrentCall(null);
      setCallState('idle');
    };
    window.addEventListener('app:logout', onLogout);
    return () => window.removeEventListener('app:logout', onLogout);
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id || socketRef.current) return;

    socketRef.current = io(process.env.REACT_APP_SOCKET_URL, {
      withCredentials: true,
      auth: { userId: user._id },
      transports: ['websocket'],
      timeout: 60000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('addUser', user._id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('getOnlineUsers', (users) => {
      setOnlineUsers(users);
    });

    socket.on('error', ({ message }) => {
      setSocketError(message);
      setTimeout(() => setSocketError(null), 5000); 
    });

    socket.on('receiveMessage', ({ message, conversationId }) => {
      const currentUserId = localStorage.getItem('userId');
      dispatch(updateConversationWithMessage({ 
        conversationId, 
        message,
        skipUnreadIncrement: message.senderId._id === currentUserId
      }));
    });

    socket.on('messageSent', (message) => {
      dispatch(updateConversationWithMessage({
        conversationId: message.conversationId,
        message,
        skipUnreadIncrement: true
      }));
    });    
    
    socket.on('unreadCountUpdated', ({ conversationId, unreadCount }) => {
      dispatch(updateConversationUnreadCount({ conversationId, unreadCount }));
    });

    socket.on('messagesRead', ({ conversationId }) => {
      dispatch(updateConversationUnreadCount({ 
        conversationId, 
        unreadCount: 0
      }));
    });

    socket.on('conversationDeleted', ({ conversationId }) => {
      dispatch(deleteConversation({ conversationId }));
    });

    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping', user._id);
      }
    }, 30000);

    socket.on('newNotification', (notification) => {
      if (prependNotificationRef.current) {
        prependNotificationRef.current(notification);
      }
    });

    return () => {
      clearInterval(pingInterval);
      if (socket.connected) {
        socket.emit('userOffline', user._id);
        socket.disconnect();
      }
      socketRef.current = null;
      socket.off('error');
      socket.off('newNotification');
    };
  }, [user?._id, dispatch]);

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
  }, [user?._id]);

  // Only keep high-level call state management for UI (incoming, outgoing, hangup)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('incomingCall', ({ from, signal }) => {
      setIncomingCall({ from, signal });
      setCallState('incoming');
    });

    socket.on('callAccepted', ({ signal, to }) => {
      setCurrentCall({ otherUser: to, isCaller: true });
      setCallState('active');
    });

    socket.on('callRejected', () => {
      setOutgoingCall(null);
      setCallState('idle');
      setCanCall(false);
      callCooldownTimeoutRef.current = setTimeout(() => setCanCall(true), 2000);
    });

    socket.on('callEnded', () => {
      setCurrentCall(null);
      setCallState('idle');
      setCanCall(false);
      callCooldownTimeoutRef.current = setTimeout(() => setCanCall(true), 2000);
    });

    return () => {
      socket.off('incomingCall');
      socket.off('callAccepted');
      socket.off('callRejected');
      socket.off('callEnded');
    };
  }, [user?._id]);

  const emitEvent = (eventName, data) => {
    if (!socketRef.current?.connected || !user?._id) return;
    setSocketError(null); // Clear previous error before emitting new event
    socketRef.current.emit(eventName, data);
  };

  const callUser = (targetUser) => {
    if (!socketRef.current?.connected || !user?._id) {
      setSocketError('Socket not connected.');
      return;
    }
    if (callState !== 'idle') {
      setSocketError('A call is already in progress or incoming.');
      return;
    }
    if (!canCall) {
      setSocketError('Please wait before trying to call again.');
      return;
    }
    if (callCooldownTimeoutRef.current) {
      clearTimeout(callCooldownTimeoutRef.current);
      callCooldownTimeoutRef.current = null;
    }

    setOutgoingCall({ to: targetUser });
    setCallState('calling');
    setCanCall(false); // Temporarily disable calling immediately
    socketRef.current.emit('callUser', { targetUserId: targetUser._id, from: user });
  };

  const answerCall = (signal) => {
    if (!socketRef.current?.connected || !user?._id || !incomingCall) return;
    setCallState('active');
    setCurrentCall({ otherUser: incomingCall.from, isCaller: false });
    socketRef.current.emit('answerCall', { signal, to: incomingCall.from._id, from: user });
    setIncomingCall(null); // Clear incoming call state
    setCanCall(true); // Allow new calls after answering (as a new call is now active)
  };

  const rejectCall = () => {
    if (!socketRef.current?.connected || !user?._id || !incomingCall) return;
    socketRef.current.emit('rejectCall', { to: incomingCall.from._id });
    setIncomingCall(null);
    setCallState('idle');
    setCanCall(false); // Start cooldown
    callCooldownTimeoutRef.current = setTimeout(() => setCanCall(true), 2000);
  };

  const hangUp = useCallback(() => {
    if (!socketRef.current?.connected || !user?._id || (!currentCall && !outgoingCall)) return;
    const targetUserId = currentCall?.otherUser._id || outgoingCall?.to._id;
    if (targetUserId) {
      socketRef.current.emit('hangUp', { to: targetUserId });
    }
    setCurrentCall(null);
    setOutgoingCall(null);
    setCallState('idle');
    setCanCall(false); // Start cooldown
    callCooldownTimeoutRef.current = setTimeout(() => setCanCall(true), 2000);
  }, [currentCall, outgoingCall, user?._id]);

  const value = {
    socket: socketRef.current,
    isConnected,
    emitEvent,
    isUserOnline: (userId) => onlineUsers.includes(userId),
    onlineUsers,
    callState,
    incomingCall,
    outgoingCall,
    currentCall,
    callUser,
    answerCall,
    rejectCall,
    hangUp,
    socketError,
    canCall
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