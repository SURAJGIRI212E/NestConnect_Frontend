import React, { useState, useEffect, useCallback } from "react";
import { IoClose } from "react-icons/io5";
import axiosInstance from "../utils/axios";
import { useQueryClient } from '@tanstack/react-query';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/getCroppedImg';

export const EditProfileModal = ({ onClose, currentProfileUser, onProfileUpdated }) => {
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(currentProfileUser?.fullName || "");
  const [bio, setBio] = useState(currentProfileUser?.bio || "");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(currentProfileUser?.avatar || null);
  const [coverImage, setCoverImage] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (currentProfileUser) {
      setFullName(currentProfileUser.fullName || "");
      setBio(currentProfileUser.bio || "");
      setAvatarPreview(currentProfileUser.avatar || null);
    }
  }, [currentProfileUser]);

  // When user selects a new avatar file, open crop UI (react-easy-crop)
  const handleAvatarSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropSrc(e.target.result);
      setCropOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const doCrop = useCallback(async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    try {
      const { blob, url } = await getCroppedImg(cropSrc, croppedAreaPixels, rotation, 400);
      const file = new File([blob], 'avatar.png', { type: blob.type });
      setAvatar(file);
      setAvatarPreview(url);
      setCropOpen(false);
    } catch (err) {
      console.error('Crop failed', err);
    }
  }, [cropSrc, croppedAreaPixels, rotation]);

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
              onChange={(e) => handleAvatarSelect(e.target.files[0])}
              className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
             {(avatarPreview || currentProfileUser?.avatar) && (
              <img src={avatarPreview || currentProfileUser.avatar} alt="Current Avatar" className="mt-2 w-20 h-20 rounded-full object-cover" />
            )}
            {/* Crop UI */}
            {cropOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg p-4 w-[420px]">
                  <div className="mb-2 text-sm font-medium text-gray-700">Adjust and crop</div>
                  <div className="relative w-full h-80 bg-gray-100">
                    {cropSrc && (
                      <Cropper
                        image={cropSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                        onCropComplete={onCropComplete}
                      />
                    )}
                  </div>
                  <div className="mt-3">
                    <label className="text-xs">Zoom</label>
                    <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full" />
                  </div>
                  <div className="mt-2">
                    <label className="text-xs">Rotate</label>
                    <input type="range" min="0" max="360" step="1" value={rotation} onChange={(e) => setRotation(parseFloat(e.target.value))} className="w-full" />
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button type="button" className="px-3 py-1 rounded bg-gray-200" onClick={() => { setCropOpen(false); setCropSrc(null); }}>Cancel</button>
                    <button type="button" className="px-3 py-1 rounded bg-blue-600 text-white" onClick={doCrop}>Use Photo</button>
                  </div>
                </div>
              </div>
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
