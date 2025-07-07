import React, { useState } from 'react';
import avator from '../avator2.jpg';
import { GoFileMedia } from "react-icons/go";
import { IoClose } from "react-icons/io5";
import { usePostCalls } from '../hooks/usePostCalls';
import { useSelector } from 'react-redux';

export const CreatePost = ({ parentPost }) => {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [message, setMessage] = useState(null);
  const { createPostMutation } = usePostCalls();
  const currentUser = useSelector(state => state.auth.user);
  

  const handleFileChange = (e) => {
    setMediaFiles(Array.from(e.target.files));
    setMessage(null);
  };

  const removeImage = (indexToRemove) => {
    setMediaFiles(mediaFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      setMessage({ type: 'error', text: 'Post must have either content or media.' });
      return;
    }

    const formData = new FormData();
    formData.append('content', content);
    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });
    if (parentPost) {
      formData.append('parentPost', parentPost);
    }
console.log("creating post")
    try {
      const response = await createPostMutation.mutateAsync(formData);
      setContent('');
      setMediaFiles([]);
      setMessage({ type: 'success', text: response.message || (parentPost ? 'Comment added successfully!' : 'Post created successfully!') });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to create post:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || (parentPost ? 'Failed to add comment.' : 'Failed to create post.') });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="border-b border-white border-opacity-30 p-2 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg m-4">
 
      {/* Content */}
      <div>
        <div className="flex p-2">
          <div className="w-[32px] overflow-clip items-start mt-1">
            <img
              className="rounded-full w-10 object-cover"
              src={currentUser?.avatar || avator}
              alt="profile"
            />
          </div>
          <div className="w-full">
            <div>
              <textarea
                className="w-[100%] p-2 resize-none h-10 text-gray-800 text-sm no-scrollbar focus:outline-none focus:border-b focus:h-[50px] bg-transparent placeholder-gray-600"
                placeholder="What is happening?!"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            {mediaFiles.length > 0 && (
              <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar bg-white bg-opacity-10 rounded-lg shadow-inner border border-white border-opacity-20 mb-2 mt-2">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Selected ${index + 1}`}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs flex items-center justify-center"
                    >
                      <IoClose size="12px" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <div>
                <label htmlFor="media-input" className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 transition duration-200">
                  <GoFileMedia />
                  {mediaFiles.length > 0 && <span className="ml-1 text-gray-500 text-xs">({mediaFiles.length} files selected)</span>}
                </label>
                <input
                  id="media-input"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <button 
                className="w-[60px] h-[30px] border-none text-xs text-white bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition duration-200 font-semibold"
                onClick={handleSubmit}
                disabled={createPostMutation.isLoading}
              >
                {createPostMutation.isLoading ? 'Posting...' : 'Post'}
              </button>
            </div>
            {message && (
              <p className={`mt-2 text-center text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
