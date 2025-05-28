import React from 'react';
import { IoTrash } from "react-icons/io5";

export const MessageList = ({ 
  messages, 
  currentUserId, 
  onDeleteMessage, 
  hoveredMessage,
  setHoveredMessage,
  formatMessageTime,
  messagesEndRef
}) => {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden mt-4 scrollbar">
      <div className="flex flex-col">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex flex-col mb-2 ${
              message.senderId._id === currentUserId ? 'items-end' : 'items-start'
            }`}
            onMouseEnter={() => setHoveredMessage(message._id)}
            onMouseLeave={() => setHoveredMessage(null)}
          >
            <div className={`rounded-lg max-w-64 p-2 relative group ${
              message.senderId._id === currentUserId 
                ? 'bg-gray-200 text-black' 
                : 'bg-blue-500 text-white mr-10'
            }`}>
              {message.senderId._id === currentUserId && hoveredMessage === message._id && (
                <button
                  onClick={() => onDeleteMessage(message._id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  title="Delete message"
                >
                  <IoTrash size="12px" />
                </button>
              )}
              {message.content && (
                <div className="text-xs break-words">{message.content}</div>
              )}
              {message.media?.length > 0 && (
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {message.media.map((media, i) => (
                    <img
                      key={i}
                      src={media.url}
                      alt="message media"
                      className="w-full h-24 object-cover rounded"
                    />
                  ))}
                </div>
              )}
              <div className="text-xxs opacity-70 mt-1">
                {formatMessageTime(message.createdAt)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
