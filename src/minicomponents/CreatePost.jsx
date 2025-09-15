import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import avator from '../defaultavator.png';
import { GoFileMedia } from "react-icons/go";
import { IoClose } from "react-icons/io5";
import { IoGlobeOutline, IoPeopleOutline } from "react-icons/io5";
import { usePostCalls } from '../hooks/usePostCalls';
import { useSelector } from 'react-redux';

export const CreatePost = ({ parentPost }) => {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [message, setMessage] = useState(null);
  const [visibility, setVisibility] = useState('public');
  const [showVisibilityOptions, setShowVisibilityOptions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const { createPostMutation } = usePostCalls();
  const currentUser = useSelector(state => state.auth.user);
  const visibilityRef = useRef(null);
  const buttonRef = useRef(null);

  // Handle click outside to close visibility dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (visibilityRef.current && !visibilityRef.current.contains(event.target)) {
        setShowVisibilityOptions(false);
      }
    };

    if (showVisibilityOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVisibilityOptions]);

  // Calculate dropdown position when visibility options are shown
  useEffect(() => {
    if (showVisibilityOptions && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + window.scrollY + 8,
        left: buttonRect.left + window.scrollX
      });
    }
  }, [showVisibilityOptions]);

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
    formData.append('visibility', visibility);
    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });
    if (parentPost) {
      formData.append('parentPost', parentPost);
    }

    try {
      const response = await createPostMutation.mutateAsync(formData);
      setContent('');
      setMediaFiles([]);
      setVisibility('public'); // Reset visibility to default
      setMessage({ type: 'success', text: response.message || (parentPost ? 'Comment added successfully!' : 'Post created successfully!') });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to create post:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || (parentPost ? 'Failed to add comment.' : 'Failed to create post.') });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getVisibilityIcon = () => {
    return visibility === 'public' ? <IoGlobeOutline size="12px" /> : <IoPeopleOutline size="12px" />;
  };

  const getVisibilityText = () => {
    return visibility === 'public' ? 'Everyone' : 'Followers';
  };

  const getVisibilityButtonClass = () => {
    return visibility === 'public' 
      ? "flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition duration-200 cursor-pointer px-2 py-1 rounded-full border border-blue-600 hover:bg-blue-80"
      : "flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 transition duration-200 cursor-pointer px-2 py-1 rounded-full border border-orange-200 hover:bg-orange-50";
  };

  return (
    <div className="relative border-b border-white border-opacity-30 p-2 bg-blue-200 bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg m-4">
 
      {/* Content */}
      <div>
        <div className="flex p-2">
          <div className="w-6 h-6 overflow-hidden rounded-full flex-shrink-0 mt-1">
            <img
              className="w-full h-full object-cover"
              src={currentUser?.avatar || avator}
              alt="profile"
            />
          </div>
          <div className="w-full">
            <div>
              <textarea
                className="w-[100%] p-2 resize-none min-h-[40px] max-h-[200px] text-gray-800 text-sm no-scrollbar focus:outline-none focus:border-b bg-transparent placeholder-gray-600 overflow-hidden"
                placeholder="What is happening?!"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  // Auto-resize textarea
                  const textarea = e.target;
                  textarea.style.height = 'auto';
                  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
                }}
                onInput={(e) => {
                  // Auto-resize on input as well
                  const textarea = e.target;
                  textarea.style.height = 'auto';
                  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
                }}
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
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 text-xs flex items-center justify-center"
                    >
                      <IoClose size="12px" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-4">
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
                
                {/* Visibility Selector */}
                {!parentPost && (
                  <div className="relative" ref={visibilityRef}>
                    <button
                      type="button"
                      onClick={() => setShowVisibilityOptions(!showVisibilityOptions)}
                      className={getVisibilityButtonClass()}
                      ref={buttonRef}
                    >
                      {getVisibilityIcon()}
                      <span className="">{getVisibilityText()}</span>
                    </button>
                    
                    {/* Portal for dropdown to render outside normal DOM hierarchy */}
                    {showVisibilityOptions && createPortal(
                      <div 
                        className="fixed bg-white/95 backdrop-blur-sm rounded-lg shadow-xl  z-[99999]"
                        style={{
                          top: `${dropdownPosition.top}px`,
                          left: `${dropdownPosition.left-50}px`
                        }}
                        ref={visibilityRef}
                      >
                        <div className="p-2">
                          <div
                            className={`flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-100 transition-colors ${
                              visibility === 'public' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                            }`}
                            onClick={() => {
                              setVisibility('public');
                              setShowVisibilityOptions(false);
                            }}
                          >
                            <IoGlobeOutline size="16px" />
                            <div>
                              <div className="font-medium">Everyone</div>
                              <div className="text-xs text-gray-500">Anyone can see this post</div>
                            </div>
                          </div>
                          <div
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors ${
                              visibility === 'followers' ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                            }`}
                            onClick={() => {
                              setVisibility('followers');
                              setShowVisibilityOptions(false);
                            }}
                          >
                            <IoPeopleOutline size="16px" />
                            <div>
                              <div className="font-medium">Followers</div>
                              <div className="text-xs text-gray-500">Only your followers can see this post</div>
                            </div>
                          </div>
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                )}
              </div>

              <button 
                className="w-[60px] h-[30px] border-none text-xs text-white bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition duration-200 font-semibold flex items-center justify-center"
                onClick={handleSubmit}
                disabled={createPostMutation.isPending}
              >
                {createPostMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white "></div>
                   
                  </>
                ) : (
                  'Post'
                )}
              </button>
            </div>
            {/* {message && (
              <p className={`mt-2 text-center text-sm ${message.type === 'success' ? 'text-blue-800' : 'text-red-600'}`}>
                {message.text}
              </p>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
};
