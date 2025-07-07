import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const pendingCandidatesRef = useRef([]);
  // NEW: Ref to track if WebRTC setup is currently active
  const callSetupActiveRef = useRef(false);

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
      }
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
    } catch (error) {
      console.error('Error enumerating devices:', error);
    }
  };

  // Function to switch audio device
  const switchAudioDevice = async (deviceId) => {
    if (!peerConnectionRef.current || !localStreamRef.current) {
       return;
    }
    try {
      const currentAudioTrack = localStreamRef.current.getAudioTracks()[0];
      if (currentAudioTrack) {
        currentAudioTrack.stop();
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false,
      });
      const newAudioTrack = newStream.getAudioTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'audio');
      if (sender) {
        await sender.replaceTrack(newAudioTrack);
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const newLocalStream = new MediaStream();
        newLocalStream.addTrack(newAudioTrack);
        if(videoTrack) newLocalStream.addTrack(videoTrack);
        localStreamRef.current = newLocalStream;
        localVideoRef.current.srcObject = newLocalStream;
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
    if (!peerConnectionRef.current || !localStreamRef.current) {
       return;
    }
    if (isScreenSharing) {
      setWarningMessage('Stop screen sharing before switching camera.');
      return;
    }
    try {
      const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (currentVideoTrack) {
        currentVideoTrack.stop();
      }
      await new Promise(resolve => setTimeout(resolve, 50));
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        const newLocalStream = new MediaStream();
        newLocalStream.addTrack(newVideoTrack);
        if(audioTrack) newLocalStream.addTrack(audioTrack);
        localStreamRef.current = newLocalStream;
        localVideoRef.current.srcObject = newLocalStream;
        setSelectedVideoDevice(deviceId);
        setIsCameraOff(false);
      } else {
        console.error('Video sender not found.');
      }
    } catch (error) {
      console.error('Error switching video device:', error);
      setWarningMessage(`Failed to switch video device. Error: ${error.name}. This often means the device is busy or permissions were denied. Please ensure no other applications are using the camera and try again.`);
       try {
           const defaultStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !!localStreamRef.current?.getAudioTracks().length });
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
                 setSelectedVideoDevice(null);
                 setIsCameraOff(false);
            } else if (localStreamRef.current) {
                 localStreamRef.current.getVideoTracks().forEach(track => track.stop());
                 localStreamRef.current = null;
                 localVideoRef.current.srcObject = null;
                 setSelectedVideoDevice(null);
                 setIsCameraOff(true);
            }
       } catch (defaultError) {
        console.error('Error switching back to default video device during fallback:', defaultError);
            if (localStreamRef.current) {
                 localStreamRef.current.getVideoTracks().forEach(track => track.stop());
                 localStreamRef.current = null;
                 localVideoRef.current.srcObject = null;
                 setSelectedVideoDevice(null);
                 setIsCameraOff(true);
            }
       }
    }
  };

  // Function to start screen sharing
  const startScreenShare = async () => {
    if (isScreenSharing || !peerConnectionRef.current) {
       return;
    }
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
      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
        setIsScreenSharing(true);
        screenTrack.onended = () => {
          stopScreenShare();
        };
        if (localStreamRef.current) {
           localStreamRef.current.getVideoTracks().forEach(track => track.stop());
        }
        sendSignal(currentCall.otherUser._id, { type: 'userStartedScreenShare' });
      }
    } catch (error) {
      console.error('Error starting screen sharing:', error);
    }
  };

  // Function to stop screen sharing
  const stopScreenShare = async () => {
    if (!isScreenSharing || !peerConnectionRef.current) {
       return;
    }
    const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
    if (sender && sender.track) {
       sender.track.stop();
    }
    try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        if(sender) {
            await sender.replaceTrack(cameraTrack);
        }
        localVideoRef.current.srcObject = cameraStream;
        localStreamRef.current = cameraStream;
        setIsScreenSharing(false);
        sendSignal(currentCall.otherUser._id, { type: 'userStoppedScreenShare' });
    } catch (error) {
      console.error('Error switching back to camera after screen sharing:', error);
         setIsScreenSharing(false);
         if (localStreamRef.current) {
           localStreamRef.current.getTracks().forEach(track => track.stop());
           localStreamRef.current = null;
           localVideoRef.current.srcObject = null;
         }
        sendSignal(currentCall.otherUser._id, { type: 'userStoppedScreenShare' });
    }
  };

  useEffect(() => {
    // Clean up everything when currentCall changes or on unmount
    // Capture refs at the start of the effect for safe cleanup
    const localVideo = localVideoRef.current;
    const remoteVideo = remoteVideoRef.current;
    return () => {
      console.log(`[${new Date().toLocaleTimeString()}] --- Initiating Full Cleanup (useEffect) ---`);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.oniceconnectionstatechange = null;
        peerConnectionRef.current.onsignalingstatechange = null;
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (remoteVideo) {
        remoteVideo.srcObject = null;
      }
      if (localVideo) {
        localVideo.srcObject = null;
      }
      pendingCandidatesRef.current = [];
      if (socket) {
        socket.off('returningSignal');
      }
      setIsMuted(false);
      setIsCameraOff(false);
      setIsScreenSharing(false);
      setOtherUserIsSharing(false);
      setWarningMessage(null);
      setAudioDevices([]);
      setVideoDevices([]);
      setSelectedAudioDevice(null);
      setSelectedVideoDevice(null);
      setShowAudioDevices(false);
      setShowVideoDevices(false);
    };
  }, [currentCall, socket]);

  // Memoize the signal handler to avoid re-registering on every render
  const handleReturningSignal = useCallback(async ({ signal }) => {
    if (!peerConnectionRef.current || !callSetupActiveRef.current) {
      return;
    }
    const pc = peerConnectionRef.current;
    try {
      if (signal.type === 'userStartedScreenShare') {
        setOtherUserIsSharing(true);
        setWarningMessage(null);
      } else if (signal.type === 'userStoppedScreenShare') {
        setOtherUserIsSharing(false);
      } else if (signal.offer) {
        if (pc.signalingState === 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal(currentCall.otherUser._id, { answer: answer });
          while (pendingCandidatesRef.current.length > 0) {
            const candidate = pendingCandidatesRef.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn('Failed to add ICE candidate after offer:', err);
            }
          }
        } else {
          if (currentCall) {
            sendSignal(currentCall.otherUser._id, { type: 'reset' });
          }
        }
      } else if (signal.answer) {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
          while (pendingCandidatesRef.current.length > 0) {
            const candidate = pendingCandidatesRef.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn('Failed to add ICE candidate after answer:', err);
            }
          }
        }
      } else if (signal.ice) {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
          } catch (err) {
            console.warn('Failed to add ICE candidate:', err);
            pendingCandidatesRef.current.push(signal.ice);
          }
        } else {
          pendingCandidatesRef.current.push(signal.ice);
        }
      } else if (signal.type === 'reset') {
        hangUp();
        setWarningMessage('Call was reset due to a signaling error. Please try again.');
      }
    } catch (error) {
      console.error('Error handling incoming signal:', error);
      if (currentCall) {
        sendSignal(currentCall.otherUser._id, { type: 'reset' });
      }
      hangUp();
      setWarningMessage(`Call error: ${error.name || error.message}. Call reset.`);
    }
  }, [currentCall, hangUp, sendSignal]);

  useEffect(() => {
    if (!currentCall || !socket) {
      return;
    }
    if (callSetupActiveRef.current) {
      console.warn(`[${new Date().toLocaleTimeString()}] WebRTC setup already active. Skipping duplicate setup attempt.`);
      return;
    }
    callSetupActiveRef.current = true;
    let isMounted = true;
    const setupWebRTC = async () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.oniceconnectionstatechange = null;
        peerConnectionRef.current.onsignalingstatechange = null;
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      pendingCandidatesRef.current = [];
      if (!isMounted || !currentCall || !socket || !callSetupActiveRef.current) {
        callSetupActiveRef.current = false;
        return;
      }
      try {
        const constraints = {
          video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(error => {
            console.error('Error accessing media devices:', error);
            throw error;
        });
        if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        }
        localStreamRef.current = stream;
        peerConnectionRef.current = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
          ],
        });
        const peerConnection = peerConnectionRef.current;
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
        peerConnection.ontrack = (event) => {
          console.log(`[${new Date().toLocaleTimeString()}] Received remote track event. Stream ID: ${event.streams[0]?.id}. PC Signaling State: ${peerConnection.signalingState}, ICE Connection State: ${peerConnection.iceConnectionState}`);
          if (remoteVideoRef.current) { // Defensive check
          remoteVideoRef.current.srcObject = event.streams[0];
            console.log(`[${new Date().toLocaleTimeString()}] remoteVideoRef.current.srcObject set.`);
          }
        };

        // 4. Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(`[${new Date().toLocaleTimeString()}] Sending ICE candidate:`, event.candidate);
            sendSignal(currentCall.otherUser._id, { ice: event.candidate });
          }
        };
        if (currentCall.isCaller) {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          sendSignal(currentCall.otherUser._id, { offer: offer });
        }
        peerConnection.oniceconnectionstatechange = () => {
          if (['disconnected', 'failed', 'closed'].includes(peerConnection.iceConnectionState)) {
            if (currentCall && peerConnectionRef.current === peerConnection) {
                setWarningMessage('Connection lost. Hanging up...');
                sendSignal(currentCall.otherUser._id, { type: 'reset' });
                setTimeout(() => {
                  hangUp();
                }, 1000);
            }
          }
        };
        peerConnection.onsignalingstatechange = () => {};
      } catch (error) {
        console.error('Error setting up WebRTC:', error);
        if (isMounted && callSetupActiveRef.current) {
            setWarningMessage(`Call setup failed: ${error.name || error.message}. Please try again.`);
            hangUp();
        }
        callSetupActiveRef.current = false;
      }
    };
      setupWebRTC();
      socket.off('returningSignal', handleReturningSignal);
      socket.on('returningSignal', handleReturningSignal);
    return () => {
       isMounted = false;
       callSetupActiveRef.current = false;
       socket.off('returningSignal', handleReturningSignal);
    };
  }, [currentCall, socket, selectedAudioDevice, selectedVideoDevice, handleReturningSignal, hangUp, sendSignal]);

  useEffect(() => {
    enumerateMediaDevices();
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      stream.getTracks().forEach(track => track.stop());
      enumerateMediaDevices();
    }).catch(error => {
      enumerateMediaDevices();
    });
  }, []);

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