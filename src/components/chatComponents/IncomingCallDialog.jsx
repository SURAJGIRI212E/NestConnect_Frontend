import React from 'react';

export const IncomingCallDialog = ({ caller, onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full transform transition-all duration-300 ease-out">
        <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Incoming Call from {caller?.fullName || caller?.username}</h3>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={onAccept}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Accept
          </button>
          <button
            onClick={onReject}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}; 