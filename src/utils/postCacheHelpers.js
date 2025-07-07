export const updatePostCache = (oldData, targetPostId, updateFn) => {
  if (!oldData) return oldData;

  const findAndUpdatePostInCollection = (post) => {
    if (!post) return post;

    let updatedPost = { ...post };
    let changed = false;

    // Case 1: The current post itself is the target post
    if (updatedPost._id === targetPostId) {
      updatedPost = updateFn(updatedPost, false); // Pass false indicating it's the main post
      changed = true;
    }

    // Case 2: The current post is a repost, and its originalPost is the target post
    if (updatedPost.isRepost && updatedPost.originalPost && updatedPost.originalPost._id === targetPostId) {
      updatedPost = {
        ...updatedPost,
        originalPost: updateFn(updatedPost.originalPost, true), // Pass true indicating it's the original post within a repost
      };
      changed = true;
    }
    
    return changed ? updatedPost : post;
  };

  // Handle different cache structures
  if (oldData._id === targetPostId) { // For single post query
      return findAndUpdatePostInCollection(oldData);
  }
  if (oldData.posts && Array.isArray(oldData.posts)) { // For list queries like userPosts, likedPosts, searchPosts, hashtags, bookmarks
      return { ...oldData, posts: oldData.posts.map(post => findAndUpdatePostInCollection(post)) };
  }
  if (oldData.pages && Array.isArray(oldData.pages)) { // For infinite queries like feedPosts
      return { ...oldData, pages: oldData.pages.map(page => ({ ...page, posts: page.posts.map(post => findAndUpdatePostInCollection(post)) })) };
  }
  if (oldData.comments && Array.isArray(oldData.comments)) { // For postComments and userComments which uses 'comments' array
      return { ...oldData, comments: oldData.comments.map(comment => findAndUpdatePostInCollection(comment)) };
  }
  return oldData;
}; 