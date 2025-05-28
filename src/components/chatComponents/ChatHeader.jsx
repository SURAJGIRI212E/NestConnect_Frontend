import { IoClose } from "react-icons/io5";
import useravator from "../../avator2.jpg";
import { useSocket } from "../../context/SocketContext";

export const ChatHeader = ({ profile, isLoading, error, isTyping, onClose, conversationId }) => {
  const { isUserOnline } = useSocket();

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
      <p className="text-red-500">{error}</p>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <IoClose size="24px" />
      </button>
    </div>
  );

  const isOnline = profile?.user?._id ? isUserOnline(profile.user._id) : false;

  return (
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
              {isTyping[conversationId] && (
                <div className="text-gray-500 text-xs italic mt-0.5">Typing...</div>
              )}
            </div>
            <span className="ml-2 flex items-center">
              <span className={`block w-2 h-2 rounded-full ${
                isOnline 
                  ? 'bg-green-500 shadow-lg shadow-green-500' 
                  : 'bg-red-500 shadow-lg shadow-red-500'
              }`} />
             
            </span>
          </div>
        )}
      </div>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <IoClose size="24px" />
      </button>
    </div>
  );
};

