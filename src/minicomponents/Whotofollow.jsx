import React, { useRef } from "react";
import badge from "../Badge.png";
import defaultavator from "../defaultavator.png";
import useHover from "../hooks/userHover";
import { MiniProfileCard } from "./MiniProfileCard";
import { useSuggestedUsers, useUserActions } from "../hooks/useUserActions";
import { WhoToFollowItemShimmer } from "../components/LoadingShimmer";

export const WhoToFollow = () => {
  const { isHovering, position, handleMouseEnter, handleMouseLeave, clearHideTimeout } = useHover();
  const cardRef = useRef(null); // Ref for the modal
  const profileRefs = useRef([]); // Refs for each profile suggestion
  const { data: suggestions = [], isLoading, isError } = useSuggestedUsers(5);
     const { followUserMutation } = useUserActions();

 

  const handleMouseLeaveWithRef = (e) => {
    const relatedTarget = e.relatedTarget;

    // Validate that relatedTarget is a Node (DOM element) before proceeding
    if (
      relatedTarget instanceof Node &&
      !cardRef.current?.contains(relatedTarget) && // Not hovering over the modal
      !profileRefs.current.some((ref) => ref && ref.contains(relatedTarget)) // Not hovering over any profile
    ) {
      handleMouseLeave();
    }
  };

  const handleCardMouseEnter = () => {
    clearHideTimeout();
  };

  const handleProfileMouseEnter = (e, index) => {
    clearHideTimeout();
    handleMouseEnter(e, index);
  };

  // suggestions now comes from backend

  return (
    <div className="min-w-72 cursor-pointer p-2 mt-4 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg border border-white border-opacity-30">
      <h2 className="text-xl font-bold mb-4 text-black">Who to follow</h2>
      {isLoading && <div>
                  <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div> {/* Who to follow title */}
                  {[...Array(3)].map((_, index) => (
                   <WhoToFollowItemShimmer/>
                  ))}
                  <div className="h-4 bg-gray-300 rounded w-1/4 mt-4"></div> {/* Show more */}
                </div>}
      {isError && <div className="text-blue-800">Failed to load suggestions.</div>}
      {suggestions.length === 0 && !isLoading && !isError && (
        <div className="text-gray-500">No suggestions found.</div>
      )}
      {suggestions.map((user, index) => (
        <div
          key={user._id || index}
          className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-white hover:bg-opacity-30 transition duration-200"
          ref={(el) => (profileRefs.current[index] = el)}
          onMouseEnter={(e) => handleProfileMouseEnter(e, index)}
          onMouseLeave={handleMouseLeaveWithRef}
        >
          <div className="flex items-center">
            <img
              src={user.avatar || defaultavator}
              alt="dp"
              className="w-10 h-10 rounded-full mr-3 border-2 border-white shadow-sm"
            />
            <div>
              <div className="flex items-center">
                <span className="font-bold text-sm text-gray-800">{user.fullName}
                  {/* Optionally show badge for premium/verified users */}
                  {user.premium?.isActive && (
                    <img
                      className="inline w-[13px] h-[13px] ml-1"
                      src={badge}
                      alt="premium"
                    />
                  )}
                </span>
              </div>
              <div className="text-gray-700 text-xs">@{user.username}</div>
            </div>
          </div>
          <button onClick={() => followUserMutation.mutate(user._id)} className="bg-blue-600 text-white rounded-full px-4 py-2 text-xs font-semibold hover:bg-blue-700 transition duration-200">
            Follow
          </button>
        
        </div>
      ))}

      {isHovering && (
        <MiniProfileCard
          ref={cardRef}
          top={position.top}
          left={position.left}
          onMouseLeave={handleMouseLeaveWithRef}
          onMouseEnter={handleCardMouseEnter}
          user={(Number.isFinite(position?.index) && suggestions?.[position.index]) ? suggestions[position.index] : null}

        />
      )}
      {/* <a href="/#" className="block text-blue-600 text-sm mt-4 hover:underline">
        Show more
      </a> */}
    </div>
  );
};
