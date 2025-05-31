import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import VideoCall from './VideoCall';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const VideoCallManager = ({ receiverId, peerName, onClose }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);

  const peerConnection = useRef(null);
  const { socket, emitEvent } = useSocket();

  // Initialize WebRTC peer connection
  const initializePeerConnection = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    peerConnection.current = new RTCPeerConnection(configuration);

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        emitEvent('ice-candidate', {
          candidate: event.candidate,
          receiverId
        });
      }
    };

    // Handle receiving remote stream
    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, localStream);
      });
    }
  }, [localStream, receiverId, emitEvent]);

  // Initialize media stream and peer connection
  useEffect(() => {
    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    startCall();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };  }, [localStream, screenStream]);

  // Initialize peer connection when local stream is ready
  useEffect(() => {
    if (localStream) {
      initializePeerConnection();
    }
  }, [localStream, initializePeerConnection]);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('call-accepted', async () => {
      try {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        emitEvent('call-offer', {
          offer,
          receiverId
        });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    });

    socket.on('call-offer', async ({ offer, callerId }) => {
      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        emitEvent('call-answer', {
          answer,
          callerId
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    socket.on('call-answer', async ({ answer }) => {
      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        if (peerConnection.current) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    socket.on('call-rejected', () => {
      onClose();
    });

    socket.on('call-ended', () => {
      onClose();
    });

    // Clean up
    return () => {
      socket.off('call-accepted');
      socket.off('call-offer');
      socket.off('call-answer');
      socket.off('ice-candidate');
      socket.off('call-rejected');
      socket.off('call-ended');
    };
  }, [socket, receiverId, emitEvent, onClose]);

  // Media control handlers
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: true 
        });
        
        setScreenStream(stream);
        
        // Replace video track
        const [screenTrack] = stream.getVideoTracks();
        const senders = peerConnection.current.getSenders();
        const videoSender = senders.find(sender => 
          sender.track?.kind === 'video'
        );
        
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }

        // Update local display
        setLocalStream(stream);
        setIsScreenSharing(true);

        // Handle stream end
        screenTrack.onended = () => {
          stopScreenSharing();
        };
      } else {
        stopScreenSharing();
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const stopScreenSharing = async () => {
    try {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }

      // Get new video stream
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Replace track in peer connection
      const [videoTrack] = newStream.getVideoTracks();
      const senders = peerConnection.current.getSenders();
      const videoSender = senders.find(sender => 
        sender.track?.kind === 'video'
      );
      
      if (videoSender) {
        videoSender.replaceTrack(videoTrack);
      }

      // Update local display
      setLocalStream(newStream);
      setIsScreenSharing(false);
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  const endCall = () => {
    emitEvent('end-call', { receiverId });
    onClose();
  };

  // Start the call
  useEffect(() => {
    if (localStream && socket) {
      emitEvent('start-call', { receiverId });
    }
  }, [localStream, socket, receiverId, emitEvent]);

  if (!localStream) return null;

  return (
    <VideoCall
      localStream={localStream}
      remoteStream={remoteStream}
      isAudioEnabled={isAudioEnabled}
      isVideoEnabled={isVideoEnabled}
      isScreenSharing={isScreenSharing}
      onToggleAudio={toggleAudio}
      onToggleVideo={toggleVideo}
      onToggleScreenShare={toggleScreenShare}
      onEndCall={endCall}
      peerName={peerName}
    />
  );
};

export default VideoCallManager;