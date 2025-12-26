import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axiosInstance from '../utils/axios';
import { useSocket } from '../context/SocketContext';
import { setIsChatOpen, clearSelectedPeople } from '../redux/slices/chatSlice';

export const useChat = () => {
  // State declarations
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState({});
  const [conversationId, setConversationId] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [receiverProfile, setReceiverProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);

  // Refs
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMessagesLengthRef = useRef(messages.length); // Ref to store previous messages length
  const dispatch = useDispatch();
  const { selectedPeople, conversations } = useSelector(state => state.chat);
  const { socket, emitEvent, isUserOnline, socketError } = useSocket();

  useEffect(() => {
    if (!conversationId || !socket?.connected) return;

    const markMessagesAsRead = () => {
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId) {
        socket.emit('markMessagesAsRead', {
          conversationId,
          userId: currentUserId
        });
      }
    };

    // Mark as read immediately when messages change or conversation opens
    markMessagesAsRead();

    // Set up intersection observer for message visibility
       const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(entry => entry.isIntersecting)) {
          markMessagesAsRead();
        }
      },
      { threshold: 0.5 }
    );

    // Store ref value in effect scope
    const messageEndElement = messagesEndRef.current;
    if (messageEndElement) {
      observer.observe(messageEndElement);
    }

    return () => {
      if (messageEndElement) {
        observer.unobserve(messageEndElement);
      }
      observer.disconnect();
    };
  }, [conversationId, socket, messages]);

  // Scroll to bottom when new messages arrive, but not when messages are deleted.
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length; // Update for next render
  }, [messages]);
  
  // Get or create conversation when selectedPeople changes
  useEffect(() => {
    const getConversation = async () => {
      try {
        if (selectedPeople.length === 0) {
          setConversationId(null);
          setMessages([]);
          return;
        }
        
        const receiverId = selectedPeople[0]._id;
        // First check if conversation exists in redux store
        const existingConv = conversations.find(conv => 
          conv.participants.some(p => p._id === receiverId)
        );        
        let conversationToUse;
        if (existingConv) {
          conversationToUse = existingConv;
        } else {
          // Create new conversation
          const response = await axiosInstance.get(`/api/chat/conversations/${receiverId}`);
          if (response.data.status === 'success' && response.data.data?._id) {
            conversationToUse = response.data.data;
          }
        }

        if (conversationToUse) {
          setConversationId(conversationToUse._id);
          const messagesResponse = await axiosInstance.get(
            `/api/chat/conversations/${conversationToUse._id}/messages`
          );
          
          if (messagesResponse.data.status === 'success') {
            setMessages(messagesResponse.data.data.reverse());
            
            setReceiverProfile({
              user: selectedPeople[0],
              isOnline: isUserOnline(selectedPeople[0]._id)
            });
          }
        }
      } catch (error) {
        console.error('Error fetching conversation:', error);
        setProfileError('Failed to load conversation');
      } finally {
        setIsLoadingProfile(false);
      }
    };    
    getConversation();
  }, [selectedPeople, conversations]);

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    // Clear profileError when new socket events occur or conversation changes
    setProfileError(null);

    const handleReceiveMessage = (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data.message]);
      }
    };
    const handleMessageSent = (message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    };
    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    };
    // Register event handlers listening to socket events
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageSent', handleMessageSent);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('typing', ({ senderId, conversationId: typingConversationId }) => {
      if (typingConversationId === conversationId) {
        setIsTyping(prev => ({ ...prev, [typingConversationId]: true }));
      }
    });
    socket.on('stopTyping', ({ senderId, conversationId: typingConversationId }) => {
      if (typingConversationId === conversationId) {
        setIsTyping(prev => ({ ...prev, [typingConversationId]: false }));
      }
    });

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageSent', handleMessageSent);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('typing');
      socket.off('stopTyping');
    };
  }, [socket, conversationId]);

  useEffect(() => {
    if (socketError) {
      setProfileError(socketError);
    }
  }, [socketError]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && selectedImages.length === 0) || !conversationId || !selectedPeople[0]) return;

    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;

    try {
      setIsUploading(true);
      let uploadedImages = [];        if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach(image => formData.append('images', image));

        const response = await axiosInstance.post('/api/chat/message-media-upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.status === 'success') {
          uploadedImages = response.data.data;
        }
      }

      const messageData = {
        senderId: currentUserId,
        receiverId: selectedPeople[0]._id,
        message: {
          content: newMessage,
          media: uploadedImages
        },
        conversationId
      };

      emitEvent('sendMessage', messageData);
      setNewMessage('');
      setSelectedImages([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsUploading(false);
    }
  };
  const handleDeleteMessage = async (messageId) => {
    if (!messageId || !conversationId) return;
    emitEvent('deleteMessage', { messageId, conversationId });
  };
  const handleTyping = () => {
    if (!conversationId || !selectedPeople[0]?._id) return;

    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;

    emitEvent('typing', {
      senderId: currentUserId,
      receiverId: selectedPeople[0]._id,
      conversationId
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitEvent('stopTyping', {
        senderId: currentUserId,
        receiverId: selectedPeople[0]._id,
        conversationId
      });
    }, 1000);
  };
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files]);
  };
  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };
  const handleCloseChat = () => {
    dispatch(setIsChatOpen(false));
    dispatch(clearSelectedPeople());
  };
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return {
    messages,
    newMessage,
    isTyping,
    conversationId,
    selectedImages,
    isUploading,
    receiverProfile,
    isLoadingProfile,
    profileError,
    hoveredMessage,
    setNewMessage,
    setHoveredMessage,
    handleSendMessage,
    handleImageSelect,
    handleTyping,
    handleCloseChat,
    handleDeleteMessage,
    removeImage,
    formatMessageTime,
    fileInputRef,
    messagesEndRef,
    socketError
  };
};