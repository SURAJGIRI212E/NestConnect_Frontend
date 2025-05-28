import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
// Import other reducers if you have any

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    // Add other reducers here
  },
}); 