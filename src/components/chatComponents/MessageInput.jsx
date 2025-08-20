import React from 'react';
import { IoClose } from "react-icons/io5";
import { IoIosSend, IoIosImages } from "react-icons/io";

export const MessageInput = ({
  newMessage,
  onMessageChange,
  onSend,
  onTyping,
  isUploading,
  onImageSelect,
  selectedImages,
  removeImage,
  fileInputRef,
  disabled
}) => {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSend();
    }} 
    className="flex flex-col  mb-2">
      {/* Image Preview */}
      {selectedImages.length > 0 && (
        <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar  backdrop-filter backdrop-blur-lg rounded-lg shadow-inner border border-white border-opacity-80 mb-2">
          {selectedImages.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(image)}
                alt={`Selected ${index + 1}`}
                className="w-16 h-16 object-cover rounded"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
              >
                <IoClose size="12px" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImageSelect}
          accept="image/*"
          multiple
          className="hidden"
          id="imageInput"
        />
        <label
          htmlFor="imageInput"
          className="cursor-pointer md:p-2 hover:bg-gray-100 rounded-full"
          title="Add images"
        >
          <IoIosImages size="24px" className="text-blue-600" />
        </label>

        {/* <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            onMessageChange(e);
            onTyping();
          }}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-full mx-1 focus:outline-none focus:border-blue-500 bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg"
          disabled={disabled || isUploading}
        /> */}
        <textarea
                className="flex-1 p-2 border rounded-3xl focus:outline-none focus:border-blue-600 bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg shadow-inner resize-none h-10 max-h-[100px] text-gray-800 text-sm focus:border-b  placeholder-gray-600 overflow-y-auto no-scrollbar"
                 placeholder="Type a message..."
                disabled={disabled || isUploading}
                value={newMessage}
                onChange={(e) => {
                  onMessageChange(e);
            onTyping();
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
        <button
          type="submit"
          className={`p-1 rounded-full ${
            (!newMessage.trim() && selectedImages.length === 0) || isUploading
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:bg-gray-100'
          }`}
          disabled={(!newMessage.trim() && selectedImages.length === 0) || isUploading}
          title="Send message"
        >
          <IoIosSend size="24px" />
        </button>
      </div>
    </form>
  );
};
