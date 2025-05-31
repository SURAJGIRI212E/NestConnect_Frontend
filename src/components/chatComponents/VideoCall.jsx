import React, { useEffect, useRef } from 'react';
import { IoMicOff, IoMic, IoVideocam, IoVideocamOff, IoDesktop, IoClose } from "react-icons/io5";

const VideoCall = ({
  localStream,
  remoteStream,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
  peerName
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Main Video (Remote) */}
      <div className="flex-1 relative">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <p>Connecting to {peerName}...</p>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-24 right-4 w-48 aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-gray-800 bg-opacity-90 px-6 py-3 rounded-full">
        <button
          onClick={onToggleAudio}
          className={`p-3 rounded-full transition-colors ${
            isAudioEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-500 hover:bg-red-600'
          }`}
          title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isAudioEnabled ? 
            <IoMic className="w-6 h-6 text-white" /> : 
            <IoMicOff className="w-6 h-6 text-white" />
          }
        </button>

        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-full transition-colors ${
            isVideoEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-500 hover:bg-red-600'
          }`}
          title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {isVideoEnabled ? 
            <IoVideocam className="w-6 h-6 text-white" /> : 
            <IoVideocamOff className="w-6 h-6 text-white" />
          }
        </button>

        <button
          onClick={onToggleScreenShare}
          className={`p-3 rounded-full transition-colors ${
            isScreenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
          }`}
          title={isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
        >
          <IoDesktop className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={onEndCall}
          className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          title="End Call"
        >
          <IoClose className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;