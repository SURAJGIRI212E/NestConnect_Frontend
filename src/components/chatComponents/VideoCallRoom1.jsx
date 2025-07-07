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
    console.log(`[${new Date().toLocaleTimeString()}] Toggling mute. Current: ${isMuted}`);
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
    console.log(`[${new Date().toLocaleTimeString()}] Toggling camera. Current: ${isCameraOff}`);
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
    console.log(`[${new Date().toLocaleTimeString()}] Enumerating media devices...`);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);
      // console.log('Audio Devices:', audioInputs);
      // console.log('Video Devices:', videoInputs);
      console.log(`[${new Date().toLocaleTimeString()}] Enumeration complete. Found ${audioInputs.length} audio, ${videoInputs.length} video.`);
    } catch (error) {
      console.error('Error enumerating devices:', error);
    }
  };

  // Function to switch audio device
  const switchAudioDevice = async (deviceId) => {
    console.log(`[${new Date().toLocaleTimeString()}] Attempting to switch audio device to: ${deviceId}`);
    if (!peerConnectionRef.current || !localStreamRef.current) {
      console.warn(`[${new Date().toLocaleTimeString()}] Switch audio aborted: PC or localStream not ready.`);
       return;
    }

    try {
      // Get the current audio track and stop it
      console.log(`[${new Date().toLocaleTimeString()}] Stopping current audio track.`);
      const currentAudioTrack = localStreamRef.current.getAudioTracks()[0];
      if (currentAudioTrack) {
        currentAudioTrack.stop();
      }

      // Get a new stream with the selected audio device
      console.log(`[${new Date().toLocaleTimeString()}] Requesting new audio stream with device: ${deviceId}`);
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false, // Don't request video here
      });
      const newAudioTrack = newStream.getAudioTracks()[0];

      // Find the audio sender and replace the track
      console.log(`[${new Date().toLocaleTimeString()}] Finding audio sender and replacing track.`);
      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'audio');
      if (sender) {
        await sender.replaceTrack(newAudioTrack);
        console.log('Switched audio device to:', deviceId);

        // Update the local stream reference with the new audio track
        // Note: This is a bit tricky. Replacing the track on the sender updates what's sent, but the local stream displayed needs updating too.
        // A more robust approach might involve creating a new combined stream or carefully managing tracks.
        // For simplicity here, we'll stop the old stream and add the new track to a new local stream. This might cause a brief visual glitch.
        console.log(`[${new Date().toLocaleTimeString()}] Updating local stream ref for audio switch.`);
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
    console.log(`[${new Date().toLocaleTimeString()}] Attempting to switch video device to: ${deviceId}`);
    if (!peerConnectionRef.current || !localStreamRef.current) {
      console.warn(`[${new Date().toLocaleTimeString()}] Switch video aborted: PC or localStream not ready.`);
       return;
    }
    if (isScreenSharing) {
      console.warn('Cannot switch video device while screen sharing.');
      setWarningMessage('Stop screen sharing before switching camera.');
      return;
    }

    try {
      // Get the current video track and stop it
      console.log(`[${new Date().toLocaleTimeString()}] Stopping current video track.`);
      const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (currentVideoTrack) {
        currentVideoTrack.stop();
      }

      // Get a new stream with the selected video device
      console.log(`[${new Date().toLocaleTimeString()}] Requesting new video stream with device: ${deviceId}`);
      await new Promise(resolve => setTimeout(resolve, 50)); // Add a small delay
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false, // Don't request audio here
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      // Find the video sender and replace the track
      console.log(`[${new Date().toLocaleTimeString()}] Finding video sender and replacing track.`);
      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
        console.log('Switched video device to:', deviceId);

        // Update the local stream reference and local video display with the new video track
        console.log(`[${new Date().toLocaleTimeString()}] Updating local stream ref for video switch.`);
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
      console.error(`[${new Date().toLocaleTimeString()}] Error switching video device:`, error);
      // Attempt to get default stream back if switching fails
      setWarningMessage(`Failed to switch video device. Error: ${error.name}. This often means the device is busy or permissions were denied. Please ensure no other applications are using the camera and try again.`);
       try {
        console.log(`[${new Date().toLocaleTimeString()}] Attempting to switch back to default video device.`);
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
          console.log(`[${new Date().toLocaleTimeString()}] Stopping video tracks as default could not be obtained.`);
                 localStreamRef.current.getVideoTracks().forEach(track => track.stop());
                 localStreamRef.current = null; // Clear stream if default couldn't be obtained
                 localVideoRef.current.srcObject = null;
                 setSelectedVideoDevice(null);
                 setIsCameraOff(true);
            }
       } catch (defaultError) {
        console.error(`[${new Date().toLocaleTimeString()}] Error switching back to default video device during fallback:`, defaultError);
            if (localStreamRef.current) {
          console.log(`[${new Date().toLocaleTimeString()}] Stopping video tracks during fallback failure.`);
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
    console.log(`[${new Date().toLocaleTimeString()}] Attempting to start screen share. isScreenSharing: ${isScreenSharing}, otherUserIsSharing: ${otherUserIsSharing}`);
    if (isScreenSharing || !peerConnectionRef.current) {
      console.warn(`[${new Date().toLocaleTimeString()}] Screen share aborted: Already sharing or PC not ready.`);
       return;
    }
    if (otherUserIsSharing) {
      setWarningMessage("Only one user can share screen at a time.");
      return;
    }

    try {
      console.log(`[${new Date().toLocaleTimeString()}] Requesting display media.`);
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
      console.log(`[${new Date().toLocaleTimeString()}] Finding video sender to replace with screen share track.`);
      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
        setIsScreenSharing(true);
        console.log('Started screen sharing');

        // Listen for screen share end (e.g., user clicks browser's stop sharing button)
        console.log(`[${new Date().toLocaleTimeString()}] Setting up screen share track 'onended' listener.`);
        screenTrack.onended = () => {
          stopScreenShare();
        };

        // Stop local video stream tracks if screen sharing starts
        if (localStreamRef.current) {
          console.log(`[${new Date().toLocaleTimeString()}] Stopping local video tracks for screen share.`);
           localStreamRef.current.getVideoTracks().forEach(track => track.stop());
        }

        // Emit signal that screen sharing has started
        console.log(`[${new Date().toLocaleTimeString()}] Emitting 'userStartedScreenShare' signal.`);
        sendSignal(currentCall.otherUser._id, { type: 'userStartedScreenShare' });
      }
    } catch (error) {
      console.error('Error starting screen sharing:', error);
    }
  };

  // Function to stop screen sharing
  const stopScreenShare = async () => {
    console.log(`[${new Date().toLocaleTimeString()}] Attempting to stop screen share. isScreenSharing: ${isScreenSharing}`);
    if (!isScreenSharing || !peerConnectionRef.current) {
      console.warn(`[${new Date().toLocaleTimeString()}] Stop screen share aborted: Not sharing or PC not ready.`);
       return;
    }

    // Stop the screen share track
    console.log(`[${new Date().toLocaleTimeString()}] Stopping screen share track.`);
    const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
    if (sender && sender.track) {
       sender.track.stop();
    }

    // Get user media again to switch back to camera
    try {
      console.log(`[${new Date().toLocaleTimeString()}] Requesting camera stream to switch back.`);
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        if(sender) {
        console.log(`[${new Date().toLocaleTimeString()}] Replacing track with camera track.`);
            await sender.replaceTrack(cameraTrack);
        }
        // Update local video ref to show camera feed again
      console.log(`[${new Date().toLocaleTimeString()}] Updating local video ref with camera stream.`);
        localVideoRef.current.srcObject = cameraStream;
        localStreamRef.current = cameraStream; // Update the local stream ref

        setIsScreenSharing(false);
        console.log('Stopped screen sharing and switched back to camera');

        // Emit signal that screen sharing has stopped
      console.log(`[${new Date().toLocaleTimeString()}] Emitting 'userStoppedScreenShare' signal.`);
        sendSignal(currentCall.otherUser._id, { type: 'userStoppedScreenShare' });

    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] Error switching back to camera after screen sharing:`, error);
        // If cannot get camera access again, just stop screen sharing and show nothing or a placeholder
         setIsScreenSharing(false);
         if (localStreamRef.current) {
         console.log(`[${new Date().toLocaleTimeString()}] Stopping local tracks due to camera switch failure.`);
           localStreamRef.current.getTracks().forEach(track => track.stop());
           localStreamRef.current = null;
           localVideoRef.current.srcObject = null;
         }

        // Emit signal that screen sharing has stopped even if switching back to camera failed
      console.log(`[${new Date().toLocaleTimeString()}] Emitting 'userStoppedScreenShare' signal (fallback).`);
        sendSignal(currentCall.otherUser._id, { type: 'userStoppedScreenShare' });
    }
  };

  useEffect(() => {
    // Clean up everything when currentCall changes or on unmount
    return () => {
      console.log(`[${new Date().toLocaleTimeString()}] --- Initiating Full Cleanup (useEffect) ---`);
      if (localStreamRef.current) {
        console.log(`[${new Date().toLocaleTimeString()}] Stopping local stream tracks during cleanup.`);
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`[${new Date().toLocaleTimeString()}] Stopped local track: ${track.kind} - ${track.id}`);
        });
        localStreamRef.current = null;
      } else {
        console.log(`[${new Date().toLocaleTimeString()}] localStreamRef.current was null during cleanup.`);
      }
      if (peerConnectionRef.current) {
        console.log(`[${new Date().toLocaleTimeString()}] Closing RTCPeerConnection during cleanup.`);
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.oniceconnectionstatechange = null; // Also nullify these
        peerConnectionRef.current.onsignalingstatechange = null; // Also nullify these
        peerConnectionRef.current.close();
        console.log(`[${new Date().toLocaleTimeString()}] RTCPeerConnection closed during cleanup.`);
        peerConnectionRef.current = null;
      } else {
        console.log(`[${new Date().toLocaleTimeString()}] peerConnectionRef.current was null during cleanup.`);
      }
      if (remoteVideoRef.current) {
        console.log(`[${new Date().toLocaleTimeString()}] Nulling remoteVideoRef.current.srcObject during cleanup.`);
        remoteVideoRef.current.srcObject = null;
      }
      if (localVideoRef.current) {
        console.log(`[${new Date().toLocaleTimeString()}] Nulling localVideoRef.current.srcObject during cleanup.`);
        localVideoRef.current.srcObject = null;
      }
      pendingCandidatesRef.current = [];
      console.log(`[${new Date().toLocaleTimeString()}] Pending ICE candidates cleared during cleanup.`);
      if (socket) {
        console.log(`[${new Date().toLocaleTimeString()}] Removing all 'returningSignal' listeners during cleanup.`);
        socket.off('returningSignal'); // Remove all listeners for this event
      } else {
        console.log(`[${new Date().toLocaleTimeString()}] Socket was null during cleanup, no listeners to remove.`);
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
      console.log('Cleaning up peer connection and streams'); // Original log
      console.log(`[${new Date().toLocaleTimeString()}] --- Full Cleanup Complete (useEffect) ---`);
    };
  }, [currentCall, socket]);

  useEffect(() => {
    if (!currentCall || !socket) {
      console.log(`[${new Date().toLocaleTimeString()}] WebRTC setup skipped: currentCall or socket is null. currentCall: ${currentCall ? 'present' : 'null'}, socket: ${socket ? 'present' : 'null'}`);
       return;
    }

    // Guard against multiple setup attempts due to rapid dependency changes
    if (callSetupActiveRef.current) {
      console.warn(`[${new Date().toLocaleTimeString()}] WebRTC setup already active. Skipping duplicate setup attempt.`);
      return;
    }
    callSetupActiveRef.current = true; // Mark setup as active

    let isMounted = true; // Flag to prevent state updates on unmounted component
    console.log(`[${new Date().toLocaleTimeString()}] --- Initiating WebRTC setup (useEffect) ---`);
    console.log(`[${new Date().toLocaleTimeString()}] currentCall at useEffect start:`, currentCall);

    // Get user media and set up peer connection
    const setupWebRTC = async () => {
      console.log(`[${new Date().toLocaleTimeString()}] Entering setupWebRTC function. currentCall:`, currentCall);
      // Ensure previous PC is truly closed before new one is created
      if (peerConnectionRef.current) {
        console.log(`[${new Date().toLocaleTimeString()}] Closing existing peer connection before new setup. PC state: ${peerConnectionRef.current.signalingState}, ICE state: ${peerConnectionRef.current.iceConnectionState}`);
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.oniceconnectionstatechange = null;
        peerConnectionRef.current.onsignalingstatechange = null;
        peerConnectionRef.current.close();
        peerConnectionRef.current = null; // Set to null immediately
        console.log(`[${new Date().toLocaleTimeString()}] peerConnectionRef nulled.`);
      }
      pendingCandidatesRef.current = []; // Clear pending candidates for new call
      console.log(`[${new Date().toLocaleTimeString()}] Pending ICE candidates cleared for new setup.`);

      if (!isMounted || !currentCall || !socket || !callSetupActiveRef.current) {
        console.log(`[${new Date().toLocaleTimeString()}] Aborting setupWebRTC: Component unmounted, currentCall changed, socket null, or setup no longer active during setup.`);
        callSetupActiveRef.current = false; // Ensure it's marked inactive
        return; // Re-check if component unmounted or call cancelled during delay
      }

      try {
        // 1. Get local media stream
        console.log(`[${new Date().toLocaleTimeString()}] Requesting local media stream (video: ${selectedVideoDevice || 'default'}, audio: ${selectedAudioDevice || 'default'}).`);
        const constraints = {
          video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(error => {
            console.error(`[${new Date().toLocaleTimeString()}] Error accessing media devices:`, error);
            throw error;
        });
        if (localVideoRef.current) { // Defensive check
          console.log(`[${new Date().toLocaleTimeString()}] Setting localVideoRef.current.srcObject.`);
        localVideoRef.current.srcObject = stream;
        }
        localStreamRef.current = stream;
        console.log(`[${new Date().toLocaleTimeString()}] Got local stream. ID: ${stream.id}.`);

        // 2. Create RTCPeerConnection (always new for each call)
        console.log(`[${new Date().toLocaleTimeString()}] Creating new RTCPeerConnection.`);
        peerConnectionRef.current = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
          ],
        });
        const peerConnection = peerConnectionRef.current;
        console.log(`[${new Date().toLocaleTimeString()}] New RTCPeerConnection created. Ref:`, peerConnectionRef.current);

        // Add local stream tracks to the peer connection
        console.log(`[${new Date().toLocaleTimeString()}] Adding local stream tracks to peer connection.`);
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
          console.log(`[${new Date().toLocaleTimeString()}] Added track: ${track.kind} - ${track.id}`);
        });

        // 3. Handle incoming tracks (remote stream)
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
          } else {
            console.log(`[${new Date().toLocaleTimeString()}] ICE gathering complete.`);
          }
        };

        // 5. Handle signaling (Offer/Answer)
        if (currentCall.isCaller) {
          console.log(`[${new Date().toLocaleTimeString()}] User is caller. Creating offer...`);
          const offer = await peerConnection.createOffer();
          console.log(`[${new Date().toLocaleTimeString()}] Setting local description (offer).`);
          await peerConnection.setLocalDescription(offer);
          console.log(`[${new Date().toLocaleTimeString()}] Sending offer signal to ${currentCall.otherUser._id}.`);
          sendSignal(currentCall.otherUser._id, { offer: offer });
        }

        peerConnection.oniceconnectionstatechange = () => {
          console.log(`[${new Date().toLocaleTimeString()}] ICE connection state changed:`, peerConnection.iceConnectionState);
          if (['disconnected', 'failed', 'closed'].includes(peerConnection.iceConnectionState)) {
            // Only hang up if currentCall is still active to avoid re-hanging up
            if (currentCall && peerConnectionRef.current === peerConnection) {
                console.warn(`[${new Date().toLocaleTimeString()}] Connection lost (${peerConnection.iceConnectionState}). Triggering hangup.`);
                setWarningMessage('Connection lost. Hanging up...');
                sendSignal(currentCall.otherUser._id, { type: 'reset' });
                setTimeout(() => {
                  hangUp();
                }, 1000);
            }
          }
        };
        peerConnection.onsignalingstatechange = () => {
          console.log(`[${new Date().toLocaleTimeString()}] Signaling state changed:`, peerConnection.signalingState);
        };
      } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Error setting up WebRTC:`, error);
        if (isMounted && callSetupActiveRef.current) { // Only set warning/hangup if setup was active
            setWarningMessage(`Call setup failed: ${error.name || error.message}. Please try again.`);
            // Ensure hangUp is called to reset SocketContext state if setup fails
            console.log(`[${new Date().toLocaleTimeString()}] Calling hangUp due to setup error.`);
            hangUp();
        }
        callSetupActiveRef.current = false; // Ensure it's marked inactive on error
      }
    };

    console.log(`[${new Date().toLocaleTimeString()}] Calling setupWebRTC function.`);
      setupWebRTC();

      const handleReturningSignal = async ({ signal }) => {
      console.log(`[${new Date().toLocaleTimeString()}] Receiving signaling data:`, signal);
      if (!peerConnectionRef.current || !callSetupActiveRef.current) {
        console.warn(`[${new Date().toLocaleTimeString()}] Received signal but peer connection is null or setup not active. Skipping. Signal:`, signal);
         return;
      }
      const pc = peerConnectionRef.current;
      console.log(`[${new Date().toLocaleTimeString()}] Current PC Signaling State: ${pc.signalingState}, ICE State: ${pc.iceConnectionState}`);
        try {
          if (signal.type === 'userStartedScreenShare') {
            setOtherUserIsSharing(true);
            setWarningMessage(null);
          console.log(`[${new Date().toLocaleTimeString()}] User started screen share signal received.`);
          } else if (signal.type === 'userStoppedScreenShare') {
            setOtherUserIsSharing(false);
          console.log(`[${new Date().toLocaleTimeString()}] User stopped screen share signal received.`);
          } else if (signal.offer) {
          if (pc.signalingState === 'stable') {
            console.log(`[${new Date().toLocaleTimeString()}] Setting remote offer...`);
            await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
            console.log(`[${new Date().toLocaleTimeString()}] Remote offer set. Creating answer.`);
            const answer = await pc.createAnswer();
            console.log(`[${new Date().toLocaleTimeString()}] Setting local description (answer).`);
            await pc.setLocalDescription(answer);
            console.log(`[${new Date().toLocaleTimeString()}] Sending answer signal.`);
            sendSignal(currentCall.otherUser._id, { answer: answer });
            while (pendingCandidatesRef.current.length > 0) {
              const candidate = pendingCandidatesRef.current.shift();
              console.log(`[${new Date().toLocaleTimeString()}] Adding pending ICE candidate after offer:`, candidate);
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            console.log(`[${new Date().toLocaleTimeString()}] All pending ICE candidates added after offer.`);
          } else {
            console.warn(`[${new Date().toLocaleTimeString()}] Ignoring offer: not in stable state. Current state:`, pc.signalingState, '. Sending reset signal.');
            if (currentCall) { // Only send reset if there's an active call context
                sendSignal(currentCall.otherUser._id, { type: 'reset' });
            }
          }
          } else if (signal.answer) {
          if (pc.signalingState === 'have-local-offer') {
            console.log(`[${new Date().toLocaleTimeString()}] Setting remote answer...`);
            await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
            while (pendingCandidatesRef.current.length > 0) {
              const candidate = pendingCandidatesRef.current.shift();
              console.log(`[${new Date().toLocaleTimeString()}] Adding pending ICE candidate after answer:`, candidate);
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            console.log(`[${new Date().toLocaleTimeString()}] All pending ICE candidates added after answer.`);
          } else {
            console.warn(`[${new Date().toLocaleTimeString()}] Ignoring answer: not in have-local-offer state. Current state:`, pc.signalingState);
          }
          } else if (signal.ice) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            console.log(`[${new Date().toLocaleTimeString()}] Adding ICE candidate:`, signal.ice);
            await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
          } else {
            console.log(`[${new Date().toLocaleTimeString()}] Pushing ICE candidate to pending queue:`, signal.ice);
            pendingCandidatesRef.current.push(signal.ice);
          }
        } else if (signal.type === 'reset') {
          console.log(`[${new Date().toLocaleTimeString()}] Received reset signal. Initiating hangup and displaying warning.`);
          // Clean up and reset state
          hangUp(); // This will trigger the useEffect cleanup
          setWarningMessage('Call was reset due to a signaling error. Please try again.');
          }
        } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Error handling incoming signal:`, error);
        // If signal handling fails, attempt to reset the call as it's likely in a bad state.
        if (currentCall) {
           console.log(`[${new Date().toLocaleTimeString()}] Sending reset signal due to signal handling error.`);
            sendSignal(currentCall.otherUser._id, { type: 'reset' });
        }
        console.log(`[${new Date().toLocaleTimeString()}] Calling hangUp due to signal handling error.`);
        hangUp();
        setWarningMessage(`Call error: ${error.name || error.message}. Call reset.`);
        }
      };
    console.log(`[${new Date().toLocaleTimeString()}] Setting up 'returningSignal' listener.`);
    socket.off('returningSignal', handleReturningSignal); // Ensure no old listeners
      socket.on('returningSignal', handleReturningSignal);

    // Cleanup for this specific useEffect (important for re-renders and unmount)
      return () => {
      console.log(`[${new Date().toLocaleTimeString()}] Cleanup for setupWebRTC useEffect: removing specific returningSignal listener.`);
       isMounted = false; // Mark component as unmounted
       callSetupActiveRef.current = false; // Mark setup as inactive on cleanup
       socket.off('returningSignal', handleReturningSignal); // Ensure removed on unmount or re-run
      };
  }, [currentCall, socket, selectedAudioDevice, selectedVideoDevice, hangUp, sendSignal]); // Add hangUp and sendSignal to dependencies if they are not stable functions

  // Effect to enumerate devices on mount
  useEffect(() => {
    console.log(`[${new Date().toLocaleTimeString()}] Running device enumeration useEffect.`);
    enumerateMediaDevices();
    // Request media permissions to ensure device labels are available
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      console.log(`[${new Date().toLocaleTimeString()}] Got initial media permissions for enumeration.`);
      stream.getTracks().forEach(track => track.stop()); // Stop tracks immediately after getting permission
      enumerateMediaDevices(); // Enumerate again after getting permissions
    }).catch(error => {
      console.warn(`[${new Date().toLocaleTimeString()}] Could not get media permissions for initial enumeration:`, error);
      // Continue with enumeration even without permissions (device labels might be empty)
      enumerateMediaDevices();
    });
  }, []); // Run only on mount

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