import useravator from "../defaultavator.png";
import { RiMoreLine } from "react-icons/ri";
import { IoMdHeartEmpty, IoMdHeart } from "react-icons/io";
import { FaRegComment } from "react-icons/fa6";
import { IoBookmarkOutline, IoBookmarkSharp } from "react-icons/io5";
import { AiOutlineRetweet } from "react-icons/ai";
import { IoShareOutline } from "react-icons/io5";
import { usePostCalls } from '../hooks/usePostCalls';
import { useUserActions } from '../hooks/useUserActions';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, memo } from 'react';
import { EditPostModal } from './EditPostModal';
import { formatTimeAgo } from '../utils/timeAgo';
import PremiumBadge from "./PremiumBadge";
import MediaSlider from "./MediaSlider";

export const Tweet = memo(({ isComment, tweet, isBookmarked, depth = 0, postOwnerId }) => {
  const { likeUnlikePostMutation, repostMutation, deletePostMutation } = usePostCalls();
  const { followUserMutation, unfollowUserMutation, toggleBlockUserMutation, toggleBookmarkMutation } = useUserActions();
  const currentUser = useSelector(state => state.auth.user);
  const navigate = useNavigate();

  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const menuRef = useRef(null);

  // Determine the author of the displayed content (either the main tweet or the original post if it's a repost)
  const postAuthor = tweet?.isRepost && tweet.originalPost ? tweet.originalPost?.ownerid : tweet?.ownerid;


  // Ensure _id comparison is robust
  const currentUserId = currentUser?._id?.toString();
  const postAuthorId = postAuthor?._id?.toString();

  const isCurrentUserPost = currentUserId === postAuthorId;
  const isFollowedByCurrentUser = postAuthor?.isFollowingByCurrentUser; // Use flag from backend
  const isBlockedByCurrentUser = postAuthor?.isBlockedByCurrentUser;   // Use flag from backend

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLike = (e) => {
    e.stopPropagation();
    if (tweet?._id) {
      const postIdToLike = tweet.isRepost && tweet.originalPost ? tweet.originalPost?._id : tweet._id;
      if (postIdToLike) {
        likeUnlikePostMutation.mutate(postIdToLike);
      }
    }
  };

  const handleRepost = (e) => {
    e.stopPropagation();
    if (tweet?._id) {
      const postIdToActOn = tweet.isRepost && tweet.originalPost ? tweet.originalPost?._id : tweet._id;
      const isCurrentlyReposted = tweet.isRepost && tweet.originalPost ? tweet.originalPost?.isRepostedByCurrentUser : tweet?.isRepostedByCurrentUser;
      if (postIdToActOn) {
        repostMutation.mutate({ postId: postIdToActOn, isCurrentlyReposted });
      }
    }
  };

  const handleDeletePost = (e) => {
    e.stopPropagation();
    if (tweet?._id && window.confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(tweet._id);
      setShowMenu(false);
    }
  };

  const handleEditPost = (e) => {
    e.stopPropagation();
    setShowEditModal(true);
    setShowMenu(false);
  };

  const handleFollowToggle = (e) => {
    e.stopPropagation();
    if (postAuthor?._id) {
      if (isFollowedByCurrentUser) {
        unfollowUserMutation.mutate(postAuthor._id);
      } else {
        followUserMutation.mutate(postAuthor._id);
      }
      setShowMenu(false);
    }
  };

  const handleBlockToggle = (e) => {
    e.stopPropagation();
    if (postAuthor?._id) {
      if (window.confirm(`Are you sure you want to ${isBlockedByCurrentUser ? 'unblock' : 'block'} @${postAuthor?.username}?`)) {
        toggleBlockUserMutation.mutate(postAuthor._id);
        setShowMenu(false);
      }
    }
  };

  const handleBookmarkToggle = (e) => {
    e.stopPropagation();
    const postIdToBookmark = tweet.isRepost && tweet.originalPost ? tweet.originalPost?._id : tweet._id;
    if (postIdToBookmark) {
      toggleBookmarkMutation.mutate(postIdToBookmark);
    }
  };

  const isPostLikedByCurrentUser = tweet.isRepost && tweet.originalPost ? tweet.originalPost?.isLikedByCurrentUser : tweet?.isLikedByCurrentUser;
  const isPostRepostedByCurrentUser = tweet.isRepost && tweet.originalPost ? tweet.originalPost?.isRepostedByCurrentUser : tweet?.isRepostedByCurrentUser;

  const postIdForNavigation = tweet.isRepost && tweet.originalPost ? tweet.originalPost?._id : tweet._id;

  return (
    <div 
      className={`flex flex-col px-2 py-2 cursor-pointer border-b border-white border-opacity-30 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg mx-2 my-4 hover:bg-opacity-30 transition duration-200 `}
      onClick={(e) => {
        if (!e.target.closest('button') && !e.target.closest('a')) {
          navigate(`/home/post/${postIdForNavigation}`);
        }
      }}
    >
      {/* Comment Indicator and Parent Post Display (Always at the top if present) */}
      {tweet?.parentPost && tweet.parentPost.ownerid && (
        <div className="w-full flex flex-col items-start mb-1">
          {/* "Replying to" indicator */}
          <div className="text-gray-700 text-xs font-semibold flex items-center gap-1 mb-2">
            <FaRegComment size="14px" />
            <span>Replying to @{tweet.parentPost.ownerid?.username || "unknown"}</span>
          </div>

          {/* Parent Post Content */}
          {isComment?null:<Link
            to={`/home/post/${tweet.parentPost.username}`}
            className="w-full mb-4 p-3 border border-white border-opacity-30 rounded-xl  bg-opacity-10 hover:bg-opacity-20 transition duration-200 block"
            onClick={(e) => e.stopPropagation()} // Prevent navigation on main tweet when clicking parent post link
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center">
                <img className="rounded-full w-8 h-8 object-cover" src={(() => {
                  const avatarUrl = tweet.parentPost.ownerid?.avatar;
                  if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
                    return avatarUrl;
                  } else {
                    return useravator;
                  }
                })()} alt="profile" />
                <h1 className="text-xs font-bold text-gray-800">
                  {tweet.parentPost.ownerid?.fullName || "Unknown User"}
                  {( (tweet?.parentPost.ownerid?.premium?.isActive)) && <PremiumBadge />}
                </h1>
                <p className="text-gray-700 text-xs">@{tweet.parentPost.ownerid?.username || "unknown"}.</p>
                <span className="text-gray-700 text-xs">
                  {tweet.parentPost.createdAt ? formatTimeAgo(tweet.parentPost.createdAt) : "N/A"}
                </span>
              </div>
            </div>
            <p className="text-left text-sm text-gray-700 break-words mt-1">
              {tweet.parentPost.content}
            </p>
            {tweet.parentPost.media && tweet.parentPost.media.length > 0 && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tweet.parentPost.media.map((mediaItem, index) => (
                  <div key={index} className="w-full h-auto max-h-48 rounded-lg overflow-hidden">
                    {mediaItem.type.startsWith('image') ? (
                      <img src={mediaItem.url} alt="parent post media" className="w-full h-full object-cover" />
                    ) : (
                      <video src={mediaItem.url} controls className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Link>}
        </div>
      )}

      {/* Repost Indicator (if the current tweet is a repost) */}
      {tweet?.isRepost && tweet.originalPost && (
        <div className={`absolute -top-4 left-2 text-blue-600 text-sm font-semibold flex items-center gap-1 ${depth > 0 ? `ml-${depth * 4}` : ''}`}>
          <AiOutlineRetweet size="16px" />
          <span>
          {tweet?.ownerid?.username  !== currentUser?.username && 
              `${tweet.ownerid.username} `
            }reposted
          </span>
        </div>
      )}

      {/* Main Content of the Current Tweet (conditionally indented if it's a comment) */}
      <div className={`flex gap-1 w-full ${tweet?.parentPost && !isComment ? 'ml-2 border-l-2 border-black pt-5' : ''}`}>
        {/* Avatar Section */}
        <div className="w-[30px]  items-start mt-1">
          <Link to={`/home/profile/${postAuthor?.username}`} onClick={(e) => e.stopPropagation()}>
          <img className="rounded-full w-14  object-cover" 
            src={(() => {
              const avatarUrl = tweet?.isRepost && tweet.originalPost ? tweet.originalPost?.ownerid?.avatar : tweet?.ownerid?.avatar;
              if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
                
                return avatarUrl;
              } else {
                return useravator;
              }
            })()} 
            alt="profile"
          />
          </Link>
        </div>

        <div className="w-full">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center justify-center gap-1">
              <Link to={`/home/profile/${postAuthor?.username}`} className="flex items-center" onClick={(e) => e.stopPropagation()}>
              <h1 className="text-xs font-bold text-gray-800">
                {tweet?.isRepost && tweet.originalPost ? tweet.originalPost?.ownerid?.fullName || "Unknown User" : tweet?.ownerid?.fullName || "Unknown User"}
                {(tweet?.isRepost
                  ? tweet.originalPost?.ownerid?.premium?.isActive
                  : tweet?.ownerid?.premium?.isActive) && <PremiumBadge />}
              </h1>
              <p className="text-gray-700 text-xs">@{tweet?.isRepost && tweet.originalPost ? tweet.originalPost?.ownerid?.username || "unknown" : tweet?.ownerid?.username || "unknown"}.</p>
              </Link>
              <span className="text-gray-700 text-xs">
                {tweet?.createdAt ? formatTimeAgo(tweet.createdAt) : "N/A"}
              </span>
            </div>

            <div className="relative" ref={menuRef}>
              <button 
                className="rounded-full p-2 text-lg text-gray-700 hover:bg-blue-200 hover:text-blue-700  transition duration-200"
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              >
                <RiMoreLine />
              </button>
              {showMenu && (
                <div className="z-100 absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                  {isCurrentUserPost ? (
                    <>
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleEditPost}
                      >
                        Edit Post
                      </button>
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        onClick={handleDeletePost}
                      >
                        Delete Post
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleFollowToggle}
                      >
                        {isFollowedByCurrentUser ? `Unfollow @${postAuthor?.username}` : `Follow @${postAuthor?.username}`}
                      </button>
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                        onClick={handleBlockToggle}
                      >
                        {isBlockedByCurrentUser ? `Unblock @${postAuthor?.username}` : `Block @${postAuthor?.username}`}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Tweet Section */}
          <div className="mt-[-5px] ">
            <p className="text-left text-sm text-gray-700 break-words">
              {tweet?.isRepost && tweet.originalPost ? tweet.originalPost?.content : tweet?.content}
            </p>
            {tweet?.media && tweet.media.length > 0 && (
              tweet.media.length > 1 ? (
                <MediaSlider media={tweet.media} />
              ) : (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="w-full h-auto max-h-96 rounded-lg overflow-hidden">
                    {tweet.media[0].type.startsWith('image') ? (
                      <img src={tweet.media[0].url} alt="post media" className="w-full h-full object-full" />
                    ) : (
                      <video src={tweet.media[0].url} controls className="w-full h-full object-full" />
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Tweet Actions Section */}
          <div className="flex justify-between items-center text-gray-700 ">
            <button className="flex items-center rounded-full p-2 hover:bg-blue-200 hover:text-blue-600 transition duration-200" onClick={(e) => { e.stopPropagation(); navigate(`/home/post/${postIdForNavigation}`); }}>
              <FaRegComment size="14px" />
              <p className="text-xs">{tweet?.isRepost && tweet.originalPost ? tweet.originalPost?.stats?.commentCount || 0 : tweet?.stats?.commentCount || 0}</p>
            </button>
            <button className={`flex items-center rounded-full p-2 ${isPostRepostedByCurrentUser ? 'text-green-500' : 'hover:bg-green-100 hover:text-green-600'} transition duration-200`} onClick={handleRepost} disabled={repostMutation.isLoading}>
              <AiOutlineRetweet size="14px" />
              <p className="text-xs">{tweet?.isRepost && tweet.originalPost ? tweet.originalPost?.stats?.repostCount || 0 : tweet?.stats?.repostCount || 0}</p>
            </button>
            <button className={`flex items-center rounded-full p-2 ${isPostLikedByCurrentUser ? 'text-red-500' : 'hover:bg-red-100 hover:text-red-600'} transition duration-200`} onClick={handleLike} disabled={likeUnlikePostMutation.isLoading}>
              {isPostLikedByCurrentUser ? <IoMdHeart size="14px" /> : <IoMdHeartEmpty size="14px" />}
              <p className="text-xs">{tweet?.isRepost && tweet.originalPost ? tweet.originalPost?.stats?.likeCount || 0 : tweet?.stats?.likeCount || 0}</p>
            </button>
            <div className="flex items-center rounded-full p-2 hover:bg-yellow-100 hover:text-yellow-600 transition duration-200" onClick={handleBookmarkToggle}>
              {(tweet?.isRepost && tweet.originalPost?.isBookmarkedByCurrentUser) || (!tweet?.isRepost && tweet?.isBookmarkedByCurrentUser) ? (
                <IoBookmarkSharp size="14px" className="text-blue-600" />
              ) : (
                <IoBookmarkOutline size="14px" />
              )}
            </div>
            <div className="flex items-center rounded-full p-2 hover:bg-orange-100 hover:text-orange-600 transition duration-200" onClick={(e) => e.stopPropagation()}>
              <IoShareOutline size="14px" />
              <p className="text-xs">Share</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Post Modal */}
      {showEditModal && (
        <EditPostModal 
          post={tweet} 
          onClose={() => setShowEditModal(false)} 
        />
      )}
    </div>
  );
});
