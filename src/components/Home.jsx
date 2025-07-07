import React, { useEffect, useState, useRef, Suspense, lazy } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom';
import { LeftSidebar } from './LeftSidebar'
import { RightSidebar } from './RightSidebar'
import { Feed } from './Feed'
import Profile from './Profile';
import { Explore } from './Explore';
import { Notifications } from './Notifications';
import {Message} from './Message';
import Bookmarks from './Bookmarks';
import { SinglePostView } from './SinglePostView';
import { useSelector } from 'react-redux';
import { useSocket } from '../context/SocketContext';
import BlockedUsers from './BlockedUsers';
import LoadingShimmer from './LoadingShimmer';
import { VideoCallRoom } from './chatComponents/VideoCallRoom';


// Lazy-loaded components
const LazyChat = lazy(() => import('./chatComponents/Chat').then(module => ({ default: module.Chat })));
const LazyIncomingCallDialog = lazy(() => import('./chatComponents/IncomingCallDialog').then(module => ({ default: module.IncomingCallDialog })));
// const LazyVideoCallRoom = lazy(() => import('./chatComponents/VideoCallRoom').then(module => ({ default: module.VideoCallRoom })));
const LazyOutgoingCallDialog = lazy(() => import('./chatComponents/OutgoingCallDialog').then(module => ({ default: module.OutgoingCallDialog })));


// Placeholder components for missing routes

const Home = () => {
  // Get state from Redux store
  const { isChatOpen, selectedPeople } = useSelector(state => state.chat);

  // Use socket context for video calls
  const { callState, incomingCall, currentCall, outgoingCall, answerCall, rejectCall, hangUp, sendSignal } = useSocket();

  const [showCallRejectedNotification, setShowCallRejectedNotification] = useState(false);
  const prevCallStateRef = useRef(callState); // Ref to track previous callState

  useEffect(() => {
    // This effect triggers when callState changes.
    // We check if we were 'calling' and now we are 'idle' without an active call,
    // which implies the outgoing call was rejected or cancelled by the other party.
    if (prevCallStateRef.current === 'calling' && callState === 'idle' && !currentCall && !incomingCall) {
      setShowCallRejectedNotification(true);
      const timer = setTimeout(() => {
        setShowCallRejectedNotification(false);
      }, 3000); // Hide notification after 3 seconds
      return () => clearTimeout(timer);
    }
    // Update the ref for the next render
    prevCallStateRef.current = callState;
  }, [callState, currentCall, incomingCall]);

  return (
    <>
    <div className='flex w-full mx-auto h-screen lg:w-[80%] lg:justify-between' >
      {/* Left Sidebar */}
      <div className="w-min md:w-[6%] lg:w-[20%] ">
        <LeftSidebar />
      </div>
      {/* Main Feed Area */}
      <div className={`flex-shrink-1 max-h-min border-r border-l border-[rgb(239, 243, 244)] overflow-y-auto scrollbar ${isChatOpen ? 'hidden sm:block sm:w-full lg:w-[45%]' : 'w-full md:w-[50%] lg:w-[45%]'}`}>
        <Routes>
          <Route index element={<Feed/>}/>
          <Route path="profile/:username" element={<Profile/>}/>
          <Route path="search" element={<Explore/>}/>
          <Route path="noti" element={<Notifications/>}/>
          <Route path="message" element={<Message />}/>
          <Route path="bookmarks" element={<Bookmarks/>}/>
          <Route path="blocked-users" element={<BlockedUsers/>}/>
          <Route path="post/:postId" element={ <SinglePostView />} />
         
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
      {/* Right Sidebar */}
      {isChatOpen ? (
        <div className="w-full md:w-[50%] lg:w-[30%] overflow-y-auto overflow-x-hidden border-l border-[rgb(239, 243, 244)]">
          <Suspense fallback={<LoadingShimmer />}>
            <LazyChat selectedPeople={selectedPeople} />
          </Suspense>
        </div>
      ) : (
        <div className="hidden md:block w-[30%] ">
          <RightSidebar />
        </div>
      )}
    </div>


    {/* Render OutgoingCallDialog if callState is 'calling' */}
    {callState === 'calling'  && outgoingCall && (
      <Suspense fallback={<LoadingShimmer />}>
        <LazyOutgoingCallDialog
          callee={outgoingCall.to}
          onCancelCall={hangUp}
        />
      </Suspense>
    )}
  
    {/* Render IncomingCallDialog if callState is 'incoming' */}
    {callState === 'incoming' && incomingCall && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <Suspense fallback={<LoadingShimmer />}>
          <LazyIncomingCallDialog
            caller={incomingCall.from}
            onAccept={() => answerCall(incomingCall.signal)}
            onReject={rejectCall}
          />
        </Suspense>
      </div>
    )}

    {/* Render VideoCallRoom if callState is 'active' */}
    {callState === 'active' && currentCall && (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        {/* <Suspense fallback={<LoadingShimmer />}>
          <LazyVideoCallRoom
            currentCall={currentCall}
            hangUp={hangUp}
            sendSignal={sendSignal}
            // You might need to pass more socket/WebRTC related functions here later
          />
        </Suspense> */}
        <VideoCallRoom
            currentCall={currentCall}
            hangUp={hangUp}
            sendSignal={sendSignal}
            // You might need to pass more socket/WebRTC related functions here later
          />
      </div>
    )}

    {/* Call Rejected Notification */}
    {showCallRejectedNotification && (
      <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-xl shadow-xl z-50 text-center animate-fade-in-down">
        <p className="font-semibold">Call was rejected or cancelled.</p>
      </div>
    )}
    </>
  )
}

export default Home