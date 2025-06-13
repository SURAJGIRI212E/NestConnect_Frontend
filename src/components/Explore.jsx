import React, { useState, useEffect } from 'react';
import { IoIosSearch } from "react-icons/io";
import { Tweet } from '../minicomponents/Tweet';

export const Explore = ({ myfeedRef }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        // TODO: Implement actual search logic here
        // This is just placeholder data
        const mockResults = [
          {
            type: 'user',
            username: 'johndoe',
            name: 'John Doe',
            bio: 'Software developer'
          },
          {
            type: 'post',
            content: 'This is a sample post matching the search',
            author: '@janedoe'
          }
        ];

        setSearchResults(mockResults);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="flex flex-col w-full">
      <div ref={myfeedRef} className="flex-1">
        <div className="sticky top-0   p-4">
          <div className="flex items-center py-2 px-4 text-sm bg-white shadow-2xl rounded-full border border-transparent 
            focus-within:border-black/50">
            <IoIosSearch size="18px"/>
            <input 
              type="search" 
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search people or posts" 
              className="mx-2 bg-inherit text-black w-full focus:outline-none"
            />
          </div>
        </div>

        <div className="px-4">
          {searchResults.map((result, index) => (
            result.type === 'user' ? (
              <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b">
                <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                <div>
                  <div className="font-bold">{result.name}</div>
                  <div className="text-gray-500 text-sm">@{result.username}</div>
                  <div className="text-sm">{result.bio}</div>
                </div>
              </div>
            ) : (
              <Tweet key={index} tweet={result} />
            )
          ))}
        </div>
      </div>
    </div>
  );
};
