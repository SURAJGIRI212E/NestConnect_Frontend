import React, { useState, useEffect } from 'react'
import { CreatePost } from '../minicomponents/CreatePost'
import { Tweet } from '../minicomponents/Tweet'
import  { FeedPostShimmer } from './LoadingShimmer';

export const Feed = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Simulate a 2-second loading time

    return () => clearTimeout(timer);
  }, []);

  return (
    
    <div className=''>
      
      <div className='flex-1 '>
      <div className="sticky top-0 z-10 flex justify-around items-center border-b border-[rgb(239, 243, 244)] bg-inherit backdrop-blur-3xl shadow-lg">
        <div className="w-[50%] py-3 hover:bg-white/50">
          <h1 className="text-xs cursor-pointer text-center">For you</h1>
        </div>
        <div className="w-[50%] py-3 hover:bg-white/50">
          <h1 className="text-xs cursor-pointer text-center">Following</h1>
        </div>
      </div>
      <CreatePost/>
      {loading ? (
        // Render shimmer effect for feed posts
        <>
          {[...Array(5)].map((_, index) => (
            <FeedPostShimmer/>
          ))}
        </>
      ) : (
        // Render actual tweets once loaded
        <>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
          <Tweet/>
        </>
      )}
    </div> 
    </div>
  )
}
