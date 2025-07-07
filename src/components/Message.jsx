import React, { useState, useEffect } from 'react';
import { IoIosSearch } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import { IoTrashBin } from "react-icons/io5";
import useravator from "../avator2.jpg";
import axiosInstance from '../utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedPeople, setIsChatOpen, updateConversationWithMessage, deleteConversation } from '../redux/slices/chatSlice';
import { useSocket } from '../context/SocketContext';

export const Message = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeopleState, setSelectedPeopleState] = useState([]);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const conversations = useSelector(state => state.chat.conversations);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);

  const dispatch = useDispatch();

  // Use socket context instead of creating new socket
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (!data || !data.conversationId || !data.message) return;
      
      // Ensure message object is serializable
      const serializedMessage = {
        ...data.message,
        createdAt: data.message.createdAt ? new Date(data.message.createdAt).toISOString() : new Date().toISOString()
      };

      // Only update unread count for messages from others
      const currentUserId = localStorage.getItem('userId');
      if (data.message.senderId._id !== currentUserId) {
        dispatch(updateConversationWithMessage({
          conversationId: data.conversationId,
          message: serializedMessage
        }));
      }
    };

    // Listen for new messages
    socket.on('receiveMessage', handleNewMessage);
    socket.on('messageSent', handleNewMessage);

    return () => {
      socket.off('receiveMessage', handleNewMessage);
      socket.off('messageSent', handleNewMessage);
    };
  }, [socket, dispatch]);


  useEffect(() => {
    if (modalSearchQuery.length < 2) {
      setSearchedUsers([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const handler = setTimeout(async () => {
      try {
        const response = await axiosInstance.get('/api/users/search', {
          params: { query: modalSearchQuery }
        });
        if (response.data.status === 'success') {
          const filteredUsers = response.data.data.users.filter(
            (user) => !selectedPeopleState.some(selected => selected._id === user._id)
          );
          setSearchedUsers(filteredUsers);
        } else {
          setSearchedUsers([]);
          setSearchError(response.data.message || 'Error searching for users');
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchedUsers([]);
        setSearchError(error.response?.data?.message || 'Failed to fetch users');
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [modalSearchQuery, selectedPeopleState]);

  useEffect(() => {
    // Just handle loading state based on conversations
    setIsLoadingConversations(conversations.length === 0);
  }, [conversations]);

  const handlePersonSelect = (person) => {
    if (!selectedPeopleState.find(p => p._id === person._id)) {
      setSelectedPeopleState([...selectedPeopleState, person]);
      setSearchedUsers(searchedUsers.filter(user => user._id !== person._id));
    }
  };

  const handlePersonRemove = (personId) => {
    const personToRemove = selectedPeopleState.find(p => p._id === personId);
    if (personToRemove) {
      setSelectedPeopleState(selectedPeopleState.filter(p => p._id !== personId));
      if (modalSearchQuery.length >= 2 && personToRemove.fullName.toLowerCase().includes(modalSearchQuery.toLowerCase())) {
        setSearchedUsers([personToRemove, ...searchedUsers]);
      }
    }
  };

  const handleNextClick = () => {
    if (selectedPeopleState.length > 0) {
      dispatch(setSelectedPeople(selectedPeopleState.map(person => ({ ...person, name: person.fullName }))));
      dispatch(setIsChatOpen(true));
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPeopleState([]);
    setModalSearchQuery('');
    setSearchedUsers([]);
    setSearchError(null);
  };

  const handleConversationClick = (conversation) => {
    const otherParticipants = conversation.participants.filter(
      (p) => p._id !== localStorage.getItem('userId')
    );
    if (otherParticipants.length > 0) {
      const formattedSelectedPeople = otherParticipants.map(person => ({ ...person, name: person.fullName }));
      dispatch(setSelectedPeople(formattedSelectedPeople));
      dispatch(setIsChatOpen(true));
    }
  };

  const handleDeleteConversation = async (conversationId, e) => {
    e.stopPropagation(); // Prevent triggering conversation click
    try {
      await axiosInstance.delete(`/api/chat/conversations/${conversationId}`);
      dispatch(deleteConversation({ conversationId }));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 ? hours % 12 : 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  return (
    <div className="flex flex-col w-full h-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg  shadow-lg border border-white border-opacity-30">
      <div className="sticky top-0  backdrop-blur-3xl bg-blue/95 p-4 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Messages</h1>
          <button onClick={() => setIsModalOpen(true)} className="text-xs px-3 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
            New Message
          </button>
        </div>
        
        <div className="flex items-center py-2 px-4 text-sm bg-gray-100 rounded-full border border-transparent 
          focus-within:border-blue-500 focus-within:bg-inherit focus-within:text-blue-500">
          <IoIosSearch size="18px"/>
          <input 
            type="search" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages" 
            className="mx-2 bg-inherit text-black w-full focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 p-4">
        {isLoadingConversations && <div className="text-center text-gray-500">Loading conversations...</div>}
        {conversationsError && <div className="text-center text-red-500">{conversationsError}</div>}
        {!isLoadingConversations && conversations.length === 0 && !conversationsError && (
          <p className="text-center text-gray-500">No conversations yet. Start a new message!</p>
        )}
        {!isLoadingConversations && conversations.length > 0 && (
          <div className="space-y-4">
            {conversations.map(conversation => (
              <div 
                key={conversation._id} 
                className="flex items-center gap-2 p-4 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg  shadow-lg rounded-lg cursor-pointer group hover:bg-opacity-30 transition-colors duration-200"
                onClick={() => handleConversationClick(conversation)}
              >
                <img 
                  src={conversation.participants.find(p => p._id !== localStorage.getItem('userId'))?.avatar || useravator} 
                  alt="User Avatar" 
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold">
                    {conversation.participants
                      .filter(p => p._id !== localStorage.getItem('userId'))
                      .map(p => p.username)
                      .join(', ')}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {conversation.lastMessage ? (
                      <div className="flex justify-between items-center">
                        <span className='flex-1 whitespace-nowrap overflow-hidden text-ellipsis min-w-0'>
                          {conversation.lastMessage.media?.length > 0 && !conversation.lastMessage.content 
                            ? 'Image' 
                            : conversation.lastMessage.content}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">{formatMessageTime(conversation.lastMessage.createdAt)}</span>
                      </div>
                    ) : (
                      'Start a conversation'
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {conversation.currentUserUnreadCount > 0 && (
                    <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {conversation.currentUserUnreadCount}
                    </span>
                  )}
                  <button
                    onClick={(e) => handleDeleteConversation(conversation._id, e)}
                    className=" flex items-center justify-center w-8 h-8 text-gray-500 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors"
                    title="Delete conversation"
                  >
                    <IoTrashBin size="18px" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gradient-to-br from-zinc-200 to-blue-300  flex items-center justify-center z-[200]">
          <div className="bg-white/50 bg-opacity-20 backdrop-filter backdrop-blur-lg  shadow-lg rounded-2xl w-[600px] max-h-[80vh] flex flex-col p-4 border border-white border-opacity-30">
            <div className="flex items-center justify-between p-2 border-b border-white ">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleCloseModal}
                  className="hover:bg-gray-100 p-2 rounded-full"
                >
                  <IoClose size="24px" />
                </button>
                <h2 className="text-xl font-bold">New Message</h2>
              </div>
              <button 
                onClick={handleNextClick}
                className="px-4 py-1 bg-blue-500 text-white rounded-full disabled:opacity-50"
                disabled={selectedPeopleState.length === 0}
              >
                Next
              </button>
            </div>

            <div className="p-4 flex-1 overflow-hidden">
              <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                {selectedPeopleState.map(person => (
                  <div key={person._id} className="flex items-center gap-1 bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    <span className="text-sm">{person.fullName}</span>
                    <button onClick={() => handlePersonRemove(person._id)} className="hover:bg-blue-200 rounded-full p-1">
                      <IoClose size="14px" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 border-b pb-2 border-white ">
                <IoIosSearch size="16px" className="text-gray-400" />
                <input 
                  type="search" 
                  value={modalSearchQuery} 
                  onChange={(e) => setModalSearchQuery(e.target.value)} 
                  placeholder="Search people" 
                  className="w-full focus:outline-none bg-transparent text-black"
                />
              </div>

              {isSearching && <div className="text-center text-gray-500 mt-4">Searching...</div>}
              {searchError && <div className="text-center text-red-500 mt-4">{searchError}</div>}
              {!isSearching && !searchError && modalSearchQuery.length > 1 && searchedUsers.length === 0 && (
                <div className="text-center text-gray-500 mt-4">No users found.</div>
              )}
              {!isSearching && !searchError && modalSearchQuery.length < 2 && (
                <div className="text-center text-gray-500 mt-4">Start typing to search for users.</div>
              )}

              <div className="mt-2 max-h-[300px] overflow-y-auto">
                {searchedUsers.map(person => (
                  <div key={person._id} onClick={() => handlePersonSelect(person)} className="flex items-center gap-2 p-3 hover:bg-white hover:bg-opacity-30 rounded-lg cursor-pointer transition-colors duration-200">
                    <img src={person.avatar || useravator} alt={person.fullName} className="w-8 h-8 rounded-full"/>
                    <div>
                      <div className="font-bold">{person.fullName}</div>
                      <div className="text-gray-500 text-sm">{person.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


