import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../utils/axios';
import { updatePostCache } from '../utils/postCacheHelpers';
// import { useSelector } from 'react-redux';

const USER_API_BASE_URL = '/api/users';
const FOLLOW_API_BASE_URL = '/api/follow';

export const useUserActions = () => {
    const queryClient = useQueryClient();
    // const currentUser = useSelector(state => state.auth.user);
   

    // Follow a user
    const followUserMutation = useMutation({
        mutationFn: async (userId) => {
            const response = await axiosInstance.post(`${FOLLOW_API_BASE_URL}/${userId}`);
            return response.data;
        },
        // Optimistic update: only update caches that are affected to avoid many unnecessary API calls
        onMutate: async (userId) => {
            await queryClient.cancelQueries({ queryKey: ['suggestedUsers'], exact: false });
            await queryClient.cancelQueries({ queryKey: ['userProfile'], exact: false });

            const previous = {};

            // Snapshot suggestedUsers cache
            const suggested = queryClient.getQueryData(['suggestedUsers']);
            previous['suggestedUsers'] = suggested;
            if (suggested) {
                queryClient.setQueryData(['suggestedUsers'], (old = []) =>
                    old.map(u => u._id === userId ? { ...u, followersCount: (u.followersCount || 0) + 1, isFollowingByCurrentUser: true } : u)
                );
            }

            // Snapshot and update any userProfile caches for this userId
            const userProfileQueries = queryClient.getQueriesData({ queryKey: ['userProfile'], exact: false });
            previous['userProfile'] = userProfileQueries.map(([key, data]) => [key, data]);
            for (const [key, data] of userProfileQueries) {
                if (data?.user?._id === userId) {
                    queryClient.setQueryData(key, {
                        ...data,
                        user: {
                            ...data.user,
                            isFollowingByCurrentUser: true,
                            followersCount: (data.user.followersCount || 0) + 1,
                        }
                    });
                }
            }

            return { previous };
        },
        onError: (err, userId, context) => {
            // rollback
            if (context?.previous?.suggestedUsers !== undefined) {
                queryClient.setQueryData(['suggestedUsers'], context.previous.suggestedUsers);
            }
            if (context?.previous?.userProfile) {
                for (const [key, data] of context.previous.userProfile) {
                    queryClient.setQueryData(key, data);
                }
            }
        },
        onSettled: () => {
            // Invalidate only the minimal caches to reconcile with server
            queryClient.invalidateQueries({ queryKey: ['suggestedUsers'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['userProfile'], exact: false });
        },
    });

    // Unfollow a user
    const unfollowUserMutation = useMutation({
        mutationFn: async (userId) => {
            const response = await axiosInstance.delete(`${FOLLOW_API_BASE_URL}/${userId}`);
            return response.data;
        },
        onMutate: async (userId) => {
            await queryClient.cancelQueries({ queryKey: ['suggestedUsers'], exact: false });
            await queryClient.cancelQueries({ queryKey: ['userProfile'], exact: false });

            const previous = {};

            // Snapshot suggestedUsers cache
            const suggested = queryClient.getQueryData(['suggestedUsers']);
            previous['suggestedUsers'] = suggested;
            if (suggested) {
                queryClient.setQueryData(['suggestedUsers'], (old = []) =>
                    old.map(u => u._id === userId ? { ...u, followersCount: Math.max((u.followersCount || 1) - 1, 0), isFollowingByCurrentUser: false } : u)
                );
            }

            // Snapshot and update any userProfile caches for this userId
            const userProfileQueries = queryClient.getQueriesData({ queryKey: ['userProfile'], exact: false });
            previous['userProfile'] = userProfileQueries.map(([key, data]) => [key, data]);
            for (const [key, data] of userProfileQueries) {
                if (data?.user?._id === userId) {
                    queryClient.setQueryData(key, {
                        ...data,
                        user: {
                            ...data.user,
                            isFollowingByCurrentUser: false,
                            followersCount: Math.max((data.user.followersCount || 1) - 1, 0),
                        }
                    });
                }
            }

            return { previous };
        },
        onError: (err, userId, context) => {
            if (context?.previous?.suggestedUsers !== undefined) {
                queryClient.setQueryData(['suggestedUsers'], context.previous.suggestedUsers);
            }
            if (context?.previous?.userProfile) {
                for (const [key, data] of context.previous.userProfile) {
                    queryClient.setQueryData(key, data);
                }
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['suggestedUsers'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['userProfile'], exact: false });
        },
    });

    // Block/Unblock a user (optimized: only update blockedUsers + affected userProfile caches)
    const toggleBlockUserMutation = useMutation({
        mutationFn: async (userId) => {
            const response = await axiosInstance.post(`${USER_API_BASE_URL}/toogleblock/${userId}`);
            return response.data;
        },
        onMutate: async (userId) => {
            // Cancel only the queries we will update to avoid triggering unrelated refetches (e.g. notifications)
            await queryClient.cancelQueries({ queryKey: ['blockedUsers'], exact: true });
            await queryClient.cancelQueries({ queryKey: ['userProfile'], exact: false });

            const previous = {};

            // Snapshot blockedUsers list
            const prevBlocked = queryClient.getQueryData(['blockedUsers']);
            previous.blockedUsers = prevBlocked;

            // Optimistically update blockedUsers list (add or remove userId)
            if (Array.isArray(prevBlocked)) {
                const isCurrentlyBlocked = prevBlocked.some(u => u._id === userId || u === userId);
                const newBlocked = isCurrentlyBlocked ? prevBlocked.filter(u => (typeof u === 'string' ? u : u._id) !== userId) : [...prevBlocked, userId];
                queryClient.setQueryData(['blockedUsers'], newBlocked);
            }

            // Snapshot and update any userProfile caches corresponding to the toggled userId
            const userProfileQueries = queryClient.getQueriesData({ queryKey: ['userProfile'], exact: false });
            previous.userProfiles = userProfileQueries.map(([key, data]) => [key, data]);
            for (const [key, data] of userProfileQueries) {
                if (data?.user?._id === userId) {
                    // When current user blocks another user, mark that user's profile as blocked by current user
                    const currentlyBlocked = data.user.isBlockedByCurrentUser;
                    queryClient.setQueryData(key, {
                        ...data,
                        user: {
                            ...data.user,
                            isBlockedByCurrentUser: !currentlyBlocked,
                        }
                    });
                }
            }

            return { previous };
        },
        onError: (err, userId, context) => {
            // rollback
            if (context?.previous?.blockedUsers !== undefined) {
                queryClient.setQueryData(['blockedUsers'], context.previous.blockedUsers);
            }
            if (context?.previous?.userProfiles) {
                for (const [key, data] of context.previous.userProfiles) {
                    queryClient.setQueryData(key, data);
                }
            }
        },
        onSuccess: (responseData, userId) => {
            // If server returns an updated blockedUsers list or user object, reconcile caches
            const serverBlocked = responseData?.data?.blockedUsers;
            if (serverBlocked) {
                queryClient.setQueryData(['blockedUsers'], serverBlocked);
            }

            const updatedUser = responseData?.data?.user;
            if (updatedUser) {
                // find any userProfile entries for this user and update them
                const userProfileQueries = queryClient.getQueriesData({ queryKey: ['userProfile'], exact: false });
                for (const [key, data] of userProfileQueries) {
                    if (data?.user?._id === updatedUser._id) {
                        queryClient.setQueryData(key, { ...data, user: { ...data.user, ...updatedUser } });
                    }
                }
            }
        },
        onSettled: () => {
            // Minimal reconciliation: ensure blockedUsers cache is fresh. Avoid invalidating notifications or other unrelated queries.
            queryClient.invalidateQueries({ queryKey: ['blockedUsers'], exact: true });
        },
    });

    // Toggle bookmark (with optimistic update)
    const toggleBookmarkMutation = useMutation({
        mutationFn: async (postId) => {
            const response = await axiosInstance.post(`${USER_API_BASE_URL}/bookmarks/${postId}`);
            return response.data;
        },
        onMutate: async (postId) => {
            // Broad query keys that display posts and need bookmark status updated
            const broadQueryKeys = [
                'feedPosts',
                'userPosts',
                'singlePost',
                'likedPosts',
                'hashtagPosts',
                'searchPosts',
                'postComments',
                'userComments',
                'userBookmarks', // This one will also handle the optimistic removal
            ];

            // Cancel any outgoing refetches for all relevant queries to avoid conflicts
            for (const key of broadQueryKeys) {
                await queryClient.cancelQueries({ queryKey: [key], exact: false });
            }

            // Snapshot the previous values of the queries for rollback
            const previousQueries = {};
            for (const key of broadQueryKeys) {
                const queries = queryClient.getQueriesData({ queryKey: [key], exact: false });
                for (const [, data] of queries) {
                    // first element (queryKeyArray) not needed here
                    previousQueries[JSON.stringify(data?.queryKey || [])] = data;
                }
            }

            // Determine the current bookmarked status from caches
            let currentBookmarkedStatus = false;
            // Prioritize specific caches for current status
            const singlePostData = queryClient.getQueryData(['singlePost', postId]);
            if (singlePostData) {
                currentBookmarkedStatus = singlePostData?.isBookmarkedByCurrentUser;
            } else {
                const feedPostsData = queryClient.getQueryData(['feedPosts']);
                let foundInFeed = null;
                if (feedPostsData?.pages) {
                    foundInFeed = feedPostsData.pages.flatMap(page => page.posts).find(p => p._id === postId || (p.isRepost && p.originalPost?._id === postId));
                }
                if (foundInFeed) {
                    currentBookmarkedStatus = foundInFeed.isRepost && foundInFeed.originalPost ? foundInFeed.originalPost?.isBookmarkedByCurrentUser : foundInFeed?.isBookmarkedByCurrentUser;
                } else {
                    // Check other broad queries
                    for (const key of broadQueryKeys.filter(k => k !== 'feedPosts' && k !== 'singlePost')) {
                        const queries = queryClient.getQueriesData({ queryKey: [key], exact: false });
                        for (const [, data] of queries) {
                            if (data && data.posts) {
                                const foundPost = data.posts.find(p => p._id === postId || (p.isRepost && p.originalPost?._id === postId));
                                if (foundPost) {
                                    currentBookmarkedStatus = foundPost.isRepost && foundPost.originalPost ? foundPost.originalPost?.isBookmarkedByCurrentUser : foundPost?.isBookmarkedByCurrentUser;
                                    break;
                                }
                            } else if (data && data.comments) {
                                const foundComment = data.comments.find(c => c._id === postId || (c.isRepost && c.originalPost?._id === postId));
                                if (foundComment) {
                                    currentBookmarkedStatus = foundComment.isRepost && foundComment.originalPost ? foundComment.originalPost?.isBookmarkedByCurrentUser : foundComment?.isBookmarkedByCurrentUser;
                                    break;
                                }
                            }
                        }
                        if (currentBookmarkedStatus) break;
                    }
                }
            }
            
            const newBookmarkStatus = !currentBookmarkedStatus;

            // Apply optimistic update for isBookmarkedByCurrentUser flag across all relevant caches using updatePostCache
            for (const key of broadQueryKeys) {
                queryClient.setQueriesData({ queryKey: [key], exact: false }, (oldData) => 
                    updatePostCache(oldData, postId, (post) => ({
                        ...post,
                        isBookmarkedByCurrentUser: newBookmarkStatus,
                    }))
                );
            }

            // If unbookmarking, also optimistically remove from the userBookmarks list
            if (!newBookmarkStatus) {
                queryClient.setQueriesData({ queryKey: ['userBookmarks'], exact: false }, (oldData) => {
                    if (!oldData || !oldData.posts) return oldData;
                    return { ...oldData, posts: oldData.posts.filter(p => p._id !== postId) };
                });
            }

            return { previousQueries };
        },
        onError: (err, postId, context) => {
            if (context?.previousQueries) {
                for (const keyString in context.previousQueries) {
                    queryClient.setQueryData(JSON.parse(keyString), context.previousQueries[keyString]);
                }
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['userBookmarks'], exact: false });
        },
    });

    return {
        followUserMutation,
        unfollowUserMutation,
        toggleBlockUserMutation,
        toggleBookmarkMutation,
    };
};

