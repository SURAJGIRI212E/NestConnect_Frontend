import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import axiosInstance from "../utils/axios";
import { useQueryClient } from '@tanstack/react-query';

export const EditProfileModal = ({ onClose, currentProfileUser, onProfileUpdated }) => {
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(currentProfileUser?.fullName || "");
  const [bio, setBio] = useState(currentProfileUser?.bio || "");
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (currentProfileUser) {
      setFullName(currentProfileUser.fullName || "");
      setBio(currentProfileUser.bio || "");
    }
  }, [currentProfileUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    if (fullName !== currentProfileUser?.fullName) {
      formData.append("fullName", fullName);
    }
    if (bio !== currentProfileUser?.bio) {
      formData.append("bio", bio);
    }
    if (avatar) {
      formData.append("avatar", avatar);
    }
    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    // Only proceed if there's something to update
    if (!fullName && !bio && !avatar && !coverImage) {
      setError("Please provide at least one field to update.");
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.patch("/api/users/updateuser", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        setSuccess("Profile updated successfully!");

        // Determine the updated user object (handle both shapes)
        const updatedData = response.data.data;
        const updatedUser = updatedData?.user ? updatedData.user : updatedData;

        // Update react-query cache for this user's profile directly (efficient — no refetch)
        if (updatedUser && updatedUser.username) {
          // The app's userProfile query uses ['userProfile', username] as key
          queryClient.setQueryData(['userProfile', updatedUser.username], (old) => {
            // Keep structure compatible with getUserProfileQuery (which returns { user: ... } or similar)
            if (!old) return { user: updatedUser };
            // If old has { user: ... } pattern:
            if (old.user) {
              return { ...old, user: { ...old.user, ...updatedUser } };
            }
            // Fallback: store as { user: updatedUser }
            return { ...old, user: updatedUser };
          });
        }

        // Notify parent component via callback with the updated user
        onProfileUpdated(updatedUser);

        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(response.data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-zinc-200 to-blue-300  flex items-center justify-center z-[200]">
      <div className="bg-blue-300/20 bg-opacity-20 backdrop-filter backdrop-blur-lg shadow-lg rounded-2xl w-[500px] max-h-[90vh] flex flex-col p-6 border border-white border-opacity-30 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-700 hover:text-red-500 rounded-full p-2 transition duration-200"
        >
          <IoClose size="24px" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white/70 text-gray-800 focus:outline-none focus:ring-1 focus:ring-black focus:ring-opacity-60"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white/70 text-gray-800 focus:outline-none focus:ring-1 focus:ring-black focus:ring-opacity-60"
            ></textarea>
          </div>
          <div>
            <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
            <input
              type="file"
              id="avatar"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files[0])}
              className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
             {currentProfileUser?.avatar && (
              <img src={currentProfileUser.avatar} alt="Current Avatar" className="mt-2 w-20 h-20 rounded-full object-cover" />
            )}
          </div>
          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
            <input
              type="file"
              id="coverImage"
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files[0])}
              className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
             {currentProfileUser?.coverImage && (
              <img src={currentProfileUser.coverImage} alt="Current Cover" className="mt-2 w-full h-24 object-cover rounded-md" />
            )}
          </div>

          {success && <p className="text-green-700 text-sm">{success}</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-full font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};
