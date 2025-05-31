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
  
    <div className='flex w-full mx-auto h-[100vh] lg:w-[75%] lg:justify-between' >
      {/* Left Sidebar */}
      <div className="w-min md:w-[4%] lg:w-[20%]  sticky top-0">
        <LeftSidebar />
      </div>
      {/* Main Feed Area */}
      <div className={`flex-grow border-r border-l border-[rgb(239, 243, 244)] overflow-y-auto scrollbar ${isChatOpen ? 'hidden sm:block sm:w-[80%] lg:w-[50%]' : 'w-full md:w-[50%] lg:w-[50%]'}`}>
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
      {/* Right Sidebar */}
      {isChatOpen ? (
        <div className="w-full md:w-[50%] lg:w-[40%] overflow-y-auto overflow-x-hidden border-l border-[rgb(239, 243, 244)]">
          <Chat selectedPeople={selectedPeople} />
        </div>
      ) : (
        <div className="hidden md:block w-[30%] ">
          <RightSidebar />
        </div>
      )}
    </div>
  
  )
}

export default Home