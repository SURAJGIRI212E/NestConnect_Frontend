import React, { useState, useEffect, useCallback } from "react";
import { Tweet } from "../minicomponents/Tweet";
import { IoIosArrowBack } from "react-icons/io";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axios";
import LoadingShimmer, { FeedPostShimmer } from './LoadingShimmer';
import {
  useGetUserPostsQuery,
  useGetOwnLikedPostsQuery,
  useGetUserBookmarksQuery,
  useGetUserCommentsQuery
} from '../hooks/usePostCalls';

import { EditProfileModal } from "../minicomponents/EditProfileModal";
import { useUserActions, useGetUserProfileQuery } from "../hooks/useUserActions";
import { RiMoreLine } from "react-icons/ri";
import { useDispatch } from "react-redux";
import { setIsChatOpen, setSelectedPeople } from "../redux/slices/chatSlice";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import PremiumBadge from '../minicomponents/PremiumBadge';
import { useQueryClient } from '@tanstack/react-query';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { username } = useParams();
  const [profileUser, setProfileUser] = useState(() => {
    // Pre-seed when visiting own profile to avoid initial null
    if (currentUser && username && currentUser.username === username) {
      return currentUser;
    }
    return null;
  });
  const [messagePreference, setMessagePreference] = useState('everyone');
  const [updateStatus, setUpdateStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'replies', 'likes', 'bookmarks'
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isHoveringFollow, setIsHoveringFollow] = useState(false);

  const { followUserMutation, unfollowUserMutation, toggleBlockUserMutation } = useUserActions();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Fetch profile user details using react-query / RTK Query hook
  const {
    data: fetchedProfileData,
    isLoading: isLoadingProfile,
    isError: isErrorProfile,
    error: profileQueryError
  } = useGetUserProfileQuery(username);
 
  const handleProfileUpdated = useCallback((updatedUser) => {
    setProfileUser(updatedUser);
  },[])

  // When we have the fetched profile data, set local state
  useEffect(() => {
    // Seed from currentUser immediately if viewing own profile and API not yet resolved
    if (!fetchedProfileData?.user && currentUser && currentUser.username === username) {
      setProfileUser(currentUser);
      setMessagePreference(currentUser.messagePreference || 'everyone');
      return;
    }

    // Avoid flicker: only set when data is available; don't clear existing state
    if (fetchedProfileData?.user) {
      setProfileUser(prev => {
        if (prev?._id === fetchedProfileData.user._id) return prev;
        return fetchedProfileData.user;
      });
      setMessagePreference(fetchedProfileData.user.messagePreference || 'everyone');
    }
  }, [username, fetchedProfileData, currentUser]);

  // Fetch user posts
  const {
    data: userPostsData,
    isLoading: isLoadingUserPosts,
    isError: isErrorUserPosts,
    error: userPostsError
  } = useGetUserPostsQuery(profileUser?._id, 1, 10, { enabled: !!profileUser?._id });

  const userPosts = userPostsData?.posts || [];

  // Fetch user comments (for replies tab)
  const {
    data: userCommentsData,
    isLoading: isLoadingUserComments,
    isError: isErrorUserComments,
    error: userCommentsError
  } = useGetUserCommentsQuery(profileUser?._id, 1, 10, { enabled: !!profileUser?._id });

  const userComments = userCommentsData?.comments || [];

  // Fetch own liked posts (only if it's the current user's profile)
  const {
    data: likedPostsData,
    isLoading: isLoadingLikedPosts,
    isError: isErrorLikedPosts,
    error: likedPostsError
  } = useGetOwnLikedPostsQuery(currentUser?._id === profileUser?._id ? 1 : null, 10, {
    enabled: !!(currentUser?._id && profileUser?._id && currentUser._id === profileUser._id)
  });

  const likedPosts = likedPostsData?.posts || [];

  // Fetch user bookmarks (only if it's the current user's profile)
  const {
    data: bookmarksData,
    isLoading: isLoadingBookmarks,
    isError: isErrorBookmarks,
    error: bookmarksError
  } = useGetUserBookmarksQuery(currentUser?._id === profileUser?._id ? 1 : null, 10, {
    enabled: !!(currentUser?._id && profileUser?._id && currentUser._id === profileUser._id)
  });

  const bookmarks = bookmarksData?.posts || [];

  const handlePreferenceChange = async (e) => {
    const newPreference = e.target.value;
    setMessagePreference(newPreference);
    setUpdateStatus(null);

    try {
      const response = await axiosInstance.patch('/api/users/message-preference', {
        messagePreference: newPreference
      });

      if (response.data.status === 'success') {
        setUpdateStatus({ type: 'success', message: 'Message preference updated successfully!' });

        // Efficiently update the cached profile for this user (no refetch)
        if (profileUser?.username) {
          queryClient.setQueryData(['userProfile', profileUser.username], (old) => {
            if (!old) {
              // Store in the common shape: { user: { ... } }
              return { user: { ...profileUser, messagePreference: newPreference } };
            }
            const oldUser = old.user ? old.user : old;
            return { ...old, user: { ...oldUser, messagePreference: newPreference } };
          });
        }
      } else {
        setUpdateStatus({ type: 'error', message: response.data.message || 'Failed to update preference.' });
      }
    } catch (error) {
      console.error('Error updating message preference:', error);
      setUpdateStatus({ type: 'error', message: error.response?.data?.message || 'Failed to update preference.' });
    }
    setTimeout(() => setUpdateStatus(null), 3000);
  };

  const handleFollowToggle = () => {
    if (profileUser?.isFollowingByCurrentUser) {
      unfollowUserMutation.mutate(profileUser._id);
    } else {
      followUserMutation.mutate(profileUser._id);
    }
    setShowMoreMenu(false);
  };

  const handleBlockToggle = () => {
    if (window.confirm(`Are you sure you want to ${profileUser?.isBlockedByCurrentUser ? 'unblock' : 'block'} @${profileUser?.username}?`)) {
      toggleBlockUserMutation.mutate(profileUser._id);
    }
    setShowMoreMenu(false);
  };

  const handleDirectMessage = () => {
    if (profileUser) {
      dispatch(setSelectedPeople([{
        _id: profileUser._id,
        username: profileUser.username,
        fullName: profileUser.fullName,
        avatar: profileUser.avatar
      }]));
      dispatch(setIsChatOpen(true));
    }
    setShowMoreMenu(false);
  };

  // Format createdAt as "Month Year" (e.g. "August 2025")
  const formatMonthYear = (dateValue) => {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  };

  if (isLoadingProfile) {
    return <LoadingShimmer type="profile-page" />;
  }

  if (isErrorProfile) {
    return <div className="p-4 text-center text-blue-800">Error: {profileQueryError?.message || 'Failed to load profile.'}</div>;
    return <div className="p-4 text-center text-blue-800">Error: {profileQueryError?.message || 'Failed to load profile.'}</div>;
  }

  // Display message if the user is blocked
  if (profileUser?.isBlockedByCurrentUser || profileUser?.blockedByOtherUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-gray-700">
        <p className="text-xl font-semibold mb-4">You have blocked this user, or they have blocked you.</p>
        <p className="text-md text-gray-500">No content available.</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        if (isLoadingUserPosts) {
          return ([...Array(3)].map((_, index) => <FeedPostShimmer key={index} />));
        }
        if (isErrorUserPosts) {
          return <div className="p-4 text-center text-blue-800">Error loading posts: {userPostsError?.message || 'Failed to load posts.'}</div>;
          return <div className="p-4 text-center text-blue-800">Error loading posts: {userPostsError?.message || 'Failed to load posts.'}</div>;
        }
        if (userPosts.length === 0) {
          return <div className="p-4 text-center text-gray-500">No posts available.</div>;
        }
        return userPosts.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />);
      case 'replies':
        if (isLoadingUserComments) {
          return ([...Array(3)].map((_, index) => <FeedPostShimmer key={index} />));
        }
        if (isErrorUserComments) {
          return <div className="p-4 text-center text-blue-800">Error loading comments: {userCommentsError?.message || 'Failed to load comments.'}</div>;
          return <div className="p-4 text-center text-blue-800">Error loading comments: {userCommentsError?.message || 'Failed to load comments.'}</div>;
        }
        if (userComments.length === 0) {
          return <div className="p-4 text-center text-gray-500">No comments available.</div>;
        }
        return userComments.map((comment) => <Tweet key={comment._id} tweet={comment} />);
      case 'likes':
        if (isLoadingLikedPosts) {
          return ([...Array(3)].map((_, index) => <FeedPostShimmer key={index} />));
        }
        if (isErrorLikedPosts) {
          return <div className="p-4 text-center text-blue-800">Error loading liked posts: {likedPostsError?.message || 'Failed to load liked posts.'}</div>;
          return <div className="p-4 text-center text-blue-800">Error loading liked posts: {likedPostsError?.message || 'Failed to load liked posts.'}</div>;
        }
        if (likedPosts.length === 0) {
          return <div className="p-4 text-center text-gray-500">No liked posts available.</div>;
        }
        return likedPosts.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />);
      case 'bookmarks':
        if (isLoadingBookmarks) {
          return ([...Array(3)].map((_, index) => <FeedPostShimmer key={index} />));
        }
        if (isErrorBookmarks) {
          return <div className="p-4 text-center text-blue-800">Error loading bookmarks: {bookmarksError?.message || 'Failed to load bookmarks.'}</div>;
          return <div className="p-4 text-center text-blue-800">Error loading bookmarks: {bookmarksError?.message || 'Failed to load bookmarks.'}</div>;
        }
        if (bookmarks.length === 0) {
          return <div className="p-4 text-center text-gray-500">No bookmarks available.</div>;
        }
        return bookmarks.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />);
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-zinc-200 to-blue-300 min-h-screen">
      <div className="flex-1 ">
        <div className="sticky top-0 z-[102] bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg border-b border-white border-opacity-30 flex items-center px-2">
          <button onClick={() => window.history.back()} className="p-4 text-gray-800 hover:text-blue-600 transition duration-200">
            <IoIosArrowBack size="20px" />
          </button>
          <div className="flex flex-col ml-2">
            <span className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {profileUser?.username}
              {profileUser?.premium?.isActive && <PremiumBadge />}
            </span>
            <span className="text-gray-700 text-xs">{userPosts.length} posts</span>
          </div>
        </div>

        {/* Cover and Profile Picture */}
        <div className="relative">
          <div className="h-48 bg-gray-300 relative overflow-hidden">
            {profileUser?.coverImage && (
              <img src={profileUser.coverImage} alt="Cover" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Profile Picture Container */}
          <div className="px-4">
            <div className="flex items-end justify-between">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-400 mt-[-55px] shadow-lg relative overflow-hidden">
                {profileUser?.avatar && (
                  <img src={profileUser.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end px-4 mt-2">
          {currentUser?._id === profileUser?._id ? (
            <div className="flex gap-2">
              <button
                className="bg-blue-600 text-white text-xs px-4 py-2 rounded-full font-semibold hover:bg-blue-700 transition duration-200 shadow-md"
                onClick={() => setShowEditProfileModal(true)}
              >
                Edit profile
              </button>
              <button
                className="bg-gray-500 text-white text-xs px-4 py-2 rounded-full font-semibold hover:bg-gray-600 transition duration-200 shadow-md"
                onClick={() => navigate('/home/blocked-users')}
              >
                Blocked List
              </button>
            </div>
          ) : (
            <>
              <button
                className={`text-xs px-4 py-2 rounded-full font-semibold transition duration-200 shadow-md
                  ${profileUser?.isFollowingByCurrentUser
                    ? (isHoveringFollow
                      ? "bg-white text-red-500 border border-red-500 hover:text-red-600"
                      : "bg-blue-700 text-white hover:bg-blue-800")
                    : "bg-blue-700 text-white hover:bg-blue-800"
                  }
                `}
                onClick={handleFollowToggle}
                onMouseEnter={() => setIsHoveringFollow(true)}
                onMouseLeave={() => setIsHoveringFollow(false)}
              >
                {profileUser?.isFollowingByCurrentUser
                  ? (isHoveringFollow ? "Unfollow" : "Following")
                  : "Follow"}
              </button>

              <button
                className="ml-2 text-xs px-4 py-2 border border-blue-700 bg-white/90 text-gray-800 rounded-full font-semibold hover:bg-white transition duration-200"
                onClick={handleDirectMessage}
              >
                Message
              </button>

              <div className="relative">
                <button
                  className="ml-2 text-xs px-3 py-2 border border-blue-700 bg-white/90 text-gray-800 rounded-full font-semibold hover:bg-white transition duration-200"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                >
                  <RiMoreLine size="18px" />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                      onClick={handleBlockToggle}
                    >
                      {profileUser?.isBlockedByCurrentUser ? "Unblock" : "Block"} @{profileUser?.username}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex py-4 px-2 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg m-2">
          <div className="flex-1">
            <div className="flex justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-gray-800">
                  {profileUser?.fullName || profileUser?.username}
                  {profileUser?.premium?.isActive && <PremiumBadge />}
                </h1>
                <p className="text-gray-700 text-sm">@{profileUser?.username}</p>
              </div>
            </div>

            <p className="mt-1 text-sm text-gray-700">
              {profileUser?.bio || 'No bio available.'}
            </p>

            <div className="text-sm flex gap-4 text-gray-700 mt-2">
              <span>{profileUser ? `Joined ${formatMonthYear(profileUser.createdAt)}` : ''}</span>
            </div>

            <div className="flex gap-4 mt-1 text-sm text-gray-700">
              <span>
                <strong>{profileUser?.followingCount || 0}</strong>{" "}
                <span>Following</span>
              </span>
              <span>
                <strong>{profileUser?.followersCount || 0}</strong>{" "}
                <span>Followers</span>
              </span>
            </div>
          </div>

          {/* Message Preference Section */}
          {currentUser?._id === profileUser?._id && (
            <div className="p-2">
              <label htmlFor="messagePreference" className="block text-xs font-medium text-gray-700 mb-1">Who can message me?</label>
              <select
                id="messagePreference"
                name="messagePreference"
                value={messagePreference}
                onChange={handlePreferenceChange}
                className="mt-0.5 block py-1.5 text-sm rounded-md bg-white/70 text-gray-800 focus:outline-none focus:ring-1 focus:ring-black focus:ring-opacity-60"
              >
                <option value="everyone">Everyone</option>
                <option value="followers">My Followers</option>
                <option value="following">Users I Follow</option>
                <option value="mutualFollowers">Mutual Followers</option>
                <option value="no one">No one</option>
              </select>
              {updateStatus && (
                <p className={`mt-2 text-xs ${updateStatus.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                  {updateStatus.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white border-opacity-30 mt-4 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg m-4">
          <button
            className={`flex-1 py-3 font-semibold ${activeTab === 'posts' ? 'border-b-2 border-blue-500 text-blue-700' : 'text-gray-700'} hover:text-blue-800 transition duration-200`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button
            className={`flex-1 py-3 font-semibold ${activeTab === 'replies' ? 'border-b-2 border-blue-500 text-blue-700' : 'text-gray-700'} hover:text-blue-800 transition duration-200`}
            onClick={() => setActiveTab('replies')}
          >
            Replies
          </button>
          {currentUser?._id === profileUser?._id && (
            <button
              className={`flex-1 py-3 font-semibold ${activeTab === 'likes' ? 'border-b-2 border-blue-500 text-blue-700' : 'text-gray-700'} hover:text-blue-800 transition duration-200`}
              onClick={() => setActiveTab('likes')}
            >
              Likes
            </button>
          )}
          {currentUser?._id === profileUser?._id && (
            <button
              className={`flex-1 py-3 font-semibold ${activeTab === 'bookmarks' ? 'border-b-2 border-blue-500 text-blue-700' : 'text-gray-700'} hover:text-blue-800 transition duration-200`}
              onClick={() => setActiveTab('bookmarks')}
            >
              Bookmarks
            </button>
          )}
        </div>

        {/* Posts Feed */}
        <div className="space-y-4 px-2 pb-8">
          {renderContent()}
        </div>
      </div>

      {showEditProfileModal && (
        <EditProfileModal
          onClose={() => setShowEditProfileModal(false)}
          currentProfileUser={profileUser}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
};

export default Profile;