import React, { useState, useEffect } from 'react'
import { IoIosSearch } from "react-icons/io";
import { WhoToFollow } from '../minicomponents/Whotofollow';
import  { WhoToFollowItemShimmer } from './LoadingShimmer';

export const RightSidebar = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Simulate a 1.5-second loading time

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className='w-full h-screen '>
      <div className="sticky top-0 p-2 md:p-4">
        <div className=" flex items-center py-2 px-2 bg-white shadow-2xl rounded-full border border-transparent 
            focus-within:border-black/50 ">
          <IoIosSearch size="18px"/>
          <input type="search" placeholder="search" className="mx-2 bg-inherit text-black w-full focus:outline-none" />
        </div>
      </div>
      
      <div className="px-2 md:px-4">
        {loading ? (
          <div>
            <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div> {/* Who to follow title */}
            {[...Array(3)].map((_, index) => (
             <WhoToFollowItemShimmer/>
            ))}
            <div className="h-4 bg-gray-300 rounded w-1/4 mt-4"></div> {/* Show more */}
          </div>
        ) : (
          <>
            <WhoToFollow/>
         
          </>
        )}
      </div>
    </div>
  )
}