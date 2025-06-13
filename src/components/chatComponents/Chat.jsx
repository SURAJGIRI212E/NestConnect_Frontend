import { useChat } from '../../hooks/useChat';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';

export const Chat = () => {
  const {
    messages,
    newMessage,
    isTyping,
    conversationId,
    selectedImages,
    isUploading,
    receiverProfile,
    isLoadingProfile,
    profileError,
    hoveredMessage,
    setNewMessage,
    setHoveredMessage,
    handleSendMessage,
    handleImageSelect,
    handleTyping,
    handleCloseChat,
    handleDeleteMessage,
    removeImage,
    formatMessageTime,
    fileInputRef,
    messagesEndRef
  } = useChat();

  const { selectedPeople } = useSelector(state => state.chat);
  const { isConnected } = useSocket();

  if (!selectedPeople?.length) return null;

  return (
    <div className="flex flex-col w-full h-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg border border-white border-opacity-30 p-2">
      <ChatHeader 
        profile={receiverProfile}
        isLoading={isLoadingProfile}
        error={profileError}
     
        onClose={handleCloseChat}
     
      />

      <MessageList 
        messages={messages}
        currentUserId={localStorage.getItem('userId')}
        onDeleteMessage={handleDeleteMessage}
        hoveredMessage={hoveredMessage}
        setHoveredMessage={setHoveredMessage}
        formatMessageTime={formatMessageTime}
        messagesEndRef={messagesEndRef}
        isTyping={isTyping}
        conversationId={conversationId}
      />

      <MessageInput 
        newMessage={newMessage}
        onMessageChange={(e) => setNewMessage(e.target.value)}
        onSend={handleSendMessage}
        onTyping={handleTyping}
        isUploading={isUploading}
        onImageSelect={handleImageSelect}
        selectedImages={selectedImages}
        removeImage={removeImage}
        fileInputRef={fileInputRef}
        disabled={!isConnected}
      />

      {!isConnected && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-center py-1 text-sm">
          Disconnected. Reconnecting...
        </div>
      )}
    </div>
  );
};