import { IoClose } from "react-icons/io5";
import { CiVideoOn,CiVideoOff } from "react-icons/ci";

import useravator from "../../avator2.jpg";
import { useSocket } from "../../context/SocketContext";
import React, { useState, useEffect } from 'react';
import { SpinnerShimmer } from "../LoadingShimmer";


export const ChatHeader = ({ profile, isLoading, error, onClose }) => {
  const { isUserOnline, callUser, callState, canCall } = useSocket();
  const [warningMessage, setWarningMessage] = useState(null);


  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => {
        setWarningMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  if (isLoading) return (
    <div className="flex justify-between items-center border-b pb-2 m-4">
   <SpinnerShimmer/>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-600">
        <IoClose size="24px" />
      </button>
    </div>
  );

  if (error) return (
    <div className="flex justify-between items-center border-b pb-2">
      <p className="text-red-500 ">{error}</p>
      <button onClick={onClose} className="text-blue-500  hover:text-red-700">
        <IoClose size="24px" />
      </button>
    </div>
  );

  const isOnline = profile?.user?._id ? isUserOnline(profile.user._id) : false;

  return (
    <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg border border-white border-opacity-30 p-2">
      <div className="flex justify-between items-center border-b pb-2">
        <div className="flex items-center">
        
          {profile && profile.user && (
            <div className="flex items-center gap-3 mt-1">
              <img 
                src={profile.user.avatar || useravator} 
                alt="Receiver Avatar" 
                className="w-8 h-8 rounded-full"
              />
              <div>
                <h2 className="text-lg font-bold">
                  {profile.user.fullName || profile.user.username}
                </h2> 
                <div className="text-sm text-gray-600">
                  {profile.followersCount !== undefined && 
                    <span>{profile.followersCount} Followers</span>}
                  {profile.followingCount !== undefined && 
                    <span className="ml-2">{profile.followingCount} Following</span>}
                </div>
               
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 p-2">
           <button 
             className={`hover:text-gray-700 ${isOnline ? 'text-green-500' : 'text-gray-500'}`} 
             onClick={() => {
               if (profile?.user) {
                 callUser(profile.user);
               }
             }}
             disabled={!canCall || callState !== 'idle' || !isOnline}
             >
             {isOnline ? <CiVideoOn size="23px"/> : <CiVideoOff size="23px"/>}
           </button>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <IoClose size="24px" />
          </button>
        </div>
      </div>

      {warningMessage && (
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white text-sm px-3 py-1 rounded-md shadow-lg z-50">
          {warningMessage}
        </div>
      )}
    </div>
  );
};

