import React, { forwardRef } from "react";
import useravator from "../avator2.jpg";

export const MiniProfileCard = forwardRef(({ top, left, onMouseEnter, onMouseLeave }, ref) => {
  return (
    <div
      ref={ref}
      className="absolute bg-white shadow-md border border-gray-300 p-3 rounded-lg w-64 z-50"
      style={{ top: `${top}px`, left: `${left}px` }}
      onMouseEnter={onMouseEnter} // Ensure hover remains active if the mouse enters the modal
      onMouseLeave={onMouseLeave} // Hide the modal when leaving
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <img
            className="rounded-full w-10 object-cover"
            src={useravator}
            alt="profile"
          />
          <h1 className="font-bold text-sm">Silly Point</h1>
          <p className="text-gray-500 text-xs">@FarziCricketer</p>
        </div>
        <button className="border-gray-500 border-2 py-1 px-3 rounded-full text-sm hover:text-red-600">
          Following
        </button>
      </div>
      <p className="text-xs text-gray-700 mt-2">
        Wear helmet, pads, and gloves before reading my tweets. It may hurt you.{" "}
        <span className="font-bold">MOSTLY SATIRE!</span>
      </p>
      <div className="flex justify-between mt-3 text-xs">
        <div>
          <span className="font-bold">278</span> Following
        </div>
        <div>
          <span className="font-bold">207.8K</span> Followers
        </div>
      </div>
      <button className="border-gray-500 border-2 rounded-full mt-3 py-1 w-full text-center text-xs text-black-400 font-bold hover:bg-gray-300">
        Profile Summary
      </button>
    </div>
  );
});
