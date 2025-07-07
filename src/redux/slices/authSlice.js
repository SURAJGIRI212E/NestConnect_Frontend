import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
  // Add other auth related states here
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Define your auth actions here
    setAuthUser: (state, action) => {
      state.user = { 
        ...action.payload, 
        following: action.payload?.following || [], // Ensure following is an array
        blockedUsers: action.payload?.blockedUsers || [] // Ensure blockedUsers is an array
      };
      state.isAuthenticated = !!action.payload;
    },
    logoutUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setAuthUser, logoutUser } = authSlice.actions;

export default authSlice.reducer; 