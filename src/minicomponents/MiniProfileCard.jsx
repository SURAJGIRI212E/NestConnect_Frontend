import React, { forwardRef } from "react";
import useravator from "../avator2.jpg";

export const MiniProfileCard = forwardRef(({ top, left, onMouseEnter, onMouseLeave }, ref) => {

  return (
    <div
      ref={ref}
      className="absolute bg-blue-200   backdrop-filter backdrop-blur-2xl shadow-lg border border-white border-opacity-30 p-4 rounded-xl w-72 z-50"
      style={{ top: `${top-50}px`, left: `${left}px` }}
      onMouseEnter={onMouseEnter} // Ensure hover remains active if the mouse enters the modal
      onMouseLeave={onMouseLeave} // Hide the modal when leaving
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <img
            className="rounded-full w-12 h-12 object-cover border-2 border-white shadow-md"
            src={useravator}
            alt="profile"
          />
          <h1 className="font-bold text-lg text-gray-800 mt-2">Silly Point</h1>
          <p className="text-gray-600 text-sm">@FarziCricketer</p>
        </div>
        <button className="border-white border-opacity-50 border py-1 px-4 rounded-full text-sm text-white   bg-blue-500  hover:bg-blue-600 transition duration-200 shadow-md">
          Following
        </button>
      </div>
      <p className="text-sm text-gray-700 mt-3">
        Wear helmet, pads, and gloves before reading my tweets. It may hurt you.{" "}
        <span className="font-bold">MOSTLY SATIRE!</span>
      </p>
      <div className="flex justify-between mt-4 text-sm text-gray-800">
        <div>
          <span className="font-bold">278</span> Following
        </div>
        <div>
          <span className="font-bold">207.8K</span> Followers
        </div>
      </div>
      <button className="border-white border-opacity-50 border rounded-full mt-4 py-2 w-full text-center text-sm text-gray-800 font-bold bg-blue-300  hover:bg-opacity-40 transition duration-200 shadow-md">
        Profile Summary
      </button>
    </div>
  );
});
