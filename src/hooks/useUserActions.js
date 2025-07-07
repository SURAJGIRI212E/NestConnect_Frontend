import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../utils/axios';
import { updatePostCache } from '../utils/postCacheHelpers';

const USER_API_BASE_URL = '/api/users';
const FOLLOW_API_BASE_URL = '/api/follow';

export const useUserActions = () => {
    const queryClient = useQueryClient();
   

    // Follow a user
    const followUserMutation = useMutation({
        mutationFn: async (userId) => {
            const response = await axiosInstance.post(`${FOLLOW_API_BASE_URL}/${userId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['userProfile']);
            queryClient.invalidateQueries(['followers']);
            queryClient.invalidateQueries(['following']);
            queryClient.invalidateQueries(['suggestedUsers']);
        },
    });

    // Unfollow a user
    const unfollowUserMutation = useMutation({
        mutationFn: async (userId) => {
            const response = await axiosInstance.delete(`${FOLLOW_API_BASE_URL}/${userId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['userProfile']);
            queryClient.invalidateQueries(['followers']);
            queryClient.invalidateQueries(['following']);
            queryClient.invalidateQueries(['suggestedUsers']);
        },
    });

    // Block/Unblock a user
    const toggleBlockUserMutation = useMutation({
        mutationFn: async (userId) => {
            const response = await axiosInstance.post(`${USER_API_BASE_URL}/toogleblock/${userId}`);
            return response.data;
        },
        onSuccess: (data, toggledUserId) => {
            queryClient.invalidateQueries(['blockedUsers']);
            if (toggledUserId) {
                queryClient.invalidateQueries(['userProfile', toggledUserId]);
            }
            queryClient.invalidateQueries(['userBookmarks']);
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
                for (const [queryKeyArray, data] of queries) {
                    previousQueries[JSON.stringify(queryKeyArray)] = data;
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
                        for (const [queryKeyArray, data] of queries) {
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
        refetchOnMount: false,
        refetchOnWindowFocus: false,
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