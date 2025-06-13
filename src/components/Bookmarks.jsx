import React, { useState } from 'react';
import { IoIosSearch } from "react-icons/io";
import { Tweet } from '../minicomponents/Tweet';
import useravator from "../avator2.jpg";

const Bookmarks = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedTweets, setBookmarkedTweets] = useState([
    {
      id: 1,
      author: 'John Doe',
      username: '@johndoe',
      content: 'This is a bookmarked tweet',
      timestamp: '2h',
      likes: 10,
      comments: 5,
      retweets: 3
    },
    {
      id: 2, 
      author: 'Jane Smith',
      username: '@janesmith',
      content: 'Another bookmarked tweet',
      timestamp: '5h',
      likes: 20,
      comments: 8,
      retweets: 12
    }
  ]);

  const filteredBookmarks = bookmarkedTweets.filter(tweet => {
    const searchLower = searchQuery.toLowerCase();
    if (!searchLower) return bookmarkedTweets;
    return (
      tweet.content.toLowerCase().includes(searchLower) ||
      tweet.author.toLowerCase().includes(searchLower) ||
      tweet.username.toLowerCase().includes(searchLower)
    );
  });

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
        {filteredBookmarks.length > 0 ? (
          filteredBookmarks.map(tweet => (
            <Tweet key={tweet.id} tweet={tweet} isBookmarked={true} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-xl font-bold mb-2">You haven't added any Tweets to your Bookmarks yet</h2>
            <p className="text-gray-500">When you do, they'll show up here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
