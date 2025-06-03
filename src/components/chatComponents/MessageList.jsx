import React from 'react';
import { IoTrash } from "react-icons/io5";

// Helper function to format date
const formatMessageDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  if (date >= today) {
    return 'Today';
  } else if (date >= yesterday) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
};

export const MessageList = ({ 
  messages, 
  currentUserId, 
  onDeleteMessage, 
  hoveredMessage,
  setHoveredMessage,
  formatMessageTime,
  messagesEndRef,
  isTyping,conversationId
}) => {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden mt-4 scrollbar">
      <div className="flex flex-col">
        {messages.map((message, index) => {
          const messageDate = new Date(message.createdAt);
          const previousMessageDate = index > 0 ? new Date(messages[index - 1].createdAt) : null;
          const showDateSeparator = !previousMessageDate || messageDate.toDateString() !== previousMessageDate.toDateString();

          return (
            <React.Fragment key={message._id}>
              {showDateSeparator && (
                <div className="text-center text-gray-500 text-xs my-4 sticky top-0 bg-white z-10">
                  {formatMessageDate(message.createdAt)}
                </div>
              )}
              <div
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
                      className="absolute top-1 -left-4 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Delete message"
                    >
                      <IoTrash size="10px" />
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
                  <div className="text-[9px] opacity-70 mt-1">
                    {formatMessageTime(message.createdAt)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {!!isTyping[conversationId] && (
        <div className="flex items-center mb-2 ml-2 typing-indicator">
        <div className="bg-gray-300 rounded-lg px-2 flex items-center">
          <span className="text-2xl leading-none font-bold mr-[-1px]">.</span>
          <span className="text-2xl leading-none font-bold mr-[-1px]">.</span>
          <span className="space-x-0 text-2xl leading-none font-bold  ">.</span>
        </div>
      </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
