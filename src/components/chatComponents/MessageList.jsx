import React, { useState } from 'react';
import { IoTrash } from "react-icons/io5";
import MediaSlider from '../../minicomponents/MediaSlider';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessageIndex, setModalMessageIndex] = useState(0);
  const [modalMediaIndex, setModalMediaIndex] = useState(0);

  const handleImageClick = (msgIdx, mediaIdx) => {
    setModalMessageIndex(msgIdx);
    setModalMediaIndex(mediaIdx);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden mt-4 mb-4 scrollbar">
      <div className="flex flex-col pb-8">
        {messages.map((message, index) => {
          const messageDate = new Date(message.createdAt);
          const previousMessageDate = index > 0 ? new Date(messages[index - 1].createdAt) : null;
          const showDateSeparator = !previousMessageDate || messageDate.toDateString() !== previousMessageDate.toDateString();

          return (
            <React.Fragment key={message._id}>
              {showDateSeparator && (
                <div className="text-center text-gray-800 text-xs my-2 sticky top-0 bg-zinc-300 backdrop-blur-md z-10">
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
                    ? 'bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg text-black' 
                    : 'bg-blue-600 text-white mr-10 backdrop-filter backdrop-blur-lg'
                }`}>
                  {message.senderId._id === currentUserId && hoveredMessage === message._id && (
                    <button
                      onClick={() => onDeleteMessage(message._id)}
                      className="absolute top-1 -left-4 bg-red-600 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Delete message"
                    >
                      <IoTrash size="10px" />
                    </button>
                  )}
                  {message.content && (
                    <div className="text-xs break-words">{message.content}</div>
                  )}
                  {message.media?.length > 0 && (
                    <div className={`grid ${message.media?.length>1?'grid-cols-2':'grid-cols-1'} gap-1 mt-2`}>
                      {message.media.map((media, i) => (
                        <img
                          key={i}
                          src={media.url}
                          alt="message media"
                          className="w-full h-24 object-contain rounded cursor-pointer"
                          onClick={() => handleImageClick(index, i)}
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
        <div className="bg-gray-100/10 rounded-lg px-2 flex items-center">
          <span className="text-2xl leading-none font-bold mr-[-1px]">.</span>
          <span className="text-2xl leading-none font-bold mr-[-1px]">.</span>
          <span className="space-x-0 text-2xl leading-none font-bold  ">.</span>
        </div>
      </div>
        )}
        <div ref={messagesEndRef} />
        
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="relative">
            <button
              className="absolute top-2 right-2 bg-white rounded-full p-2 py-1 z-10"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
            <MediaSlider
              media={messages[modalMessageIndex].media}
              initialIndex={modalMediaIndex}
            />
          </div>
        </div>
      )}
    </div>
  );
};
