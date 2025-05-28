import React, { useEffect, useState } from 'react'
import { LeftSidebar } from './LeftSidebar'
import { RightSidebar } from './RightSidebar'
import { Feed } from './Feed'
import { Route, Routes, Navigate } from 'react-router-dom';
import Profile from './Profile';
import { Explore } from './Explore';
import { Notifications } from './Notifications';
import Message from './Message';
import Bookmarks from './Bookmarks';
import { useSelector } from 'react-redux';
import { Chat } from './chatComponents/Chat';


// Placeholder components for missing routes

const Home = () => {
  // Get state from Redux store
  const { isChatOpen, selectedPeople } = useSelector(state => state.chat);

  

  return (
  
    <div className='flex justify-between w-[75%] mx-auto h-[100vh]' >
      <div className="w-[20%]  sticky top-0">
        <LeftSidebar />
      </div>
      <div className='w-[50%] flex flex-grow border-r border-l border-[rgb(239, 243, 244)] overflow-y-auto scrollbar'>
        <Routes>
          <Route index element={<Feed/>}/>
          <Route path="profile" element={<Profile/>}/>
          <Route path="search" element={<Explore/>}/>
          <Route path="noti" element={<Notifications/>}/>
          <Route path="message" element={<Message />}/>
          <Route path="bookmarks" element={<Bookmarks/>}/>
         
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
      {isChatOpen ? (
        <div className="w-[30%] overflow-y-auto">
          <Chat selectedPeople={selectedPeople} />
        </div>
      ) : (
        <div className="w-[30%]">
          <RightSidebar />
        </div>
      )}
    </div>
  
  )
}

export default Home