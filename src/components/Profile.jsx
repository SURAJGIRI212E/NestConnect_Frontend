import React, { useState, useEffect } from "react";
import { Tweet } from "../minicomponents/Tweet";
import { IoIosArrowBack } from "react-icons/io";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axios";
import LoadingShimmer from './LoadingShimmer';

const Profile = ({ myfeedRef }) => {
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [messagePreference, setMessagePreference] = useState('everyone');
  const [updateStatus, setUpdateStatus] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser?.username) return;
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const response = await axiosInstance.get(`/api/users/getuser/${currentUser.username}`);
        if (response.data.status === 'success') {
          setProfileUser(response.data.data.user);
          setMessagePreference(response.data.data.user.messagePreference || 'everyone');
        } else {
          setProfileError(response.data.message || 'Failed to load user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setProfileError(error.response?.data?.message || 'Failed to load user profile');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handlePreferenceChange = async (e) => {
    const newPreference = e.target.value;
    setMessagePreference(newPreference);
    setUpdateStatus(null);

    try {
      const response = await axiosInstance.patch('/api/users/message-preference', {
        messagePreference: newPreference
      });

      if (response.data.status === 'success') {
        setUpdateStatus({ type: 'success', message: 'Message preference updated successfully!' });
      } else {
        setUpdateStatus({ type: 'error', message: response.data.message || 'Failed to update preference.' });
      }
    } catch (error) {
      console.error('Error updating message preference:', error);
      setUpdateStatus({ type: 'error', message: error.response?.data?.message || 'Failed to update preference.' });
    }
    setTimeout(() => setUpdateStatus(null), 3000);
  };

  if (loadingProfile) {
    return <LoadingShimmer type="profile-page" />;
  }

  if (profileError) {
    return <div className="p-4 text-center text-red-500">Error: {profileError}</div>;
  }

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-zinc-200 to-blue-300 min-h-screen">
      <div ref={myfeedRef} className="flex-1 ">
        
        <div className="sticky top-0 z-[102] bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg border-b border-white border-opacity-30">
          <button onClick={() => window.history.back()} className="p-4 text-gray-800 hover:text-blue-600 transition duration-200"><IoIosArrowBack size="20px" /></button>
          <span className="text-xl font-bold text-gray-800">{profileUser?.username} </span><span className="text-gray-600 text-xs">18k posts</span>
        </div>
        {/* Cover and Profile Picture */}
        <div className="relative">
          <div className="h-48 bg-gray-300 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer-flash"></div>
          </div>

          {/* Profile Picture Container */}
          <div className="px-4">
            <div className="flex items-end justify-between">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-400 mt-[-55px] shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer-flash"></div>
              </div>
            </div>
          </div>
        </div>

      
        <div className=" flex justify-end px-4 ">
          {currentUser?._id === profileUser?._id ? (
            <button className="bg-blue-500 text-white text-xs px-4 py-2 rounded-full font-semibold hover:bg-blue-600 transition duration-200 shadow-md">
              Edit profile
            </button>
          ) : (
            <>
              <button className="text-xs px-4 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition duration-200 shadow-md">
                Follow
              </button>
              <button className="ml-2 text-xs px-4 py-2 border border-white border-opacity-90 rounded-full font-semibold text-gray-800 hover:bg-white hover:bg-opacity-30 transition duration-200">
                •••
              </button>
            </>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex justify-center py-2 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg  m-2">
         <div>
         <div className="flex justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-gray-800">{profileUser?.fullName || profileUser?.username}</h1>
              <p className="text-gray-600 text-sm">@{profileUser?.username}</p>
            </div>
          </div>

          <p className="mt-1 text-sm text-gray-700">
            {profileUser?.bio || 'No bio available.'}
          </p>

          <div className="text-sm flex gap-4 text-gray-600">
            
            <span>Joined January 2024</span>
          </div>

          <div className="flex gap-4 mt-1 text-sm text-gray-700">
            <span>
              <strong>123</strong>{" "}
              <span>Following</span>
            </span>
            <span>
              <strong>456</strong>{" "}
              <span>Followers</span>
            </span>
          </div>
         </div>

          {/* Message Preference Section */}
          {currentUser?._id === profileUser?._id && (
            <div className=" p-2 ">
             
              <label htmlFor="messagePreference" className="block text-xs font-medium text-gray-700 mb-1">Who can message me?</label>
              <select
                id="messagePreference"
                name="messagePreference"
                value={messagePreference}
                onChange={handlePreferenceChange}
                className="mt-0.5 block  px-3 py-1.5 text-sm  rounded-md bg-white/70  text-gray-800 focus:outline-none focus:ring-1 focus:ring-black focus:ring-opacity-60"
              >
                <option value="everyone">Everyone</option>
                <option value="followers">My Followers</option>
                <option value="following">Users I Follow</option>
                <option value="mutualFollowers">Mutual Followers</option>
                <option value="no one">No one</option>
              </select>
              {updateStatus && (
                <p className={`mt-2 text-xs ${updateStatus.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                  {updateStatus.message}
                </p>
              )}
            </div>
          )}

        </div>

        {/* Tabs */}
        <div className="flex border-b border-white border-opacity-30 mt-4 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg m-4">
          <button className="flex-1 py-3 font-semibold border-b-2 border-blue-500 text-blue-700 hover:text-blue-800 transition duration-200">
            Posts
          </button>
          <button className="flex-1 py-3 text-gray-600 hover:bg-white hover:bg-opacity-30 transition duration-200">
            Replies
          </button>
          <button className="flex-1 py-3 text-gray-600 hover:bg-white hover:bg-opacity-30 transition duration-200">
            Likes
          </button>
          <button className="flex-1 py-3 text-gray-600 hover:bg-white hover:bg-opacity-30 transition duration-200">
            Bookmarks
          </button>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          <Tweet />
          <Tweet />
          <Tweet />
          <Tweet />
          <Tweet />
          <Tweet />
        </div>
      </div>
    </div>
  );
};

export default Profile;
