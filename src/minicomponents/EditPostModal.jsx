import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM for portals
import { usePostCalls } from '../hooks/usePostCalls';
import { IoCloseOutline } from 'react-icons/io5';

export const EditPostModal = ({ post, onClose }) => {
  const [editedContent, setEditedContent] = useState(post.content || '');
  const [error, setError] = useState('');
  const { updatePostMutation } = usePostCalls();

  useEffect(() => {
    setEditedContent(post.content || '');
    setError(''); // Clear error on re-open or post change
  }, [post]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      await updatePostMutation.mutateAsync({ postId: post._id, content: editedContent });
      onClose(); // Close modal on success
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update post. Please try again.';
      setError(errorMessage);
    }
  };

  // Calculate remaining time for editing
  const now = new Date();
  const editValidTill = new Date(post.edits.editvalidtill);
  const timeLeftMs = editValidTill.getTime() - now.getTime();

  const minutesLeft = Math.floor(timeLeftMs / (1000 * 60));
  const secondsLeft = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

  const isEditable = post.edits.editchancesleft > 0 && timeLeftMs > 0;

  // Render modal using a Portal
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()} // Stop event propagation to prevent parent Tweet's onClick
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
        >
          <IoCloseOutline />
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Post</h2>

        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 resize-y min-h-[100px]"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Edit your post content..."
            rows="5"
            disabled={!isEditable || updatePostMutation.isLoading}
          />

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <div className="mt-4 text-sm text-gray-600">
            <p>Edit chances left: {post.edits.editchancesleft}</p>
            {isEditable ? (
              <p>Time left to edit: {minutesLeft}m {secondsLeft}s</p>
            ) : (
              <p className="text-red-500">Editing window closed or no chances left.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={updatePostMutation.isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-md text-white ${
                isEditable && !updatePostMutation.isLoading
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-400 cursor-not-allowed'
              } transition-colors`}
              disabled={!isEditable || updatePostMutation.isLoading}
            >
              {updatePostMutation.isLoading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root') // Target the new modal root element
  );
}; 