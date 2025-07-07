import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { updateConversationWithMessage, updateConversationUnreadCount, deleteConversation, setConversations } from '../redux/slices/chatSlice';
import { useAuth } from './AuthContext';
import axiosInstance from '../utils/axios';
import { SOCKET_URL } from '../config/config';

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
  }, [user, dispatch]);

  // Initialize socket connection
  useEffect(() => {
    if (!user?._id || socketRef.current) return;

    // Create socket instance
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      auth: { userId: user._id },
      transports: ['websocket', 'polling'],
      timeout: 60000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
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
    });

    // Handle errors from socket
    socket.on('error', ({ message }) => {
      console.error('Socket Error:', message);
      setSocketError(message);
      // Clear error after some time
      setTimeout(() => setSocketError(null), 5000); 
    });

    // Message handlers
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
    });    
    
    socket.on('unreadCountUpdated', ({ conversationId, unreadCount }) => {
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
      socket.off('incomingCall');
      socket.off('callAccepted');
      socket.off('callRejected');
      socket.off('callEnded');
      socket.off('returningSignal');
      socket.off('error'); // Clean up error listener
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

  // Video call event listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Incoming call notification
    socket.on('incomingCall', ({ from, signal }) => {
      console.log('Incoming call from:', from.username);
      console.log('Socket Event: incomingCall');
      setIncomingCall({ from, signal });
      setCallState('incoming');
    });

    // Call accepted by receiver
    socket.on('callAccepted', ({ signal, to }) => {
      console.log('Call accepted by:', to.username);
      console.log('Socket Event: callAccepted');
      // Only update currentCall if it actually changes
      setCurrentCall(prev => {
        if (
          prev &&
          prev.otherUser &&
          prev.otherUser._id === to._id &&
          prev.isCaller === true
        ) {
          return prev; // No change, don't update
        }
        return { otherUser: to, isCaller: true };
      });
      setCallState('active');
      // The caller needs to process the signal data from the answer
      // The WebRTC logic will handle this in the VideoCallRoom component
    });

    // Call rejected by receiver
    socket.on('callRejected', ({ to }) => {
      console.log('Call rejected by:', to.username);
      console.log('Socket Event: callRejected');
      setOutgoingCall(null);
      setCallState('idle');
      setCanCall(false); // Start cooldown
      callCooldownTimeoutRef.current = setTimeout(() => setCanCall(true), 2000);
      // Optionally show a notification to the caller
    });

    // Call ended by other user
    socket.on('callEnded', () => {
      console.log('Call ended by other user');
      console.log('Socket Event: callEnded');
      setCurrentCall(null);
      setCallState('idle');
      setCanCall(false); // Start cooldown
      callCooldownTimeoutRef.current = setTimeout(() => setCanCall(true), 2000);
      // Optionally show a notification that the call ended
    });

    // Receive signaling data (ICE candidates, offer/answer)
    socket.on('returningSignal', ({ signal }) => {
      // console.log('Receiving signaling data', signal);
   
      // This signal needs to be processed by the RTCPeerConnection in the VideoCallRoom component
      // The WebRTC logic will handle this.
    });

    // Clean up listeners
    return () => {
      socket.off('incomingCall');
      socket.off('callAccepted');
      socket.off('callRejected');
      socket.off('callEnded');
      socket.off('returningSignal');
    };
  }, [user]); // Only depend on user

  const emitEvent = (eventName, data) => {
    if (!socketRef.current?.connected || !user?._id) return;
    setSocketError(null); // Clear previous error before emitting new event
    socketRef.current.emit(eventName, data);
  };

  // Video call helper functions
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

    // Clear any existing cooldown timeout before starting a new call
    if (callCooldownTimeoutRef.current) {
      clearTimeout(callCooldownTimeoutRef.current);
      callCooldownTimeoutRef.current = null;
    }

    console.log('Calling user:', targetUser.username);
    console.log('Socket Emit: callUser', { targetUserId: targetUser._id, from: user });
    setOutgoingCall({ to: targetUser });
    setCallState('calling');
    setCanCall(false); // Temporarily disable calling immediately
    socketRef.current.emit('callUser', { targetUserId: targetUser._id, from: user });
  };

  const answerCall = (signal) => {
    if (!socketRef.current?.connected || !user?._id || !incomingCall) return;
    console.log('Answering call from:', incomingCall.from.username);
    console.log('Socket Emit: answerCall', { signal, to: incomingCall.from._id, from: user });
    setCallState('active');
    setCurrentCall(prev => {
      if (
        prev &&
        prev.otherUser &&
        prev.otherUser._id === incomingCall.from._id &&
        prev.isCaller === false
      ) {
        return prev; // No change, don't update
      }
      return { otherUser: incomingCall.from, isCaller: false };
    });
    socketRef.current.emit('answerCall', { signal, to: incomingCall.from._id, from: user });
    setIncomingCall(null); // Clear incoming call state
    setCanCall(true); // Allow new calls after answering (as a new call is now active)
  };

  const rejectCall = () => {
    if (!socketRef.current?.connected || !user?._id || !incomingCall) return;
    console.log('Rejecting call from:', incomingCall.from.username);
    console.log('Socket Emit: rejectCall', { to: incomingCall.from._id });
    socketRef.current.emit('rejectCall', { to: incomingCall.from._id });
    setIncomingCall(null);
    setCallState('idle');
    setCanCall(false); // Start cooldown
    callCooldownTimeoutRef.current = setTimeout(() => setCanCall(true), 2000);
  };

  const hangUp = useCallback(() => {
    if (!socketRef.current?.connected || !user?._id || (!currentCall && !outgoingCall)) return;
    console.log('Hanging up call');
    const targetUserId = currentCall?.otherUser._id || outgoingCall?.to._id;
    if (targetUserId) {
      socketRef.current.emit('hangUp', { to: targetUserId });
      console.log('Socket Emit: hangUp', { to: targetUserId });
    }
    setCurrentCall(null);
    setOutgoingCall(null);
    setCallState('idle');
    setCanCall(false); // Start cooldown
    callCooldownTimeoutRef.current = setTimeout(() => setCanCall(true), 2000);
  }, [currentCall, outgoingCall, user?._id]);

  const sendSignal = useCallback((targetUserId, signal) => {
    if (!socketRef.current?.connected || !user?._id) return;
    console.log('Sending signal to:', targetUserId);
    // console.log('Socket Emit: sendingSignal', { targetUserId, signal });
    socketRef.current.emit('sendingSignal', { targetUserId, signal });
  }, [user?._id]);

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
    sendSignal,
    socketError,
    canCall // Expose canCall
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