// Query for fetching a user profile
export const useGetUserProfileQuery = (username) => {
    return useQuery({
        queryKey: ['userProfile', username],
        queryFn: async () => {
            const response = await axiosInstance.get(`${USER_API_BASE_URL}/getuser/${username}`);
            return response.data.data;
        },
        enabled: !!username,
        staleTime: 1000 * 60 * 10,
    });
};

// Query for fetching blocked users
export const useGetBlockedUsersQuery = () => {
    return useQuery({
        queryKey: ['blockedUsers'],
        queryFn: async () => {
            const response = await axiosInstance.get(`${USER_API_BASE_URL}/blocked-users`);
            return response.data.data;
        },
        staleTime: 1000 * 60 * 5,
    });
}; 

export const useSearchUsersQuery = (query, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['searchUsers', query, page, limit],
    queryFn: async () => {
      const encodedQuery = typeof query === 'string' ? encodeURIComponent(query.trim()) : '';
      const response = await axiosInstance.get(`${USER_API_BASE_URL}/search?query=${encodedQuery}&page=${page}&limit=${limit}`);
      return response.data.data;
    },
    enabled: typeof query === 'string' && query.trim().length >= 2, // Enable only when query has at least 2 non-whitespace characters
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: (error) => {
      // Error handled by Axios interceptor
    },
  });
}; 

export const useSuggestedUsers = (limit = 5) => {
  return useQuery({
    queryKey: ['suggestedUsers', limit],
    queryFn: async () => {
      const res = await axiosInstance.get(`${USER_API_BASE_URL}/suggested?limit=${limit}`);
      return res.data.data;
    },
  });
};

// Query for fetching notification preferences
export const useNotificationPreferences = () => {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, isError, error } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const response = await axiosInstance.get(`${USER_API_BASE_URL}/me/notification-preferences`);
      return response.data.notificationPreferences;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences) => {
      const response = await axiosInstance.put(`${USER_API_BASE_URL}/me/notification-preferences`, { notificationPreferences: newPreferences });
      return response.data.notificationPreferences;
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['notificationPreferences'], updatedData);
    },
    // No onError needed, as axiosInstance handles global errors
  });

  return {
    preferences,
    isLoading,
    isError,
    error,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdating: updatePreferencesMutation.isLoading,
    updateError: updatePreferencesMutation.error,
  };
};