import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../utils/axios';
import { addPost, deletePostFromState, updatePostInState } from '../redux/slices/postSlice';
import { updatePostCache } from '../utils/postCacheHelpers'; // Import the new shared helper

const POST_API_BASE_URL = '/api/posts';
const USER_API_BASE_URL = '/api/users';

export const usePostCalls = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.auth.user); // Get current user for userPosts updates

  // Utility function to invalidate post-related queries
  const invalidatePostQueries = (exclude = []) => {
    if (!exclude.includes('feedPosts')) queryClient.invalidateQueries(['feedPosts']);
    if (!exclude.includes('userPosts')) queryClient.invalidateQueries(['userPosts']);
    if (!exclude.includes('singlePost')) queryClient.invalidateQueries(['singlePost']);
    if (!exclude.includes('likedPosts')) queryClient.invalidateQueries(['likedPosts']);
    if (!exclude.includes('hashtagPosts')) queryClient.invalidateQueries(['hashtagPosts']);
    if (!exclude.includes('searchPosts')) queryClient.invalidateQueries(['searchPosts']);
    if (!exclude.includes('trendingHashtags')) queryClient.invalidateQueries(['trendingHashtags']);
  };


  // Mutation for creating a post
  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      const response = await axiosInstance.post(`${POST_API_BASE_URL}/createpost`, postData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    },
    onSuccess: (newPost) => {
      dispatch(addPost(newPost));

      // Optimistically update feedPosts cache
      queryClient.setQueriesData({ queryKey: ['feedPosts'] }, (oldData) => {
        if (!oldData) return oldData;
        const updatedPages = oldData.pages.map((page, index) => {
          if (index === 0) {
            // Add new post to the beginning of the first page
            return { ...page, posts: [newPost, ...page.posts] };
          }
          return page;
        });
        return { ...oldData, pages: updatedPages };
      });

      // Optimistically update userPosts cache if the new post belongs to the current user
      // (Assuming newPost.ownerid contains the full user object or at least _id for comparison)
      // This requires the newPost to be populated with ownerid in the backend response.
      queryClient.setQueriesData({ queryKey: ['userPosts', newPost.ownerid?._id || newPost.ownerid], exact: false }, (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, posts: [newPost, ...oldData.posts] };
      });

      // If the new post is a comment, invalidate the comments query for the parent post
      if (newPost.parentPost) {
        queryClient.invalidateQueries(['postComments', newPost.parentPost]);
      }
    },
    onError: (error) => {
      // Error handled by Axios interceptor
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, content }) => {
      const response = await axiosInstance.patch(`${POST_API_BASE_URL}/${postId}`, { content });
      return response.data.data;
    },
    onSuccess: (updatedPost) => {
      dispatch(updatePostInState(updatedPost));
      // Optimistically update relevant queries with the new post data
      const updateCache = (oldData) => {
        if (!oldData) return oldData;
        if (oldData._id === updatedPost._id) {
          return { ...oldData, content: updatedPost.content, edits: updatedPost.edits };
        }
        if (oldData.posts && Array.isArray(oldData.posts)) {
          return { ...oldData, posts: oldData.posts.map(post => 
            post._id === updatedPost._id ? { ...post, content: updatedPost.content, edits: updatedPost.edits } : post
          ) };
        }
        if (oldData.pages && Array.isArray(oldData.pages)) {
            return { 
                ...oldData,
                pages: oldData.pages.map(page => ({
                    ...page,
                    posts: page.posts.map(post => 
                        post._id === updatedPost._id ? { ...post, content: updatedPost.content, edits: updatedPost.edits } : post
                    ),
                })),
            };
        }
        return oldData;
      };

      queryClient.setQueriesData({ queryKey: ['singlePost'] }, updateCache);
      queryClient.setQueriesData({ queryKey: ['feedPosts'] }, updateCache);
      queryClient.setQueriesData({ queryKey: ['userPosts'] }, updateCache);
      queryClient.setQueriesData({ queryKey: ['likedPosts'] }, updateCache);
      queryClient.setQueriesData({ queryKey: ['hashtagPosts'] }, updateCache);
      queryClient.setQueriesData({ queryKey: ['searchPosts'] }, updateCache);
      queryClient.setQueriesData({ queryKey: ['postComments'] }, updateCache);
    },
    onError: (error) => {
      // Error handled by Axios interceptor
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      await axiosInstance.delete(`${POST_API_BASE_URL}/${postId}`);
      return postId; // Return postId for optimistic update
    },
    onSuccess: (deletedPostId) => {
      dispatch(deletePostFromState(deletedPostId));
      
     
      // queryClient.setQueriesData({ queryKey: ['singlePost'] }, oldData => updatePostCache(oldData, deletedPostId, (post) => null)); // Pass null to effectively remove the post
      
      // Invalidate relevant queries to ensure UI updates
      queryClient.invalidateQueries(['feedPosts']);

    },
    onError: (error) => {
      // Error handled by Axios interceptor
    },
  });

  const likeUnlikePostMutation = useMutation({
    mutationFn: async (postId) => {
      const response = await axiosInstance.post(`${POST_API_BASE_URL}/${postId}/like`);
      return response.data.data; // Now returns { liked: boolean, postId: originalPostId }
    },
    onMutate: async (postId) => {
      const previousQueries = {};

      // Keys that need to be cancelled and updated generally (using exact: false for broad match)
      const broadQueryKeys = [
          'userPosts',
          'likedPosts',
          'hashtagPosts',
          'searchPosts',
          'postComments',
          'userComments',
          'userBookmarks',
      ];
      await queryClient.cancelQueries(['singlePost', postId]);
      await queryClient.cancelQueries(['feedPosts']);
      for (const key of broadQueryKeys) {
          await queryClient.cancelQueries({ queryKey: [key], exact: false });
      }
      previousQueries[JSON.stringify(['singlePost', postId])] = queryClient.getQueryData(['singlePost', postId]);
      previousQueries[JSON.stringify(['feedPosts'])] = queryClient.getQueryData(['feedPosts']);

      // For broad queries, iterate over existing queries to get their data
      for (const key of broadQueryKeys) {
          const queries = queryClient.getQueriesData({ queryKey: [key], exact: false });
          for (const [queryKeyArray, data] of queries) {
              previousQueries[JSON.stringify(queryKeyArray)] = data;
          }
      }

      // Determine the current liked status of the post from various caches
      let currentLikedStatus = false;

      // 1. Check singlePost cache first (most specific)
      const singlePostData = queryClient.getQueryData(['singlePost', postId]);
      if (singlePostData) {
          currentLikedStatus = singlePostData?.isLikedByCurrentUser;
      } else {
          // 2. Check feedPosts (infinite query)
          const feedPostsData = queryClient.getQueryData(['feedPosts']);
          let foundPostInFeed = null;
          if (feedPostsData?.pages) {
              foundPostInFeed = feedPostsData.pages.flatMap(page => page.posts).find(p => p._id === postId || (p.isRepost && p.originalPost?._id === postId));
          }
          if (foundPostInFeed) {
              currentLikedStatus = foundPostInFeed.isRepost && foundPostInFeed.originalPost ? foundPostInFeed.originalPost?.isLikedByCurrentUser : foundPostInFeed?.isLikedByCurrentUser;
          } else {
              // 3. Check other broad queries
              const allQueryKeys = ['userPosts', 'likedPosts', 'hashtagPosts', 'searchPosts', 'postComments', 'userBookmarks', 'userComments'];
              for (const key of allQueryKeys) {
                  const queries = queryClient.getQueriesData({ queryKey: [key], exact: false });
                  for (const [queryKeyArray, data] of queries) {
                      if (data && data.posts) {
                          const foundPost = data.posts.find(p => p._id === postId || (p.isRepost && p.originalPost?._id === postId));
                          if (foundPost) {
                              currentLikedStatus = foundPost.isRepost && foundPost.originalPost ? foundPost.originalPost?.isLikedByCurrentUser : foundPost?.isLikedByCurrentUser;
                              break;
                          }
                      } else if (data && data.comments) { // For postComments which uses 'comments' array
                          const foundComment = data.comments.find(c => c._id === postId || (c.isRepost && c.originalPost?._id === postId));
                          if (foundComment) {
                              currentLikedStatus = foundComment.isRepost && foundComment.originalPost ? foundComment.originalPost?.isLikedByCurrentUser : foundComment?.isLikedByCurrentUser;
                              break;
                          }
                      }
                  }
                  if (currentLikedStatus) break;
              }
          }
      }
      
      const newLikedStatus = !currentLikedStatus;

      if (!newLikedStatus) {
        queryClient.setQueriesData({ queryKey: ['likedPosts'], exact: false }, (oldData) => {
          if (!oldData || !oldData.posts) return oldData;
          const updatedData = { ...oldData, posts: oldData.posts.filter(post => post._id !== postId) };
          return updatedData;
        });
      }
      
      queryClient.setQueryData(['singlePost', postId], (oldData) => {
        const updatedData = updatePostCache(oldData, postId, (post, isOriginalPost) => ({
          ...post,
          stats: {
            ...post.stats,
            likeCount: newLikedStatus ? (post.stats?.likeCount || 0) + 1 : (post.stats?.likeCount || 0) - 1,
          },
          isLikedByCurrentUser: newLikedStatus,
        }));
        return updatedData;
      });
      // Feed posts
      queryClient.setQueryData(['feedPosts'], (oldData) => {
        const updatedData = updatePostCache(oldData, postId, (post, isOriginalPost) => ({
          ...post,
          stats: {
            ...post.stats,
            likeCount: newLikedStatus ? (post.stats?.likeCount || 0) + 1 : (post.stats?.likeCount || 0) - 1,
          },
          isLikedByCurrentUser: newLikedStatus,
        }));
        return updatedData;
      });

      for (const key of broadQueryKeys) {
          queryClient.setQueriesData({ queryKey: [key], exact: false }, (oldData) => {
            const updatedData = updatePostCache(oldData, postId, (post, isOriginalPost) => ({
              ...post,
              stats: {
                ...post.stats,
                likeCount: newLikedStatus ? (post.stats?.likeCount || 0) + 1 : (post.stats?.likeCount || 0) - 1,
              },
              isLikedByCurrentUser: newLikedStatus,
            }));
            return updatedData;
          });
      }

      return { previousQueries };
    },
    onSuccess: ({ liked, postId }) => {
      queryClient.invalidateQueries({ queryKey: ['likedPosts'], exact: false });
    },
    onError: (err, postId, context) => {
     
      // Revert the cache to the previous state on error
      if (context?.previousQueries) {
        for (const keyString in context.previousQueries) {
          queryClient.setQueryData(JSON.parse(keyString), context.previousQueries[keyString]);
        }
      }
    },
  });

  const repostMutation = useMutation({
    mutationFn: async ({ postId, isCurrentlyReposted }) => {
      if (isCurrentlyReposted) {
        const response = await axiosInstance.delete(`${POST_API_BASE_URL}/${postId}/unrepost`);
        return { action: 'unreposted', data: response.data.data, originalPostId: postId }; 
      } else {
      const response = await axiosInstance.post(`${POST_API_BASE_URL}/${postId}/repost`);
        return { action: 'reposted', data: response.data.data, originalPostId: postId };
      }
    },
    onMutate: async ({ postId, isCurrentlyReposted }) => {
      const previousQueries = {};

      const broadQueryKeys = [
          'feedPosts',
          'userPosts',
          'singlePost',
          'likedPosts',
          'hashtagPosts',
          'searchPosts',
          'postComments',
          'userComments',
          'userBookmarks',
      ];

      // Cancel any outgoing refetches for all relevant queries to avoid conflicts
      for (const key of broadQueryKeys) {
          await queryClient.cancelQueries({ queryKey: [key], exact: false });
      }

      // Get snapshot of affected queries for rollback
      for (const key of broadQueryKeys) {
          const queries = queryClient.getQueriesData({ queryKey: [key], exact: false });
          for (const [queryKeyArray, data] of queries) {
              previousQueries[JSON.stringify(queryKeyArray)] = data;
          }
      }

      // Determine the current reposted status from various caches (similar to like mutation)
      let currentRepostedStatus = false;
      const singlePostData = queryClient.getQueryData(['singlePost', postId]);
      if (singlePostData) {
          currentRepostedStatus = singlePostData?.isRepostedByCurrentUser;
      } else {
          const feedPostsData = queryClient.getQueryData(['feedPosts']);
          let foundPostInFeed = null;
          if (feedPostsData?.pages) {
              foundPostInFeed = feedPostsData.pages.flatMap(page => page.posts).find(p => p._id === postId || (p.isRepost && p.originalPost?._id === postId));
          }
          if (foundPostInFeed) {
              currentRepostedStatus = foundPostInFeed.isRepost && foundPostInFeed.originalPost ? foundPostInFeed.originalPost?.isRepostedByCurrentUser : foundPostInFeed?.isRepostedByCurrentUser;
          } else {
              for (const key of broadQueryKeys.filter(k => k !== 'feedPosts' && k !== 'singlePost')) {
                  const queries = queryClient.getQueriesData({ queryKey: [key], exact: false });
                  for (const [queryKeyArray, data] of queries) {
                      if (data && data.posts) {
                          const foundPost = data.posts.find(p => p._id === postId || (p.isRepost && p.originalPost?._id === postId));
                          if (foundPost) {
                              currentRepostedStatus = foundPost.isRepost && foundPost.originalPost ? foundPost.originalPost?.isRepostedByCurrentUser : foundPost?.isRepostedByCurrentUser;
                              break;
                          }
                      } else if (data && data.comments) {
                          const foundComment = data.comments.find(c => c._id === postId || (c.isRepost && c.originalPost?._id === postId));
                          if (foundComment) {
                              currentRepostedStatus = foundComment.isRepost && foundComment.originalPost ? foundComment.originalPost?.isRepostedByCurrentUser : foundComment?.isRepostedByCurrentUser;
                              break;
                          }
                      }
                  }
                  if (currentRepostedStatus) break;
              }
          }
      }

      const newRepostStatus = !currentRepostedStatus;

      for (const key of broadQueryKeys) {
          queryClient.setQueriesData({ queryKey: [key], exact: false }, (oldData) => 
              updatePostCache(oldData, postId, (post, isOriginalPost) => ({
                ...post,
            stats: {
                  ...post.stats,
                  repostCount: newRepostStatus ? (post.stats?.repostCount || 0) + 1 : (post.stats?.repostCount || 0) - 1,
                },
                isRepostedByCurrentUser: newRepostStatus,
              }))
          );
      }

      if (newRepostStatus) {
          let originalPost = queryClient.getQueryData(['singlePost', postId]);
          if (!originalPost) {
            const feedPostsData = queryClient.getQueryData(['feedPosts']);
            if (feedPostsData?.pages) {
              originalPost = feedPostsData.pages.flatMap(page => page.posts).find(p => p._id === postId);
            }
          }
          
          if (originalPost && currentUser) {
            const tempRepostId = `temp-repost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const placeholderRepost = {
                _id: tempRepostId,
                ownerid: { ...currentUser, _id: currentUser._id },
                content: originalPost.content,
                media: originalPost.media,
                isRepost: true,
                originalPost: { ...originalPost, _id: originalPost._id, isRepostedByCurrentUser: true },
                createdAt: new Date().toISOString(),
                stats: { commentCount: 0, repostCount: (originalPost.stats?.repostCount || 0) + 1, likeCount: originalPost.stats.likeCount },
                isLikedByCurrentUser: originalPost.isLikedByCurrentUser,
                isBookmarkedByCurrentUser: originalPost.isBookmarkedByCurrentUser,
                isRepostedByCurrentUser: true,
            };

            queryClient.setQueriesData({ queryKey: ['feedPosts'], exact: false }, (oldData) => {
        if (!oldData) return oldData;
                const updatedPages = oldData.pages.map((page, index) => {
                    if (index === 0) {
                        return { ...page, posts: [placeholderRepost, ...page.posts] };
                    }
                    return page;
                });
                return { ...oldData, pages: updatedPages };
            });

            // Add to current user's userPosts
            queryClient.setQueriesData({ queryKey: ['userPosts', currentUser._id], exact: false }, (oldData) => {
                if (!oldData) return oldData;
                return { ...oldData, posts: [placeholderRepost, ...oldData.posts] };
            });
          }

      } else {
          const deleteRepostDocumentFromCache = (oldData) => {
        if (!oldData) return oldData;
              if (oldData.posts && Array.isArray(oldData.posts)) {
                  return { ...oldData, posts: oldData.posts.filter(post => 
                      !(post.isRepost && post.originalPost?._id === postId && post.ownerid?._id === currentUser?._id)
                  ) };
              }
              if (oldData.pages && Array.isArray(oldData.pages)) {
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
                          posts: page.posts.filter(post => 
                              !(post.isRepost && post.originalPost?._id === postId && post.ownerid?._id === currentUser?._id)
                          ),
          })),
        };
              }
              return oldData;
          };
          queryClient.setQueriesData({ queryKey: ['feedPosts'], exact: false }, deleteRepostDocumentFromCache);
          // For userPosts, remove the specific repost document created by the current user
          if (currentUser && currentUser._id) { 
            queryClient.setQueriesData({ queryKey: ['userPosts', currentUser._id], exact: false }, deleteRepostDocumentFromCache);
          }
      }

      return { previousQueries };
    },
    onSuccess: ({ action, data, originalPostId }) => {
      // Redux dispatches and direct cache manipulations for feedPosts/userPosts are handled in onMutate for optimistic updates.
      // This onSuccess only confirms the backend operation.
    },
    onError: (err, { postId, isCurrentlyReposted }, context) => {
      if (context?.previousQueries) {
        for (const keyString in context.previousQueries) {
          queryClient.setQueryData(JSON.parse(keyString), context.previousQueries[keyString]);
        }
      }
    },
  });

  return {
    createPostMutation,
    updatePostMutation,
    deletePostMutation,
    likeUnlikePostMutation,
    repostMutation,
    invalidatePostQueries, // Expose for manual invalidation if needed
  };
};


export const useGetPostQuery = (postId) => {
  return useQuery({
    queryKey: ['singlePost', postId],
    queryFn: async () => {
      const response = await axiosInstance.get(`${POST_API_BASE_URL}/${postId}`);
      return response.data.data;
    },
    enabled: !!postId,
    staleTime: 1000 * 60 * 10, // Increased staleTime to 10 minutes
    onError: (error) => {
      // Error handled by Axios interceptor
    },
  });
};


export const useGetUserPostsQuery = (userId, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['userPosts', userId, page, limit],
    queryFn: async () => {
      const response = await axiosInstance.get(`${POST_API_BASE_URL}/user/${userId}?page=${page}&limit=${limit}`);
      return response.data.data;
    },
    enabled: !!userId,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // Increased staleTime to 5 minutes
    onError: (error) => {
      // Error handled by Axios interceptor
    },
  });
};

export const useGetOwnLikedPostsQuery = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['likedPosts', page, limit],
    queryFn: async () => {
      const response = await axiosInstance.get(`${POST_API_BASE_URL}/user-likes?page=${page}&limit=${limit}`);
      return response.data.data;
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // Increased staleTime to 5 minutes
    onError: (error) => {
      // Error handled by Axios interceptor
    },
  });
};

export const useGetUserBookmarksQuery = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['userBookmarks', page, limit],
    queryFn: async () => {
      const response = await axiosInstance.get(`${USER_API_BASE_URL}/bookmarks?page=${page}&limit=${limit}`);
      return response.data.data;
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // Increased staleTime to 5 minutes
    onError: (error) => {
      // Error handled by Axios interceptor
    },
  });
}; 

export const useGetCommentsQuery = (postId, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['postComments', postId, page, limit],
    queryFn: async () => {
      const response = await axiosInstance.get(`${POST_API_BASE_URL}/${postId}/comments?page=${page}&limit=${limit}`);
      return response.data.data;
    },
    enabled: !!postId,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // Increased staleTime to 5 minutes
    onError: (error) => {
      // Error handled by Axios interceptor
    },
  });
};

export const useGetUserCommentsQuery = (userId, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['userComments', userId, page, limit],
    queryFn: async () => {
      const response = await axiosInstance.get(`${POST_API_BASE_URL}/user/${userId}/comments?page=${page}&limit=${limit}`);
      return response.data.data;
    },
    enabled: !!userId,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // Increased staleTime to 5 minutes
    onError: (error) => {
      // Error handled by Axios interceptor
    },
  });
};

export const useSearchPostsQuery = (query, page = 1, limit = 10) => {

  return useQuery({
    queryKey: ['searchPosts', query, page, limit],
    queryFn: async () => {
      const encodedQuery = typeof query === 'string' ? encodeURIComponent(query.trim()) : '';
      const response = await axiosInstance.get(`${POST_API_BASE_URL}/search?query=${encodedQuery}&page=${page}&limit=${limit}`);
      return response.data.data;
    },
    enabled: !!query,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // Increased staleTime to 5 minutes
    onError: (error) => {
      // Error handled by Axios interceptor
    },
  });
};

export const useGetPostsByHashtagQuery = (hashtag, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['hashtagPosts', hashtag, page, limit],
    queryFn: async () => {
      const response = await axiosInstance.get(`${POST_API_BASE_URL}/hashtag/${hashtag}?page=${page}&limit=${limit}`);
      return response.data.data;
    },
    enabled: !!hashtag,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // Increased staleTime to 5 minutes
    onError: (error) => {
      // Error handled by Axios interceptor
    },
  });
};

export const useGetTrendingHashtagsQuery = () => {
  return useQuery({
    queryKey: ['trendingHashtags'],
    queryFn: async () => {
      const response = await axiosInstance.get(`${POST_API_BASE_URL}/trending-hashtags`);
      return response.data.hashtags;
    },
    staleTime: 1000 * 60 * 15, // Increased staleTime to 15 minutes
    onError: (error) => {
      // Error handled by Axios interceptor
    },
  });
};

