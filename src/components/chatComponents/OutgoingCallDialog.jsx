import React from 'react';

export const OutgoingCallDialog = ({ callee, onCancelCall }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full transform transition-all duration-300 ease-out">
        <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Calling {callee?.fullName || callee?.username}...</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-8">Waiting for {callee?.fullName || callee?.username} to answer...</p>
        <button
          onClick={onCancelCall}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Cancel Call
        </button>
      </div>
    </div>
  );
};
