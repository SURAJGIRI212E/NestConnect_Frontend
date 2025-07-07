import React, { useState, useEffect } from 'react';
import { IoIosSearch } from "react-icons/io";
import { Tweet } from '../minicomponents/Tweet';
import { useSearchPostsQuery } from '../hooks/usePostCalls';

export const Explore = ({ myfeedRef }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const { data, isLoading, isError, error } = useSearchPostsQuery(debouncedSearchQuery);
  const searchResults = data?.posts || [];

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  if (isError) return <div className="p-4 text-center text-red-500">Error searching posts: {error.message}</div>;

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
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map((result) => (
              <Tweet key={result._id} tweet={result} />
            ))
          ) : (debouncedSearchQuery && !isLoading) ? (
            <div className="p-4 text-center text-gray-500">No results found for "{debouncedSearchQuery}".</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
