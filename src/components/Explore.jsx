import React, { useState, useEffect } from 'react';
import { IoIosSearch } from "react-icons/io";
import { Tweet } from '../minicomponents/Tweet';
import { useSearchPostsQuery, useGetTrendingHashtagsQuery, useGetPostsByHashtagQuery } from '../hooks/usePostCalls';
import { useSearchUsersQuery, useUserActions } from '../hooks/useUserActions';
import useravator from "../defaultavator.png";
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PremiumBadge from '../minicomponents/PremiumBadge';

export const Explore = ({ myfeedRef }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('q') || '';
  });
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('q') || '';
  });
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'posts';
  });
  const [optimisticUsers, setOptimisticUsers] = useState([]); // Add state for optimistic updates
  const [hoveredUserId, setHoveredUserId] = useState(null); // Add state for hover tracking
  const [selectedHashtag, setSelectedHashtag] = useState(null);

  const currentUser = useSelector(state => state.auth.user);
  const { followUserMutation, unfollowUserMutation } = useUserActions();

  const { data: postsData, isLoading: isLoadingPosts, isError: isErrorPosts, error: errorPosts } = useSearchPostsQuery(debouncedSearchQuery);
  const searchResults = postsData?.posts || [];

  const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers, error: errorUsers } = useSearchUsersQuery(debouncedSearchQuery);
  const searchedUsers = React.useMemo(() => usersData?.users || [], [usersData]);

  // Use optimistic users if available, otherwise use API data
  const displayUsers = optimisticUsers.length > 0 ? optimisticUsers : searchedUsers;

  const { data: hashtagsData, isLoading: isLoadingHashtags, isError: isErrorHashtags, error: errorHashtags } = useGetTrendingHashtagsQuery();
  const trendingHashtags = hashtagsData || [];

  const { data: hashtagPostsData, isLoading: isLoadingHashtagPosts, isError: isErrorHashtagPosts, error: errorHashtagPosts } =
    useGetPostsByHashtagQuery(selectedHashtag);
  const hashtagPosts = hashtagPostsData?.posts || [];

  // Update optimistic users when API data changes
  useEffect(() => {
    if (searchedUsers.length > 0) {
      setOptimisticUsers(searchedUsers);
    }
  }, [searchedUsers]);

  useEffect(() => {
    setOptimisticUsers([]);
  }, [debouncedSearchQuery]);


  useEffect(() => {
    if (debouncedSearchQuery === searchQuery) return; // Already up to date (e.g., after hashtag click)
    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      const params = new URLSearchParams();
      if (searchQuery) {
        params.set('q', searchQuery);
      }
      if (activeTab !== 'posts') {
        params.set('tab', activeTab);
      }
      navigate({ search: params.toString() }, { replace: true });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab, navigate]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setSelectedHashtag(null);
  };

  const handleUserClick = (username) => {
    navigate(`/home/profile/${username}`);
  };

  const handleFollowUnfollow = (e, userId) => {
    e.stopPropagation();
    
    // Find the user in the search results
    const userIndex = displayUsers.findIndex(user => user._id === userId);
    if (userIndex === -1) return;
    
    const user = displayUsers[userIndex];
    const isCurrentlyFollowing = user.isFollowingByCurrentUser;
    
    // Optimistically update the UI
    const updatedUsers = [...displayUsers];
    updatedUsers[userIndex] = {
      ...user,
      isFollowingByCurrentUser: !isCurrentlyFollowing
    };
    setOptimisticUsers(updatedUsers);
    
    // Call the appropriate mutation
    if (isCurrentlyFollowing) {
      unfollowUserMutation.mutate(userId);
    } else {
      followUserMutation.mutate(userId);
    }
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setSelectedHashtag(null);
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    if (tabName !== 'posts') {
      params.set('tab', tabName);
    }
    navigate({ search: params.toString() }, { replace: true });
  };

  const handleHashtagClick = (hashtag) => {
    setSelectedHashtag(hashtag);
    setActiveTab('posts');
    setSearchQuery(hashtag); // Optionally clear search box
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex-1">
        <div className="sticky top-0 p-4 z-50 backdrop-blur-md">
          <div className="flex items-center py-2 px-4 text-sm bg-white shadow-2xl rounded-full border border-transparent
            focus-within:border-black/50">
            <IoIosSearch size="18px"/>
            <input
              type="search"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search people, posts or hashtags"
              className="mx-2 bg-inherit text-black w-full focus:outline-none"
            />
          </div>

          <div className="flex justify-around border-b border-gray-200 mt-4">
            <button
              className={`py-2 px-4 text-sm font-semibold ${activeTab === 'posts' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
              onClick={() => handleTabClick('posts')}
            >
              Posts
            </button>
            <button
              className={`py-2 px-4 text-sm font-semibold ${activeTab === 'people' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
              onClick={() => handleTabClick('people')}
            >
              People
            </button>
            <button
              className={`py-2 px-4 text-sm font-semibold ${activeTab === 'trending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
              onClick={() => handleTabClick('trending')}
            >
              Trending
            </button>
          </div>
        </div>

        <div className="">
          {activeTab === 'posts' && (
            <>
              {selectedHashtag ? (
                isLoadingHashtagPosts ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-t-2 border-blue-600 "></div>
                  </div>
                ) : isErrorHashtagPosts ? (
                  <div className="p-4 text-center text-blue-800">Error: {errorHashtagPosts.message}</div>
                ) : hashtagPosts.length > 0 ? (
                  hashtagPosts.map((post) => <Tweet key={post._id} tweet={post} />)
                ) : (
                  <div className="p-4 text-center text-gray-500">No posts found for #{selectedHashtag}.</div>
                )
              ) : (
                isLoadingPosts ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-t-2 border-blue-600 "></div>
                  </div>
                ) : isErrorPosts ? (
                  <div className="p-4 text-center text-blue-800">Error searching posts: {errorPosts.message}</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <Tweet key={result._id} tweet={result} />
                  ))
                ) : (debouncedSearchQuery && !isLoadingPosts) ? (
                  <div className="p-4 text-center text-gray-500">No posts found for "{debouncedSearchQuery}".</div>
                ) : null
              )}
            </>
          )}

          {activeTab === 'people' && (
            <>
              {isLoadingUsers ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-t-2 border-blue-600 "></div>
                </div>
              ) : isErrorUsers ? (
                <div className="p-4 text-center text-blue-800">Error searching people: {errorUsers.message}</div>
              ) : displayUsers.length > 0 ? (
                <div className="space-y-4">
                  {displayUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between gap-2 p-3 bg-white/50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors duration-200"
                      onClick={() => handleUserClick(user.username)}
                    >
                      <div className="flex items-center gap-2">
                        <img src={user.avatar || useravator} alt={user.fullName} className="w-10 h-10 rounded-full"/>
                        <div>
                        
                          <div className="font-bold">{user.fullName}{user.premium?.isActive && <PremiumBadge />}</div>
                          <div className="text-gray-500 text-sm">@{user.username}</div>
                        </div>
                      </div>
                      {currentUser && user._id !== currentUser._id && (
                        <button
                          onClick={(e) => handleFollowUnfollow(e, user._id)}
                          onMouseEnter={() => setHoveredUserId(user._id)}
                          onMouseLeave={() => setHoveredUserId(null)}
                          className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors duration-200
                            ${user.isFollowingByCurrentUser 
                              ? (hoveredUserId === user._id
                                ? 'bg-red-500 text-white hover:bg-red-600 border border-red-500'
                                : 'bg-gray-300 text-gray-800 hover:bg-gray-400')
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                          {user.isFollowingByCurrentUser 
                            ? (hoveredUserId === user._id ? 'Unfollow' : 'Following') 
                            : 'Follow'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (debouncedSearchQuery && !isLoadingUsers) ? (
                <div className="p-4 text-center text-gray-500">No people found for "{debouncedSearchQuery}".</div>
              ) : null}
            </>
          )}

          {activeTab === 'trending' && (
            <>
              {isLoadingHashtags ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-t-2 border-blue-600 "></div>
                </div>
              ) : isErrorHashtags ? (
                <div className="p-4 text-center text-blue-800">Error loading trending hashtags: {errorHashtags.message}</div>
              ) : trendingHashtags.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-lg font-bold mb-2">Trending Hashtags</h3>
                  {trendingHashtags.map((tag, index) => (
                    <div
                      key={index}
                      className="p-2 bg-white/30 rounded-lg cursor-pointer hover:bg-blue-100 transition"
                      onClick={() => handleHashtagClick(tag._id)}
                    >
                      <span className="font-semibold text-blue-600">#{tag._id}</span> 
                      <h6 className='text-xs font-semibold text-gray-700'> ({tag.count} posts)</h6>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">No trending hashtags found.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
