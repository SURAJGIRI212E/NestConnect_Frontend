import React, { useRef } from "react";
import badge from "../Badge.png";
import useravator from "../avator2.jpg";
import useHover from "../hooks/userHover";
import { MiniProfileCard } from "./MiniProfileCard";

export const WhoToFollow = () => {
  const { isHovering, position, handleMouseEnter, handleMouseLeave } = useHover();
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

  const suggestions = [
    { name: "Vijay Lokapally", handle: "@vijaylokapally", verified: false },
    { name: "Shashank Yagnik", handle: "@YagnikShashank", verified: false },
    { name: "Indian Tech & Infra", handle: "@IndianTechGuide", verified: true },
  ];

  return (
    <div className="cursor-pointer mt-4 border rounded-lg p-0 lg:p-2">
      <h2 className="text-lg font-bold mb-4">Who to follow</h2>
      {suggestions.map((user, index) => (
        <div
          key={index}
          className="flex items-center justify-between py-2 px-0 md:px-1 hover:bg-gray-100"
          ref={(el) => (profileRefs.current[index] = el)} // Attach refs dynamically
          onMouseEnter={(e) => handleMouseEnter(e, index)}
          onMouseLeave={handleMouseLeaveWithRef}
        >
          <div className="flex items-center">
            <img
              src={useravator}
              alt="dp"
              className="w-8 h-8 rounded-full mr-1"
            />
            <div>
              <div className="flex items-center">
                <span className="font-bold text-xs">{user.name}{user.verified && (
                  <img
                    className="inline w-[13px] h-[13px]"
                    src={badge}
                    alt="verified"
                  />
                )}</span>
                
              </div>
              <div className="text-gray-500 text-xs">{user.handle}</div>
            </div>
          </div>
          <button className="bg-black text-[10px] text-white rounded-full px-3 lg:px-4 py-2">
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
        />
      )}
      <a href="/#" className="block text-blue-400 text-sm mt-2">
        Show more
      </a>
    </div>
  );
};
