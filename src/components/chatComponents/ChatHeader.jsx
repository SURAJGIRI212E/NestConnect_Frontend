import { IoClose, IoVideocam } from "react-icons/io5";
import { useEffect, useState } from "react";
import useravator from "../../avator2.jpg";
import { useSocket } from "../../context/SocketContext";
import VideoCallManager from "./VideoCallManager";

export const ChatHeader = ({ profile, isLoading, error, onClose }) => {
  const { isUserOnline, socket } = useSocket();
  const [isInCall, setIsInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  // Handle incoming call
  useEffect(() => {
    if (!socket) return;

    socket.on('incoming-call', ({ callerId }) => {
      setIncomingCall(callerId);
    });

    return () => {
      socket.off('incoming-call');
    };
  }, [socket]);

  const handleStartCall = () => {
    setIsInCall(true);
  };

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    
    socket.emit('call-accepted', { callerId: incomingCall });
    setIsInCall(true);
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;
    
    socket.emit('call-rejected', { callerId: incomingCall });
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    setIsInCall(false);
  };

  if (isLoading) return (
    <div className="flex justify-between items-center border-b pb-2">
      <p>Loading profile...</p>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <IoClose size="24px" />
      </button>
    </div>
  );

  if (error) return (
    <div className="flex justify-between items-center border-b pb-2">
      <p className="text-red-500 bg-zinc-700">{error}</p>
      <button onClick={onClose} className="text-blue-500  hover:text-red-700">
        <IoClose size="24px" />
      </button>
    </div>
  );

  const isOnline = profile?.user?._id ? isUserOnline(profile.user._id) : false;

  return (
    <>
      {isInCall && profile?.user && (
        <VideoCallManager
          receiverId={profile.user._id}
          peerName={profile.user.fullName || profile.user.username}
          onClose={handleEndCall}
        />
      )}
      
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

        <div className="flex items-center gap-2">
          {isOnline && profile?.user && !isInCall && (
            <button
              onClick={handleStartCall}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Start video call"
            >
              <IoVideocam className="w-6 h-6 text-blue-500" />
            </button>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <IoClose size="24px" />
          </button>
        </div>
      </div>

      {/* Incoming call dialog */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Incoming Video Call</h3>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleRejectCall}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Reject
              </button>
              <button
                onClick={handleAcceptCall}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

