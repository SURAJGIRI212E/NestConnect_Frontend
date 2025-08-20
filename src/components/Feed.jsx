import React, {  useRef, useCallback } from 'react'
import { CreatePost } from '../minicomponents/CreatePost'
import { Tweet } from '../minicomponents/Tweet'
import  { FeedPostShimmer } from './LoadingShimmer';

import { useInfiniteQuery } from '@tanstack/react-query';
import axiosInstance from '../utils/axios';

export const Feed = () => {
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading, 
    isError, 
    error 
  } = useInfiniteQuery({
    queryKey: ['feedPosts'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axiosInstance.get(`/api/posts/feed?page=${pageParam}&limit=10`);
      return response.data.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = lastPage.pagination.currentPage + 1;
      return nextPage <= lastPage.pagination.totalPages ? nextPage : undefined;
    },
  });

  const posts = data?.pages.flatMap(page => page.posts) || [];

  const observer = useRef();
  const lastPostElementRef = useCallback(node => {
    if (isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) {
      observer.current.observe(node);
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  if (isError) return <div className="p-4 text-center text-blue-800">Error loading feed: {error.message}</div>;

  return (
    
    <div className=''>
      
      <div className='flex-1 '>
      <div className="sticky top-0 z-10 flex justify-around items-center border-b border-[rgb(239, 243, 244)] bg-inherit backdrop-blur-3xl shadow-lg">
        <div className="w-[50%] py-3 hover:bg-white/50">
          <h1 className="text-xs cursor-pointer text-center">For you</h1>
        </div>
       
      </div>
      <CreatePost/>
      {isLoading && posts.length === 0 ? (
        // Render shimmer effect for initial load
        <>
          {[...Array(5)].map((_, index) => (
            <FeedPostShimmer key={index} />
          ))}
        </>
      ) : posts.length > 0 ? (
        // Render actual tweets once loaded
        <>
          {posts.map((tweet, index) => {
            if (posts.length === index + 1) {
              return <div ref={lastPostElementRef} key={tweet._id}><Tweet tweet={tweet} /></div>;
            } else {
              return <Tweet key={tweet._id} tweet={tweet} />;
            }
          })}
          {isFetchingNextPage && <FeedPostShimmer />}
          {!hasNextPage && posts.length > 0 && <div className="p-4 text-center text-gray-500">You've reached the end of the feed.</div>}
        </>
      ) : (
        <div className="p-4 text-center text-gray-500">No posts available.</div>
      )}
    </div> 
    </div>
  )
}
