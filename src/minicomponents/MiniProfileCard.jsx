import React, { forwardRef, memo, useState } from "react";
import { Link } from "react-router-dom";
import useravator from "../defaultavator.png";
import PremiumBadge from "./PremiumBadge";
import { useUserActions } from "../hooks/useUserActions";

export const MiniProfileCard = memo(forwardRef(({ top, left, onMouseEnter, onMouseLeave, user }, ref) => {
   const { followUserMutation, unfollowUserMutation } = useUserActions();
  // Hooks must be called unconditionally
  const [isHoveringFollow, setIsHoveringFollow] = useState(false);


  if (!user) return null; // Render nothing if no user data is provided

  // Prefer avatar fields from different shapes returned by the API
  const avatar = user.avatar || user.profile?.avatar || user.profilePicture || useravator;
  const fullName = user.fullName || user.profile?.fullName || user.username || '';
  const username = user.username || user.profile?.username || '';
  const bio = user.bio || user.profile?.bio || 'No bio available.';
  const followersCount = user.followersCount ?? user.profile?.followersCount ?? 0;
  const followingCount = user.followingCount ?? user.profile?.followingCount ?? 0;

  // Follow status: backend may return true/false or null
  const isFollowing = Boolean(user.isFollowingByCurrentUser);

   const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowUserMutation.mutate(user._id);
    } else {
      followUserMutation.mutate(user._id);
    }    
  };

  // Format createdAt as "Month Year"
  const formatMonthYear = (dateValue) => {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  };

  const joined = user.profile?.createdAt ? `Joined ${formatMonthYear(user.profile.createdAt)}` : '';

  return (
    <div
      ref={ref}
      className="absolute bg-blue-200   backdrop-filter backdrop-blur-2xl shadow-lg border border-white border-opacity-30 p-4 rounded-xl w-72 z-50"
      style={{ top: `${top - 50}px`, left: `${left}px` }}
      onMouseEnter={onMouseEnter} // Ensure hover remains active if the mouse enters the modal
      onMouseLeave={onMouseLeave} // Hide the modal when leaving
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <img
            className="rounded-full w-12 h-12 object-cover border-2 border-white shadow-md"
            src={avatar}
            alt={username}
          />
          <h1 className="font-bold text-lg text-gray-800 mt-2 flex items-center gap-2">
            {fullName}
            {user.profile?.premium?.isActive && <PremiumBadge />}
          </h1>
          <p className="text-gray-700 text-sm">@{username}</p>
        </div>
         <button
                className={`text-xs px-4 py-2 rounded-full font-semibold transition duration-200 shadow-md
                  ${isFollowing
                    ? (isHoveringFollow
                      ? "bg-white text-red-500 border border-red-500  hover:text-red-600"
                      : "!bg-blue-700 text-white hover:bg-blue-700")
                    : "!bg-blue-700 text-white hover:bg-blue-700"
                  }
                `}
                onClick={handleFollowToggle}
                onMouseEnter={() => setIsHoveringFollow(true)}
                onMouseLeave={() => setIsHoveringFollow(false)}
              >
                {isFollowing 
                  ? (isHoveringFollow ? "Unfollow" : "Following") 
                  : "Follow"}
              </button>
      </div>
      <p className="text-sm text-gray-700 mt-3">
        {bio}
      </p>
      <div className="flex justify-between mt-4 text-sm text-gray-800">
        <div>
          <span className="font-bold">{followingCount}</span> Following
        </div>
        <div>
          <span className="font-bold">{followersCount}</span> Followers
        </div>
      </div>

      {joined && <div className="text-xs text-gray-600 mt-2">{joined}</div>}

      <Link to={`/home/profile/${username}`} className="block">
        <button className="border-white border-opacity-50 border rounded-full mt-4 py-2 w-full text-center text-sm text-gray-800 font-bold bg-blue-300  hover:bg-opacity-40 transition duration-200 shadow-md">
          Profile Summary
        </button>
      </Link>
    </div>
  );
}));
