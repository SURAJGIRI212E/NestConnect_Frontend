import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  posts: [],
  // Add other post related states here, like single post, loading, error, etc.
};

const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    // Define your post actions here
    setPosts: (state, action) => {
      state.posts = action.payload;
    },
    addPost: (state, action) => {
      state.posts.unshift(action.payload); // Add new post to the beginning
    },
    updatePostInState: (state, action) => {
      const index = state.posts.findIndex(post => post._id === action.payload._id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
    },
    deletePostFromState: (state, action) => {
      state.posts = state.posts.filter(post => post._id !== action.payload); // action.payload should be postId
    },
    // You might want to add more specific reducers for likes, comments, etc.
  },
});

export const { setPosts, addPost, updatePostInState, deletePostFromState } = postSlice.actions;

export default postSlice.reducer; 