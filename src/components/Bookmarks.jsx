import React, { useState } from 'react';
import { IoIosSearch } from "react-icons/io";
import { useGetUserBookmarksQuery } from '../hooks/usePostCalls';
import { FeedPostShimmer } from './LoadingShimmer';
import { Tweet } from '../minicomponents/Tweet';

const Bookmarks = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: bookmarksData, isLoading: isLoadingBookmarks, isError: isErrorBookmarks, error: bookmarksError } = useGetUserBookmarksQuery();
  const bookmarks = bookmarksData?.posts || [];

  // Filter bookmarks based on search query
  const filteredBookmarks = bookmarks.filter(tweet =>
    tweet.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tweet.ownerid?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tweet.ownerid?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full">
      <div className="sticky top-0  backdrop-blur-3xl bg-gradient-to-br from-zinc-200 to-blue-300 rounded-3xl p-4">
        <h1 className="text-xl font-bold mb-4">Bookmarks</h1>
        
        <div className="flex items-center py-2 px-4 text-sm bg-gray-100 rounded-full border border-transparent 
          focus-within:border-blue-500 focus-within:bg-inherit focus-within:text-blue-500">
          <IoIosSearch size="18px"/>
          <input 
            type="search" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your bookmarks" 
            className="mx-2 bg-inherit text-black w-full focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1">
        {isLoadingBookmarks && ([...Array(3)].map((_, index) => <FeedPostShimmer key={index} />))}
        {isErrorBookmarks && <div className="p-4 text-center text-red-500">Error loading bookmarks: {bookmarksError.message}</div>}
        {!isLoadingBookmarks && !isErrorBookmarks && filteredBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-xl font-bold mb-2">No bookmarks found.</h2>
            <p className="text-gray-500">Start bookmarking posts to see them here!</p>
          </div>
        ) : (
          !isLoadingBookmarks && filteredBookmarks.map(tweet => (
            <Tweet key={tweet._id} tweet={tweet} isBookmarked={true} />
          ))
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
