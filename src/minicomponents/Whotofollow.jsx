import React, { useRef } from "react";
import badge from "../Badge.png";
import useravator from "../avator2.jpg";
import useHover from "../hooks/userHover";
import { MiniProfileCard } from "./MiniProfileCard";

export const WhoToFollow = () => {
  const { isHovering, position, handleMouseEnter, handleMouseLeave, clearHideTimeout } = useHover();
  const cardRef = useRef(null); // Ref for the modal
  const profileRefs = useRef([]); // Refs for each profile suggestion

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

  const suggestions = [
    { name: "Vijay Lokapally", handle: "@vijaylokapally", verified: false },
    { name: "Shashank Yagnik", handle: "@YagnikShashank", verified: false },
    { name: "Indian Tech & Infra", handle: "@IndianTechGuide", verified: true },
  ];

  return (
    <div className="min-w-72 cursor-pointer p-2 mt-4 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg border border-white border-opacity-30">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Who to follow</h2>
      {suggestions.map((user, index) => (
        <div
          key={index}
          className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-white hover:bg-opacity-30 transition duration-200"
          ref={(el) => (profileRefs.current[index] = el)} // Attach refs dynamically
          onMouseEnter={(e) => handleProfileMouseEnter(e, index)}
          onMouseLeave={handleMouseLeaveWithRef}
        >
          <div className="flex items-center">
            <img
              src={useravator}
              alt="dp"
              className="w-10 h-10 rounded-full mr-3 border-2 border-white shadow-sm"
            />
            <div>
              <div className="flex items-center">
                <span className="font-bold text-sm text-gray-800">{user.name}{user.verified && (
                  <img
                    className="inline w-[13px] h-[13px] ml-1"
                    src={badge}
                    alt="verified"
                  />
                )}</span>
                
              </div>
              <div className="text-gray-600 text-xs">{user.handle}</div>
            </div>
          </div>
          <button className="bg-blue-500  text-white rounded-full px-4 py-2 text-xs font-semibold hover:bg-blue-600 transition duration-200">
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
        />
      )}
      <a href="/#" className="block text-blue-500 text-sm mt-4 hover:underline">
        Show more
      </a>
    </div>
  );
};
