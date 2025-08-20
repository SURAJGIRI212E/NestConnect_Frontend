import React from 'react';
import { useGetBlockedUsersQuery, useUserActions } from '../hooks/useUserActions';
import { FeedPostShimmer } from './LoadingShimmer';
import { Link } from 'react-router-dom';
import { IoIosArrowBack } from 'react-icons/io';
import useravator from "../defaultavator.png"; // Default avatar

const BlockedUsers = React.memo(() => {
  
  const { data: blockedUsersData, isLoading, isError, error } = useGetBlockedUsersQuery();
  const { toggleBlockUserMutation } = useUserActions();

  // Log query status changes
  
  const blockedUsers = blockedUsersData || [];

  const handleUnblock = (userId, username) => {
    if (window.confirm(`Are you sure you want to unblock @${username}?`)) {
      toggleBlockUserMutation.mutate(userId);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="sticky top-0 z-[102] bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg border-b border-white border-opacity-30 p-4 flex items-center">
        <button onClick={() => window.history.back()} className="p-2 text-gray-800 hover:text-blue-600 transition duration-200 rounded-full">
          <IoIosArrowBack size="24px" />
        </button>
        <h1 className="text-xl font-bold ml-4">Blocked Users</h1>
      </div>

      <div className="flex-1">
        {isLoading && ([...Array(3)].map((_, index) => <FeedPostShimmer key={index} />))}
        {isError && <div className="p-4 text-center text-blue-800">Error loading blocked users: {error.message}</div>}
        {!isLoading && !isError && blockedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-xl font-bold mb-2">No blocked users found.</h2>
            <p className="text-gray-500">You haven't blocked anyone yet.</p>
          </div>
        ) : (
          !isLoading && blockedUsers.map(user => (
            <div key={user._id} className="flex items-center justify-between p-4 border-b border-white border-opacity-30 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg m-4">
              <Link to={`/home/profile/${user.username}`} className="flex items-center gap-3">
                <img className="w-12 h-12 rounded-full object-cover" src={user.avatar || useravator} alt="avatar" />
                <div>
                  <p className="font-bold text-gray-800">{user.fullName}</p>
                  <p className="text-sm text-gray-700">@{user.username}</p>
                </div>
              </Link>
              <button
                onClick={() => handleUnblock(user._id, user.username)}
                className="bg-red-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-red-500 transition duration-200"
                disabled={toggleBlockUserMutation.isLoading}
              >
                {toggleBlockUserMutation.isLoading ? 'Unblocking...' : 'Unblock'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export default BlockedUsers;