import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaShareSquare, FaStopCircle } from 'react-icons/fa';
import { HiOutlinePhoneMissedCall } from "react-icons/hi"
import { LuScreenShare } from "react-icons/lu";
import { FiChevronUp } from "react-icons/fi";

export const VideoCallRoom = ({ currentCall, hangUp, sendSignal }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [otherUserIsSharing, setOtherUserIsSharing] = useState(false);
  const [warningMessage, setWarningMessage] = useState(null);
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState(null);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState(null);
  const [showAudioDevices, setShowAudioDevices] = useState(false);
  const [showVideoDevices, setShowVideoDevices] = useState(false);

  const { socket, socketError } = useSocket();

  useEffect(() => {
    if (socketError) {
      setWarningMessage(socketError);
    }
  }, [socketError]);

  // Function to toggle audio mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        console.log(`Audio ${audioTrack.enabled ? 'unmuted' : 'muted'}`);
      }
      else{
        console.log("not permission")
      }
    }
  };

  // Function to toggle video camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
        console.log(`Camera ${videoTrack.enabled ? 'on' : 'off'}`);
      }
      else
     { console.log("not camera allowed")}
    }
  };

  // Function to enumerate media devices
  const enumerateMediaDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);
      console.log('Audio Devices:', audioInputs);
      console.log('Video Devices:', videoInputs);
    } catch (error) {
      console.error('Error enumerating devices:', error);
    }
  };

  // Function to switch audio device
  const switchAudioDevice = async (deviceId) => {
    if (!peerConnectionRef.current || !localStreamRef.current) return;

    try {
      // Get the current audio track and stop it
      const currentAudioTrack = localStreamRef.current.getAudioTracks()[0];
      if (currentAudioTrack) {
        currentAudioTrack.stop();
      }

      // Get a new stream with the selected audio device
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false, // Don't request video here
      });
      const newAudioTrack = newStream.getAudioTracks()[0];

      // Find the audio sender and replace the track
      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'audio');
      if (sender) {
        await sender.replaceTrack(newAudioTrack);
        console.log('Switched audio device to:', deviceId);

        // Update the local stream reference with the new audio track
        // Note: This is a bit tricky. Replacing the track on the sender updates what's sent, but the local stream displayed needs updating too.
        // A more robust approach might involve creating a new combined stream or carefully managing tracks.
        // For simplicity here, we'll stop the old stream and add the new track to a new local stream. This might cause a brief visual glitch.
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const newLocalStream = new MediaStream();
        newLocalStream.addTrack(newAudioTrack);
        if(videoTrack) newLocalStream.addTrack(videoTrack);
        localStreamRef.current = newLocalStream;
        localVideoRef.current.srcObject = newLocalStream; // Update local video display

        setSelectedAudioDevice(deviceId);
      } else {
        console.error('Audio sender not found.');
      }
    } catch (error) {
      console.error('Error switching audio device:', error);
    }
  };

  // Function to switch video device
  const switchVideoDevice = async (deviceId) => {
    if (!peerConnectionRef.current || !localStreamRef.current) return;
    if (isScreenSharing) {
      console.warn('Cannot switch video device while screen sharing.');
      setWarningMessage('Stop screen sharing before switching camera.');
      return;
    }

    try {
      // Get the current video track and stop it
      const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (currentVideoTrack) {
        currentVideoTrack.stop();
      }

      // Get a new stream with the selected video device
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false, // Don't request audio here
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      // Find the video sender and replace the track
      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
        console.log('Switched video device to:', deviceId);

        // Update the local stream reference and local video display with the new video track
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        const newLocalStream = new MediaStream();
        newLocalStream.addTrack(newVideoTrack);
        if(audioTrack) newLocalStream.addTrack(audioTrack);
        localStreamRef.current = newLocalStream;
        localVideoRef.current.srcObject = newLocalStream; // Update local video display

        setSelectedVideoDevice(deviceId);
        setIsCameraOff(false); // Ensure camera is not marked as off after switching
      } else {
        console.error('Video sender not found.');
      }
    } catch (error) {
      console.error('Error switching video device:', error);
      // Attempt to get default stream back if switching fails
      setWarningMessage(`Failed to switch video device. Error: ${error.name}. It might be in use by another application.`);
      try {
        const defaultStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !!localStreamRef.current?.getAudioTracks().length }); // Request audio if it was active
        const defaultVideoTrack = defaultStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if(sender && defaultVideoTrack) {
          await sender.replaceTrack(defaultVideoTrack);
          const audioTrack = localStreamRef.current?.getAudioTracks()[0];
          const newLocalStream = new MediaStream();
          newLocalStream.addTrack(defaultVideoTrack);
          if(audioTrack) newLocalStream.addTrack(audioTrack);
          localStreamRef.current = newLocalStream;
          localVideoRef.current.srcObject = newLocalStream;
          setSelectedVideoDevice(null); // Reset to default
          setIsCameraOff(false);
          console.log('Switched back to default video device.');
        } else if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach(track => track.stop());
          localStreamRef.current = null; // Clear stream if default couldn't be obtained
          localVideoRef.current.srcObject = null;
          setSelectedVideoDevice(null);
          setIsCameraOff(true);
        }
      } catch (defaultError) {
        console.error('Error switching back to default video device:', defaultError);
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach(track => track.stop());
          localStreamRef.current = null; // Clear stream if default couldn't be obtained
          localVideoRef.current.srcObject = null;
          setSelectedVideoDevice(null);
          setIsCameraOff(true);
        }
      }
    }
  };

  // Function to start screen sharing
  const startScreenShare = async () => {
    console.log("click on start screen .....")
    if (isScreenSharing || !peerConnectionRef.current) return;
    if (otherUserIsSharing) {
      setWarningMessage("Only one user can share screen at a time.");
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({   video: true,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
        suppressLocalAudioPlayback: true,
      },
      surfaceSwitching: "include",
      selfBrowserSurface: "exclude",
     });
      const screenTrack = screenStream.getVideoTracks()[0];

      // Replace the current video track with the screen share track
      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
        setIsScreenSharing(true);
        console.log('Started screen sharing');

        // Listen for screen share end (e.g., user clicks browser's stop sharing button)
        screenTrack.onended = () => {
          stopScreenShare();
        };

        // Stop local video stream tracks if screen sharing starts
        if (localStreamRef.current) {
           localStreamRef.current.getVideoTracks().forEach(track => track.stop());
        }

        // Emit signal that screen sharing has started
        sendSignal(currentCall.otherUser._id, { type: 'userStartedScreenShare' });
      }
    } catch (error) {
      console.error('Error starting screen sharing:', error);
    }
  };

  // Function to stop screen sharing
  const stopScreenShare = async () => {
    if (!isScreenSharing || !peerConnectionRef.current) return;

    // Stop the screen share track
    const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
    if (sender && sender.track) {
       sender.track.stop();
    }

    // Get user media again to switch back to camera
    try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        if(sender) {
            await sender.replaceTrack(cameraTrack);
        }
        // Update local video ref to show camera feed again
        localVideoRef.current.srcObject = cameraStream;
        localStreamRef.current = cameraStream; // Update the local stream ref

        setIsScreenSharing(false);
        console.log('Stopped screen sharing and switched back to camera');

        // Emit signal that screen sharing has stopped
        sendSignal(currentCall.otherUser._id, { type: 'userStoppedScreenShare' });

    } catch (error) {
        console.error('Error switching back to camera after screen sharing:', error);
        // If cannot get camera access again, just stop screen sharing and show nothing or a placeholder
         setIsScreenSharing(false);
         if (localStreamRef.current) {
           localStreamRef.current.getTracks().forEach(track => track.stop());
           localStreamRef.current = null;
           localVideoRef.current.srcObject = null;
         }

        // Emit signal that screen sharing has stopped even if switching back to camera failed
        sendSignal(currentCall.otherUser._id, { type: 'userStoppedScreenShare' });
    }
  };

  useEffect(() => {
    // Get user media and set up peer connection
    const setupWebRTC = async () => {
      try {
        // 1. Get local media stream
        // Use selected device IDs if available, otherwise use defaults
        const constraints = {
          video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(error => {
            console.error('Error accessing media devices:', error);
            // Handle the case where user denies media access
            // You might want to show an error message or disable call functionality
            throw error; // Re-throw to prevent further setup if media access fails
        });
        localVideoRef.current.srcObject = stream;
        localStreamRef.current = stream;
        console.log('Got local stream');

        // 2. Create RTCPeerConnection
        peerConnectionRef.current = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }, // Google's public STUN server
            // Add TURN server configuration here if needed for NAT traversal
          ],
        });

        const peerConnection = peerConnectionRef.current;

        // Add local stream tracks to the peer connection
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        // 3. Handle incoming tracks (remote stream)
        peerConnection.ontrack = (event) => {
          console.log('Got remote track', event.streams[0]);
          console.log('WebRTC Event: ontrack');
          remoteVideoRef.current.srcObject = event.streams[0];
        };

        // 4. Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('Sending ICE candidate', event.candidate);
            console.log('WebRTC Event: onicecandidate (sending)');
            sendSignal(currentCall.otherUser._id, { ice: event.candidate });
          }
        };

        // 5. Handle signaling (Offer/Answer)
        if (currentCall.isCaller) {
          // Caller creates offer
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          console.log('WebRTC Event: createOffer & setLocalDescription (caller)');
          console.log('Sending offer:', offer);
          sendSignal(currentCall.otherUser._id, { offer: offer });
          console.log('Caller:- it emit call'); // Console log as requested
        } else {
          // Receiver (callee) waits for offer and sends answer
          // The incoming offer is received via the 'returningSignal' socket event, handled below
        }

      } catch (error) {
        console.error('Error setting up WebRTC:', error);
      }
    };

    // Only run setupWebRTC when the component mounts or currentCall/socket change significantly
    if (currentCall && socket) {
      setupWebRTC();
    }

    // 6. Handle incoming signaling data
    if (socket) {
      const handleReturningSignal = async ({ signal }) => {
        console.log('Receiving signaling data', signal);
        if (!peerConnectionRef.current) return;

        try {
          if (signal.type === 'userStartedScreenShare') {
            setOtherUserIsSharing(true);
            setWarningMessage(null);
          } else if (signal.type === 'userStoppedScreenShare') {
            setOtherUserIsSharing(false);
          } else if (signal.offer) {
            // Received an offer (I am the callee)
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.offer));
            console.log('WebRTC Event: setRemoteDescription (offer - callee)');
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            console.log('WebRTC Event: createAnswer & setLocalDescription (callee)');
            console.log('Sending answer:', answer);
            sendSignal(currentCall.otherUser._id, { answer: answer });
            console.log('Reciever:- it emit event call-accepted'); // Console log as requested
          } else if (signal.answer) {
            // Received an answer (I am the caller)
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.answer));
            console.log('WebRTC Event: setRemoteDescription (answer - caller)');
          } else if (signal.ice) {
            // Received an ICE candidate
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.ice));
            console.log('WebRTC Event: addIceCandidate (receiving)');
          }
        } catch (error) {
          console.error('Error handling incoming signal:', error);
        }
      };

      socket.on('returningSignal', handleReturningSignal);

      // Cleanup socket listener
      return () => {
        socket.off('returningSignal', handleReturningSignal);
      };
    }

  }, [currentCall?.otherUser._id, socket]); // Dependency array adjusted

  // Effect to enumerate devices on mount
  useEffect(() => {
    enumerateMediaDevices();
    // Request media permissions to ensure device labels are available
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      stream.getTracks().forEach(track => track.stop()); // Stop tracks immediately after getting permission
      enumerateMediaDevices(); // Enumerate again after getting permissions
    }).catch(error => {
      console.warn('Could not get media permissions for initial enumeration:', error);
      // Continue with enumeration even without permissions (device labels might be empty)
      enumerateMediaDevices();
    });
  }, []); // Run only on mount

  // Cleanup function to close peer connection and stop tracks
  useEffect(() => {
    return () => {
      console.log('Cleaning up WebRTC connection');
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        console.log('Stopped local media tracks');
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        console.log('Closed peer connection');
      }
    };
  }, []); // Run only on component unmount

  return (
    <div className={`fixed inset-0 bg-zinc-900 text-white flex flex-col justify-between align-middle m-4 pb-20 `}>

      {/* Warning Message Display */}
      {warningMessage && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {warningMessage}
          <button onClick={() => setWarningMessage(null)} className="ml-2 text-sm font-bold">X</button>
        </div>
      )}

      {/* Video container: Relative positioning for absolute local video */}
      <div className={`relative flex-grow flex justify-center items-center`}>
        {/* Remote Video / Screen Share */}
        <video
           ref={remoteVideoRef}
           autoPlay
           playsInline
           className={`w-auto h-auto object-contain rounded-lg shadow-lg`}>
        </video>

        {/* Local Video: Positioned absolutely in a corner */}
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className={`absolute bottom-4 right-4 w-32 h-24 rounded-lg shadow-lg object-cover border-2 border-gray-700`}>
        </video>
      </div>
        <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4 bg-gray-800 bg-opacity-75">
          <button onClick={hangUp} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-full transition duration-300 ease-in-out flex items-center justify-center">
            <HiOutlinePhoneMissedCall size="20" />
          </button>
          {/* Microphone Toggle and Device Selection */}
          <div className="relative flex items-center mx-2"> {/* Container for Mic button and dropdown */}
            <button onClick={toggleMute} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-full transition duration-300 ease-in-out">
              {isMuted ? <FaMicrophoneSlash size="20" /> : <FaMicrophone className="text-green-600" size="23" />}
            </button>
            {/* Microphone Device Selection Dropdown Trigger */}
            <button onClick={() => setShowAudioDevices(!showAudioDevices)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-1 rounded-full transition duration-300 ease-in-out ml-1">
              <FiChevronUp size="20" />
            </button>
            {/* Microphone Device Dropdown */}
            {showAudioDevices && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white rounded-md shadow-lg z-50">
                <ul>
                  {audioDevices.map(device => (
                    <li key={device.deviceId} onClick={() => {
                      setSelectedAudioDevice(device.deviceId);
                      setShowAudioDevices(false);
                      switchAudioDevice(device.deviceId);
                    }} className="px-4 py-2 hover:bg-gray-600 cursor-pointer">
                      {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div> {/* Close the microphone button group div */}

          {/* Camera Toggle and Device Selection */}
          <div className="relative flex items-center mx-2"> {/* Container for Camera button and dropdown */}
            <button onClick={toggleCamera} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-full transition duration-300 ease-in-out">
              {isCameraOff ? <FaVideoSlash size="20" /> : <FaVideo className="text-green-600" size="23" />}
            </button>
            {/* Camera Device Selection Dropdown Trigger */}
            <button onClick={() => setShowVideoDevices(!showVideoDevices)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-1 rounded-full transition duration-300 ease-in-out ml-1">
              <FiChevronUp size="20" />
            </button>
            {/* Camera Device Dropdown */}
            {showVideoDevices && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white rounded-md shadow-lg z-50">
                <ul>
                  {videoDevices.map(device => (
                    <li key={device.deviceId} onClick={() => {
                      setSelectedVideoDevice(device.deviceId);
                      setShowVideoDevices(false);
                      switchVideoDevice(device.deviceId);
                    }} className="px-4 py-2 hover:bg-gray-600 cursor-pointer">
                      {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div> {/* Close the camera button group div */}

          {!isScreenSharing ? (
            <button
              onClick={startScreenShare}
              className={`font-bold py-2 px-3 rounded-full transition duration-300 ease-in-out ${otherUserIsSharing ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700 text-white'}`}
             
            >
              <LuScreenShare size="20" />
            </button>
          ) : (
            <button onClick={stopScreenShare} className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-3 rounded-full transition duration-300 ease-in-out">
              <FaStopCircle size="23" />
            </button>
          )}
        </div>
    </div>
  );
}; 