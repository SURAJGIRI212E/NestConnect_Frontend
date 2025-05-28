import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedPeople: [],
  isChatOpen: false,
  conversations: [],
  onlineUsers: [],
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSelectedPeople: (state, action) => {
      state.selectedPeople = action.payload;
    },
    clearSelectedPeople: (state) => {
      state.selectedPeople = [];
    },
    setIsChatOpen: (state, action) => {
      state.isChatOpen = action.payload;
    },
    setConversations: (state, action) => {
      state.conversations = Array.isArray(action.payload) ? action.payload : [];
    },
    updateConversationWithMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!Array.isArray(state.conversations)) {
        state.conversations = [];
        return;
      }
      const conversationIndex = state.conversations.findIndex(conv => conv._id === conversationId);
      if (conversationIndex !== -1) {
        const currentUserId = localStorage.getItem('userId');
        // Only increment unread count for messages from others
        const shouldIncrementUnread = message.senderId._id !== currentUserId;
        
        const currentUnreadCount = state.conversations[conversationIndex].currentUserUnreadCount || 0;
        
        state.conversations[conversationIndex] = {
          ...state.conversations[conversationIndex],
          lastMessage: message,
          updatedAt: message.createdAt,
          currentUserUnreadCount: shouldIncrementUnread ? currentUnreadCount + 1 : currentUnreadCount
        };
        // Sort conversations by last message date
        if (state.conversations.length > 1) {
          state.conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }
      }
    },
    updateConversationUnreadCount: (state, action) => {
      const { conversationId, unreadCount } = action.payload;
      const conversationIndex = state.conversations.findIndex(conv => conv._id === conversationId);
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].currentUserUnreadCount = unreadCount;
        
        // If unread count becomes 0, update the conversation's messages as read
        if (unreadCount === 0 && state.conversations[conversationIndex].messages) {
          state.conversations[conversationIndex].messages = state.conversations[conversationIndex].messages.map(msg => ({
            ...msg,
            isRead: true
          }));
        }
      }
    },
    updateOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    deleteConversation: (state, action) => {
      const { conversationId } = action.payload;
      state.conversations = state.conversations.filter(conv => conv._id !== conversationId);
    }
  },
});

// Selectors
export const selectTotalUnreadCount = (state) => {
  return state.chat.conversations.reduce((total, conv) => total + (conv.currentUserUnreadCount || 0), 0);
};

export const { 
  setSelectedPeople, 
  clearSelectedPeople, 
  setIsChatOpen, 
  setConversations, 
  updateConversationWithMessage, 
  updateConversationUnreadCount,
  updateOnlineUsers,
  deleteConversation 
} = chatSlice.actions;

export default chatSlice.reducer;