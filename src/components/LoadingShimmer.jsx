import React from 'react';

export const FeedPostShimmer = () => (
  <div className="p-4 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg border border-white border-opacity-30 animate-pulse mb-4 relative overflow-hidden">
    <div className="flex items-center mb-4">
      <div className="h-10 w-10 bg-gray-300 rounded-full mr-3"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
      </div>
    </div>
    <div className="h-4 bg-gray-300 rounded mb-2 w-full"></div>
    <div className="h-4 bg-gray-300 rounded mb-2 w-11/12"></div>
    <div className="h-4 bg-gray-300 rounded w-10/12"></div>
    <div className="flex justify-around mt-4">
      <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
      <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
      <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
      <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
    </div>
    <div className="absolute inset-0 animate-shimmer-flash"></div>
  </div>
);

export const WhoToFollowItemShimmer = () => (
  <div className="p-4 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg border border-white border-opacity-30 animate-pulse mb-4 flex items-center justify-between relative overflow-hidden">
    <div className="flex items-center">
      <div className="h-10 w-10 bg-gray-300 rounded-full mr-3"></div>
      <div>
        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-16"></div>
      </div>
    </div>
    <div className="h-8 w-20 bg-gray-300 rounded-full"></div>
    <div className="absolute inset-0 animate-shimmer-flash"></div>
  </div>
);
export const SpinnerShimmer=()=>(
  <div className="animate-spin h-8 w-8 border-t-4 border-b-4 rounded-full border-blue-600"></div>
)

//main loading shimmer
const LoadingShimmer = ({ className, type }) => {
 
  const renderShimmerContent = () => {
    switch (type) {
      case 'login-page':
        return (
          <div className="px-8 py-32 w-96 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-3xl shadow-lg border border-white border-opacity-30 animate-pulse relative overflow-hidden">
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="h-8 bg-gray-300 rounded  mb-4"></div>
            <div className="h-10 bg-gray-300 rounded-full w-full mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="absolute inset-0 animate-shimmer-flash"></div>
          </div>
        );
     case 'profile-page':
        return (
          <div className="flex flex-col w-full relative overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg border-b border-white border-opacity-30 relative overflow-hidden">
              <div className="h-6 w-6 bg-gray-300 rounded-full mr-4"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-300 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-1/4"></div>
              </div>
              <div className="absolute inset-0 animate-shimmer-flash"></div>
            </div>

            {/* Cover and Profile Picture */}
            <div className="relative h-48 bg-gray-300  overflow-hidden">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-400 absolute bottom-0 left-4 translate-y-1/2"></div>
              <div className="absolute inset-0 animate-shimmer-flash"></div>
            </div>

            {/* Edit/Follow Button & Profile Info */}
            <div className="px-4 py-8 space-y-4 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg border-b border-white border-opacity-30 relative overflow-hidden">
              <div className="flex justify-end">
                <div className="h-8 w-24 bg-gray-300 rounded-full"></div>
              </div>
              <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="flex gap-4">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              </div>
              <div className="absolute inset-0 animate-shimmer-flash"></div>
            </div>

          

            {/* Tabs Shimmer */}
            <div className="flex border-b border-white border-opacity-30 mt-4 relative overflow-hidden">
              <div className="flex-1 py-4 bg-gray-300 m-2 rounded-lg"></div>
              <div className="flex-1 py-4 bg-gray-300 m-2 rounded-lg"></div>
              <div className="flex-1 py-4 bg-gray-300 m-2 rounded-lg"></div>
              <div className="flex-1 py-4 bg-gray-300 m-2 rounded-lg"></div>
              <div className="absolute inset-0 animate-shimmer-flash"></div>
            </div>

            {/* Posts Feed Shimmer */}
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, index) => (
                <FeedPostShimmer key={`profile-feed-shimmer-${index}`} />
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="h-20 w-20 animate-spin rounded-full border-t-4 border-b-4   border-blue-600 relative overflow-hidden">
            <div className="animate-spin absolute inset-0  animate-shimmer-flash  "></div>
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen  ${className}`}>
      {renderShimmerContent()}
    </div>
  );
};

export default LoadingShimmer; 