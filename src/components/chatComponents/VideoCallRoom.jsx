import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { HiOutlinePhoneMissedCall } from 'react-icons/hi';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FiChevronUp } from 'react-icons/fi';
import { LuScreenShare } from 'react-icons/lu';
import { FaStopCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { showGlobalToast } from '../Toast';

export const VideoCallRoom = ({ currentCall, hangUp }) => {
  const { user } = useAuth();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const savedCameraTrackRef = useRef(null);
  const displayAudioSenderRef = useRef(null);
  // Gain nodes for user volume control when mixing
  const micGainRef = useRef(null);
  const dispGainRef = useRef(null);
  // WebAudio mixing refs for combining mic + display audio
  const audioContextRef = useRef(null);
  const micSourceRef = useRef(null);
  const displaySourceRef = useRef(null);
  const mixedDestinationRef = useRef(null);
  const mixedAudioTrackRef = useRef(null);
  const mixedSenderRef = useRef(null);
  const offlineHandlerRef = useRef(null);
  const cleanupTimeoutRef = useRef(null);
  const heartbeatRef = useRef(null);
  const [status, setStatus] = useState('initializing');

  // Local/Remote media status
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [isLocalVideoHidden, setIsLocalVideoHidden] = useState(false);

  // Local video position (snap to one of: top, bottom, left, right)
  const [localVideoPosition, setLocalVideoPosition] = useState('bottom-right');
  const dragStartRef = useRef(null);

  // Re-attach local stream to video element when unhidden (fix blank local video)
  useEffect(() => {
    if (!isLocalVideoHidden && localVideoRef.current && localStreamRef.current) {
      try {
        localVideoRef.current.srcObject = localStreamRef.current;
      } catch (e) {}
    }
  }, [isLocalVideoHidden]);

  // AV control and devices
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [showAudioDevices, setShowAudioDevices] = useState(false);
  const [showVideoDevices, setShowVideoDevices] = useState(false);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState(null);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState(null);

  // Screen share state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [otherUserSharing, setOtherUserSharing] = useState(false);
  const [warning, setWarning] = useState(null);
  const [showVolumeControls, setShowVolumeControls] = useState(false);
  const [micVolume, setMicVolume] = useState(1);
  const [displayVolume, setDisplayVolume] = useState(1);

  // Auto-hide warning
  useEffect(() => {
    if (!warning) return;
    const t = setTimeout(() => setWarning(null), 3000);
    return () => clearTimeout(t);
  }, [warning]);

  // Controls auto-hide and duration
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef(null);
  const startTimeRef = useRef(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Build deterministic roomId from participant IDs
  const roomId = (() => {
    const me = user?._id || 'me';
    const other = currentCall?.otherUser?._id || 'peer';
    return [me, other].sort().join('_');
  })();

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioIns = devices.filter(d => d.kind === 'audioinput');
      const videoIns = devices.filter(d => d.kind === 'videoinput');
      // sanitize labels and dedupe by deviceId and label to avoid showing duplicates like "Default - ..."
      
      const dedupedAudio = audioIns
        .map(d => {
        
          // guard against missing deviceId (some browsers/devices may not expose it)
          const idPreview = d.deviceId ? String(d.deviceId).slice(0, 6) : Math.random().toString(36).slice(2, 8);
          const labelRaw = d.label || `Mic ${idPreview}`;
          const _label = String(labelRaw).replace(/^Default - /i, '').replace(/^Communications - /i, '').trim();
          return { ...d, deviceId:d.deviceId,  _label };
        })
        .filter(d => {
        //can do more general
          if (d.deviceId.includes("default") ||d.deviceId.includes("communications")) return false; // skip default devices
          return true 
        });
     

      const normalizedAudio = dedupedAudio.map(d => ({ deviceId: d.deviceId || '', label: d._label }));
      setAudioDevices(normalizedAudio);

      setVideoDevices(videoIns);

      // try to infer selected devices from active tracks if not already selected
      try {
        const activeAudioTrack = localStreamRef.current?.getAudioTracks()[0] || null;
        if (activeAudioTrack) {
          const settingsId = (activeAudioTrack.getSettings && activeAudioTrack.getSettings().deviceId) || null;
          if (settingsId) setSelectedAudioDevice(prev => prev || settingsId);
          else {
            const match = normalizedAudio.find(a => a.label === activeAudioTrack.label);
            if (match) setSelectedAudioDevice(prev => prev || match.deviceId || '');
          }
        }
      } catch (err) {}

      try {
        const activeVideoTrack = localStreamRef.current?.getVideoTracks()[0] || null;
        if (activeVideoTrack) {
          const settingsIdV = (activeVideoTrack.getSettings && activeVideoTrack.getSettings().deviceId) || null;
          if (settingsIdV) setSelectedVideoDevice(prev => prev || settingsIdV);
          else {
            const matchV = videoIns.find(v => v.label === activeVideoTrack.label);
            if (matchV) setSelectedVideoDevice(prev => prev || matchV.deviceId || '');
          }
        }
      } catch (err) {}


    } catch (e) {
      // ignore
    }
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  try { if (socketRef.current) socketRef.current.emit('local-status', { roomId, muted: !track.enabled, cameraOff: isCameraOff }); } catch {}
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsCameraOff(!track.enabled);
  try { if (socketRef.current) socketRef.current.emit('local-status', { roomId, muted: isMuted, cameraOff: !track.enabled }); } catch {}
  };

  const switchAudioDevice = async (deviceId) => {
    if (!pcRef.current || !localStreamRef.current) return;
    try {
      const current = localStreamRef.current;
      const oldAudio = current.getAudioTracks()[0] || null;
      const newStream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } }, video: false });
      const newAudioTrack = newStream.getAudioTracks()[0];

      // If screen sharing is active, we may be mixing display audio with mic via AudioContext
      if (isScreenSharing) {
        // If we used WebAudio mixing (mixedDestinationRef exists), replace the mic source node instead of replacing the pc audio sender
        if (mixedDestinationRef.current && audioContextRef.current) {
          try {
            // stop old mic source if present
            if (micSourceRef.current) {
              try { micSourceRef.current.disconnect(); } catch {}
              micSourceRef.current = null;
            }

            // create new mic source from the new track and connect to micGain -> destination
            const micStreamForNode = new MediaStream();
            micStreamForNode.addTrack(newAudioTrack);
            const micSrc = audioContextRef.current.createMediaStreamSource(micStreamForNode);
            micSourceRef.current = micSrc;
            if (!micGainRef.current) micGainRef.current = audioContextRef.current.createGain();
            micGainRef.current.gain.value = micVolume;
            micSrc.connect(micGainRef.current);
            micGainRef.current.connect(mixedDestinationRef.current);

            // update local stream to carry the new mic track (keep screen video track)
            const videoTrack = current.getVideoTracks()[0];
            const merged = new MediaStream();
            if (videoTrack) merged.addTrack(videoTrack);
            merged.addTrack(newAudioTrack);
            localStreamRef.current = merged;
            if (localVideoRef.current) localVideoRef.current.srcObject = merged;

            // stop old audio track
            if (oldAudio) try { oldAudio.stop(); } catch {}

            setSelectedAudioDevice(deviceId);
            setIsMuted(!newAudioTrack.enabled);
            return;
          } catch (err) {
            // fallback to replacing sender below
          }
        }

        // If display audio was forwarded as a separate sender, find the mic sender (not the display sender) and replace only that
        if (displayAudioSenderRef.current) {
          try {
            const audioSenders = pcRef.current.getSenders().filter(s => s.track && s.track.kind === 'audio');
            const micSender = audioSenders.find(s => s !== displayAudioSenderRef.current) || audioSenders[0];
            if (micSender && newAudioTrack) {
              await micSender.replaceTrack(newAudioTrack);
              const videoTrack = current.getVideoTracks()[0];
              const merged = new MediaStream();
              merged.addTrack(newAudioTrack);
              if (videoTrack) merged.addTrack(videoTrack);
              localStreamRef.current = merged;
              if (localVideoRef.current) localVideoRef.current.srcObject = merged;
              if (oldAudio) try { oldAudio.stop(); } catch {}
              setSelectedAudioDevice(deviceId);
              setIsMuted(!newAudioTrack.enabled);
            }
            return;
          } catch (err) {
            // fallback to replacing first audio sender
          }
        }
      }

      // Default behavior (no screen share or fallbacks): replace the primary audio sender
      const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'audio');
      if (sender && newAudioTrack) {
        await sender.replaceTrack(newAudioTrack);
        const videoTrack = current.getVideoTracks()[0];
        const merged = new MediaStream();
        merged.addTrack(newAudioTrack);
        if (videoTrack) merged.addTrack(videoTrack);
        localStreamRef.current = merged;
        if (localVideoRef.current) localVideoRef.current.srcObject = merged;
        if (oldAudio) try { oldAudio.stop(); } catch {}
        setSelectedAudioDevice(deviceId);
        setIsMuted(!newAudioTrack.enabled);
      }
    } catch (e) {
      // ignore
    }
  };

  const switchVideoDevice = async (deviceId) => {
    if (!pcRef.current || !localStreamRef.current || isScreenSharing) {
      if (isScreenSharing) setWarning('Stop screen sharing before switching camera.');
      return;
    }
    try {
      const current = localStreamRef.current;
      const oldVideo = current.getVideoTracks()[0] || null;
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: false });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender && newVideoTrack) {
        await sender.replaceTrack(newVideoTrack);
        const audioTrack = current.getAudioTracks()[0];
        const merged = new MediaStream();
        merged.addTrack(newVideoTrack);
        if (audioTrack) merged.addTrack(audioTrack);
        localStreamRef.current = merged;
        if (localVideoRef.current) localVideoRef.current.srcObject = merged;
        if (oldVideo) try { oldVideo.stop(); } catch {}
        setSelectedVideoDevice(deviceId);
        setIsCameraOff(!newVideoTrack.enabled);
      }
    } catch (e) {
      // ignore
    }
  };

  const startScreenShare = async () => {
    if (!pcRef.current || !localStreamRef.current) return;
    if (otherUserSharing) {
      setWarning('Only one user can share the screen at a time.');
      return;
    }
    if (isScreenSharing) return;
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true,surfaceSwitching: "include", });
      const screenTrack = displayStream.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender && screenTrack) {
        // Save camera track to restore later
        const currentVideo = localStreamRef.current.getVideoTracks()[0] || null;
        savedCameraTrackRef.current = currentVideo || savedCameraTrackRef.current;
        await sender.replaceTrack(screenTrack);
        const micTrack = localStreamRef.current.getAudioTracks()[0] || null;
        const merged = new MediaStream();
        merged.addTrack(screenTrack);
        if (micTrack) merged.addTrack(micTrack);
        localStreamRef.current = merged;
        if (localVideoRef.current) localVideoRef.current.srcObject = merged;

  // If display stream includes audio, mix it with mic audio and send the mixed track
  const displayAudio = displayStream.getAudioTracks()[0] || null;
  const currentMicTrack = localStreamRef.current.getAudioTracks()[0] || null;
  if (displayAudio && currentMicTrack) {
          try {
            // create or reuse AudioContext
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = audioContextRef.current || new AudioCtx();
            audioContextRef.current = ctx;

            // create source nodes
            // mic source: create a small MediaStream containing micTrack
            const micStreamForNode = new MediaStream();
            micStreamForNode.addTrack(currentMicTrack);
            const micSrc = ctx.createMediaStreamSource(micStreamForNode);
            micSourceRef.current = micSrc;

            // display source from displayStream
            const dispSrc = ctx.createMediaStreamSource(new MediaStream([displayAudio]));
            displaySourceRef.current = dispSrc;

            // destination to capture mixed audio
            const dest = ctx.createMediaStreamDestination();
            mixedDestinationRef.current = dest;

            // create gain nodes for volume control
            const micGain = ctx.createGain();
            const dispGain = ctx.createGain();
            micGain.gain.value = micVolume;
            dispGain.gain.value = displayVolume;
            micGainRef.current = micGain;
            dispGainRef.current = dispGain;

            // connect sources -> gains -> destination
            micSrc.connect(micGain);
            micGain.connect(dest);
            dispSrc.connect(dispGain);
            dispGain.connect(dest);

            // get mixed audio track
            const mixedTrack = dest.stream.getAudioTracks()[0];
            mixedAudioTrackRef.current = mixedTrack;

            // replace existing audio sender's track with mixed track (or add if none)
            const audioSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'audio');
            if (audioSender) {
              await audioSender.replaceTrack(mixedTrack);
              mixedSenderRef.current = audioSender;
            } else {
              mixedSenderRef.current = pcRef.current.addTrack(mixedTrack, dest.stream);
            }
          } catch (e) {
            // fallback: if mixing fails, try to add display audio as separate sender
            try {
              displayAudioSenderRef.current = pcRef.current.addTrack(displayAudio, displayStream);
            } catch (err) {}
          }
        } else if (displayAudio) {
          // no mic available — just forward display audio
          try {
            displayAudioSenderRef.current = pcRef.current.addTrack(displayAudio, displayStream);
          } catch (err) {}
        }

        setIsScreenSharing(true);
        if (socketRef.current) socketRef.current.emit('screen-start', { roomId });
        screenTrack.onended = () => stopScreenShare();
       
      }
     
    } catch (e) {
      // user cancelled or error
     
    }
  };

  const stopScreenShare = async () => {
    if (!pcRef.current || !localStreamRef.current) return;
    const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
    try {
      if (savedCameraTrackRef.current && sender) {
        await sender.replaceTrack(savedCameraTrackRef.current);
        const audioTrack = localStreamRef.current.getAudioTracks()[0] || null;
        const merged = new MediaStream();
        merged.addTrack(savedCameraTrackRef.current);
        if (audioTrack) merged.addTrack(audioTrack);
        localStreamRef.current = merged;
        if (localVideoRef.current) localVideoRef.current.srcObject = merged;
      } else {
        // Re-acquire camera if not saved
        const cam = await navigator.mediaDevices.getUserMedia({ video: true, audio: !!localStreamRef.current.getAudioTracks().length });
        const camTrack = cam.getVideoTracks()[0];
        if (sender) await sender.replaceTrack(camTrack);
        const audioTrack = localStreamRef.current.getAudioTracks()[0] || null;
        const merged = new MediaStream();
        merged.addTrack(camTrack);
        if (audioTrack) merged.addTrack(audioTrack);
        localStreamRef.current = merged;
        if (localVideoRef.current) localVideoRef.current.srcObject = merged;
      }
    } catch {}
    setIsScreenSharing(false);
    // restore audio sender back to microphone if we mixed
    try {
      const micTrack = localStreamRef.current.getAudioTracks()[0] || null;
      if (mixedSenderRef.current && micTrack) {
        await mixedSenderRef.current.replaceTrack(micTrack);
      }
    } catch (e) {}

    // cleanup webaudio resources
    try {
      if (mixedAudioTrackRef.current) {
        try { mixedAudioTrackRef.current.stop(); } catch {}
        mixedAudioTrackRef.current = null;
      }
      if (micSourceRef.current) {
        try { micSourceRef.current.disconnect(); } catch {}
        micSourceRef.current = null;
      }
      if (displaySourceRef.current) {
        try { displaySourceRef.current.disconnect(); } catch {}
        displaySourceRef.current = null;
      }
      if (micGainRef.current) {
        try { micGainRef.current.disconnect(); } catch {}
        micGainRef.current = null;
      }
      if (dispGainRef.current) {
        try { dispGainRef.current.disconnect(); } catch {}
        dispGainRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch {}
        audioContextRef.current = null;
      }
      mixedDestinationRef.current = null;
      mixedSenderRef.current = null;
      if (displayAudioSenderRef.current) {
        try { pcRef.current.removeTrack(displayAudioSenderRef.current); } catch {}
        displayAudioSenderRef.current = null;
      }
    } catch (e) {}

    if (socketRef.current) socketRef.current.emit('screen-stop', { roomId });
  };

  // Duration timer
  useEffect(() => {
    let intervalId = null;
    if (status === 'connected') {
      startTimeRef.current = Date.now();
      setElapsedSec(0);
      intervalId = setInterval(() => {
        const diff = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSec(diff);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status]);

  // Controls auto-hide
  const scheduleHideControls = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 4000);
  };
  const handleMouseMove = () => {
    if (!showControls) setShowControls(true);
    scheduleHideControls();
  };

  useEffect(() => {
    // show controls initially then auto-hide
    setShowControls(true);
    scheduleHideControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

  const cleanup = () => {
      try {
        if (pcRef.current) {
          pcRef.current.ontrack = null;
          pcRef.current.onicecandidate = null;
          pcRef.current.oniceconnectionstatechange = null;
          pcRef.current.onconnectionstatechange = null;
          pcRef.current.close();
          pcRef.current = null;
        }
      } catch {}
      try {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop());
          localStreamRef.current = null;
        }
      } catch {}
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      try {
        if (socketRef.current) {
          socketRef.current.off('peer-screen-started');
          socketRef.current.off('peer-screen-stopped');
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      } catch {}
      try {
        // remove offline handler if set
        if (offlineHandlerRef.current) {
          try { window.removeEventListener('offline', offlineHandlerRef.current); } catch {}
          offlineHandlerRef.current = null;
        }
      } catch {}
  try { if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; } } catch {}
  try { if (cleanupTimeoutRef.current) { clearTimeout(cleanupTimeoutRef.current); cleanupTimeoutRef.current = null; } } catch {}
      setIsMuted(false);
      setIsCameraOff(false);
      setSelectedAudioDevice(null);
      setSelectedVideoDevice(null);
      setShowAudioDevices(false);
      setShowVideoDevices(false);
      setIsScreenSharing(false);
      setOtherUserSharing(false);
      setWarning(null);
    };

    const start = async () => {
      try {
        // 1) Connect signaling namespace
        socketRef.current = io(`${process.env.REACT_APP_SOCKET_URL}/webrtc`, {
          withCredentials: true,
          transports: ['websocket']
        });
        const sock = socketRef.current;

  // react to peer screen-share state
  sock.on('peer-screen-started', () => setOtherUserSharing(true));
  sock.on('peer-screen-stopped', () => setOtherUserSharing(false));
  // peer mic/camera status
  sock.on('peer-muted', ({ muted }) => setRemoteMuted(!!muted));
  sock.on('peer-camera-off', ({ cameraOff }) => setRemoteCameraOff(!!cameraOff));

  // peer network loss (server forwards when a peer disconnects)
  sock.on('peer-network-lost', ({ reason } = {}) => {
    try { if (showGlobalToast) showGlobalToast('Peer network lost', 'warning'); } catch {}
    setStatus('failed');
    try { if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current); } catch {}
    try { if (heartbeatRef.current) clearInterval(heartbeatRef.current); } catch {}
    cleanupTimeoutRef.current = null;
    try { cleanup(); } catch {}
    if (hangUp) hangUp();
  });

        // 2) Capture media
        const baseConstraints = {
          video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true
        };
        const stream = await navigator.mediaDevices.getUserMedia(baseConstraints);
        if (!isMounted) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        await enumerateDevices();

        // 3) Get ICE servers (Twilio Network Traversal)
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/webrtc/ice-servers`, {
          credentials: 'include',
        
        });

        // const res = await fetch(`${process.env.REACT_APP_API_URL}/api/webrtc/ice-servers`, {
        //   credentials: 'include',
        //   headers: { 'ngrok-skip-browser-warning': 'any' }
        // });

        if (!res.ok) throw new Error('ICE fetch failed');
        const { iceServers } = await res.json();
        if (!iceServers?.length) throw new Error('No ICE servers');

        // 4) Peer connection
        pcRef.current = new RTCPeerConnection({ iceServers, iceCandidatePoolSize: 10 });
        const pc = pcRef.current;
        // if pc connection fails or disconnects, end call immediately
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setStatus('connected');
            // start heartbeat to detect navigator.onLine loss on mobile
            try { if (heartbeatRef.current) clearInterval(heartbeatRef.current); } catch {}
            try {
              heartbeatRef.current = setInterval(() => {
                try {
                  if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    // call offline handler directly
                    try { if (offlineHandlerRef.current) offlineHandlerRef.current(); } catch {}
                  }
                } catch {}
              }, 1000);
            } catch {}
            return;
          }
          if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
            setStatus('failed');
            try { if (showGlobalToast) showGlobalToast('Connection lost', 'warning'); } catch {}
            try { if (socketRef.current) socketRef.current.emit('leave', { roomId }); } catch {}
            // immediate cleanup + hangup
            try { if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current); } catch {}
            try { if (heartbeatRef.current) clearInterval(heartbeatRef.current); } catch {}
            cleanupTimeoutRef.current = null;
            try { cleanup(); } catch {}
            if (hangUp) hangUp();
          }
        };

        stream.getTracks().forEach(t => pc.addTrack(t, stream));

        pc.ontrack = (e) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        };
        pc.onicecandidate = (e) => {
          if (e.candidate) {
            sock.emit('ice-candidate', { roomId, candidate: e.candidate });
          }
        };
  // ICE candidate handling remains

  // 5) Signaling
        sock.on('ready', async () => {
          if (currentCall?.isCaller && pc.signalingState === 'stable') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sock.emit('offer', { roomId, description: offer });
            setStatus('calling');
          }
        });

        sock.on('offer', async ({ description }) => {
          if (pc.signalingState !== 'stable') return;
          await pc.setRemoteDescription(new RTCSessionDescription(description));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sock.emit('answer', { roomId, description: answer });
          setStatus('connecting');
        });

        sock.on('answer', async ({ description }) => {
          if (pc.signalingState !== 'have-local-offer') return;
          await pc.setRemoteDescription(new RTCSessionDescription(description));
          setStatus('connecting');
        });

        sock.on('ice-candidate', async ({ candidate }) => {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {}
        });

        sock.on('peer-left', () => {
          setStatus('ended');
         
          // show peer-left briefly then cleanup
          try { if (showGlobalToast) showGlobalToast('Peer left the call', 'info'); } catch {}
          try { if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current); } catch {}
          try { if (heartbeatRef.current) clearInterval(heartbeatRef.current); } catch {}
          cleanupTimeoutRef.current = null;
          try { cleanup(); } catch {}
          if (hangUp) hangUp();
        });

        // if socket disconnects unexpectedly, treat as network loss and end call immediately
        sock.on('disconnect', (reason) => {
          // only act if not intentionally leaving
          if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
            try { if (showGlobalToast) showGlobalToast('Connection lost', 'warning'); } catch {}
            setStatus('failed');}
          try { if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current); } catch {}
          try { if (heartbeatRef.current) clearInterval(heartbeatRef.current); } catch {}
          cleanupTimeoutRef.current = null;
          try { cleanup(); } catch {}
          if (hangUp) hangUp();
        });

        // window offline event
        const offlineHandler = () => {
          try { if (showGlobalToast) showGlobalToast('Network offline', 'warning'); } catch {}
          setStatus('failed');
          try { if (socketRef.current) socketRef.current.emit('leave', { roomId }); } catch {}
          try { if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current); } catch {}
          try { if (heartbeatRef.current) clearInterval(heartbeatRef.current); } catch {}
          cleanupTimeoutRef.current = null;
          try { cleanup(); } catch {}
          if (hangUp) hangUp();
        };
        offlineHandlerRef.current = offlineHandler;
        try { window.addEventListener('offline', offlineHandler); } catch {}

  // 6) Join room
  sock.emit('join', { roomId });
  // announce local mic/camera status after joining
  try { sock.emit('local-status', { roomId, muted: isMuted, cameraOff: isCameraOff }); } catch {}
  setStatus('ready');
      } catch (err) {
        setStatus('failed');
      }
    };

    start();
    return () => {
      isMounted = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, currentCall?.isCaller, hangUp]);

  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const ss = String(elapsedSec % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 text-white bg-gradient-to-br from-slate-950 via-zinc-900 to-black flex flex-col justify-between md:justify-center md:items-center p-2 md:p-4 z-50" onMouseMove={handleMouseMove}>
     
      {warning && (
        <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none z-50">
          <div className="w-full max-w-3xl mx-2">
            <div className="px-3 py-2 rounded-xl bg-black text-yellow-200 ring-1 ring-yellow-400/30 text-center">
              {warning}
            </div>
          </div>
        </div>
      )}

      {/* Unified top header (same on mobile and desktop) */}
      <div className="w-full max-w-full mb-2">
        <div className="absolute top-2 left-0 right-0 flex items-center justify-between px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md ring-1 ring-white/15 z-20 pointer-events-auto mx-2">
          <div className="flex items-center gap-2">
            {currentCall?.otherUser?.avatar && (
              <img src={currentCall?.otherUser.avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
            )}
            <div className="leading-tight">
              <div className="text-sm font-semibold">
                {currentCall?.otherUser?.fullName || currentCall?.otherUser?.username || 'Connecting...'}
              </div>
              <div className="text-xs text-white/80 capitalize">{status}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status === 'connected' && (
              <div className="px-2.5 py-1 rounded-full bg-white/10 ring-1 ring-white/15 text-[11px] font-mono">{mm}:{ss}</div>
            )}
            <span className={`h-2.5 w-2.5 rounded-full ${status==='connected' ? 'bg-emerald-400' : status==='failed' ? 'bg-red-500' : 'bg-yellow-400'} animate-pulse`} />
          </div>
        </div>
      </div>

      {/* Video container wrapper (centers on mobile) */}
      <div className="flex-1 w-full flex items-center justify-center ">
        <div className="relative w-full max-w-full md:max-w-6xl aspect-video rounded-xl md:rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black/30 backdrop-blur-xl self-center">

      

          {/* Remote video with overlays for remote status */}
          <div className="absolute inset-0 w-full h-full">
            <video ref={remoteVideoRef} autoPlay playsInline className={`absolute inset-0 w-full h-full object-cover bg-black`} />
            {/* remote mic status (top-left) */}
            <div className="absolute top-2 left-2 z-30">
              {remoteMuted ? <FaMicrophoneSlash className="text-red-500" size={18} /> : <FaMicrophone className="text-emerald-400" size={18} />}
            </div>
            {/* if remote camera is off, show a large centered camera-off indicator */}
            {remoteCameraOff && !otherUserSharing && !isScreenSharing && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="flex flex-col items-center gap-2  px-6 py-4 rounded-lg">
                  <FaVideoSlash className="text-red-500" size={54} />
                  <div className="text-white/90 text-sm">Camera is off</div>
                </div>
              </div>
            )}
          </div>

          {/* Local video */}
          {!isLocalVideoHidden && (
            <div
              className={`absolute ${localVideoPosition.includes('bottom') ? 'bottom-2 md:bottom-4' : 'top-2 md:top-4'} ${localVideoPosition.includes('right') ? 'right-2 md:right-4' : 'left-2 md:left-4'} touch-none`}
              draggable
              onDragStart={(e) => { dragStartRef.current = { x: e.clientX, y: e.clientY }; }}
              onDragEnd={(e) => {
                try {
                  const dx = e.clientX - (dragStartRef.current?.x || 0);
                  const dy = e.clientY - (dragStartRef.current?.y || 0);
                  // decide snap based on direction
                  if (Math.abs(dx) > Math.abs(dy)) {
                    // horizontal move
                    setLocalVideoPosition(dx > 0 ? 'bottom-right' : 'bottom-left');
                  } else {
                    // vertical move
                    setLocalVideoPosition(dy > 0 ? 'bottom-right' : 'top-right');
                  }
                } catch {}
              }}
            >
              <div className="relative">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-28 h-20 sm:w-36 sm:h-28 md:w-44 md:h-32 rounded-lg md:rounded-xl border border-white/20 shadow-lg object-cover z-100" />
                <div className="absolute top-1 left-1 flex gap-1">
                  <div title={isMuted ? 'You muted' : 'You unmuted'}>
                    {isMuted ? <FaMicrophoneSlash className="text-red-500" size={12} /> : <FaMicrophone className="text-emerald-400" size={12} />}
                  </div>
                  <div title={isCameraOff ? 'Camera off' : 'Camera on'}>
                    {isCameraOff ? <FaVideoSlash className="text-red-500" size={12} /> : <FaVideo className="text-emerald-400" size={12} />}
                  </div>
                </div>
                <button
                  className="absolute top-1 right-1 bg-black/50 px-2 py-1 rounded text-xs flex items-center"
                  onClick={() => setIsLocalVideoHidden(true)}
                  title="Hide local video"
                >
                  <FaEyeSlash size={12} />
                </button>
              </div>
            </div>
          )}
          {isLocalVideoHidden && (
            <div className={`absolute ${localVideoPosition.includes('bottom') ? 'bottom-2 md:bottom-4' : 'top-2 md:top-4'} ${localVideoPosition.includes('right') ? 'right-2 md:right-4' : 'left-2 md:left-4'} `}>
              <button className="bg-black/50 px-2 py-1 rounded text-xs flex items-center" onClick={() => setIsLocalVideoHidden(false)} title="Show local video"><FaEye size={14} /></button>
            </div>
          )}

          {/* Desktop overlay controls */}
          <div className={`hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 items-center gap-2 px-4 py-3 rounded-full bg-white/10 backdrop-blur-xl ring-1 ring-white/20 shadow-xl transition-opacity ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Mic toggle */}
            <button
              className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-800/70 hover:bg-zinc-700'}`}
              onClick={toggleMute}
              title="Toggle microphone"
            >
              {isMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone className="text-emerald-400" size={18} />}
            </button>
            {/* Mic device dropdown */}
            <div className="relative ">
              <button
                className="h-11 w-11 rounded-full flex items-center justify-center bg-zinc-800/70 hover:bg-zinc-700"
                onClick={() => setShowAudioDevices(v => !v)}
                title="Select microphone"
              >
                <FiChevronUp size={16} />
              </button>
     
              {showAudioDevices && (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-white/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-auto min-w-[14rem]">
                  {audioDevices.map(d => (
                    <div
                      key={d.deviceId}
                      onClick={() => { setShowAudioDevices(false); switchAudioDevice(d.deviceId); }}
                      className={`px-4 py-2.5 text-sm hover:bg-white/10 cursor-pointer ${selectedAudioDevice === d.deviceId ? 'bg-white/10' : ''}`}
                    >
                      {d.label || `Mic ${d.deviceId.slice(0,6)}`}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Camera toggle */}
            <button
              className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors ${isCameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-800/70 hover:bg-zinc-700'}`}
              onClick={toggleCamera}
              title="Toggle camera"
            >
              {isCameraOff ? <FaVideoSlash size={18} /> : <FaVideo className="text-emerald-400" size={18} />}
            </button>
            {/* Camera device dropdown */}
            <div className="relative">
              <button
                className="h-11 w-11 rounded-full flex items-center justify-center bg-zinc-800/70 hover:bg-zinc-700"
                onClick={() => setShowVideoDevices(v => !v)}
                title="Select camera"
              >
                <FiChevronUp size={16} />
              </button>
              {showVideoDevices && (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-white/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-auto min-w-[14rem]">
                  {videoDevices.map(d => (
                    <div
                      key={d.deviceId}
                      onClick={() => { setShowVideoDevices(false); switchVideoDevice(d.deviceId); }}
                      className={`px-4 py-2.5 text-sm hover:bg-white/10 cursor-pointer ${selectedVideoDevice === d.deviceId ? 'bg-white/10' : ''}`}
                    >
                      {d.label || `Cam ${d.deviceId.slice(0,6)}`}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Screen share */}
            {!isScreenSharing ? (
              <button
                className="h-11 w-11 rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700"
                onClick={startScreenShare}
                title="Start screen share"
              >
                <LuScreenShare size={18} />
              </button>
            ) : (
              <button
                className="h-11 w-11 rounded-full flex items-center justify-center bg-orange-600 hover:bg-orange-700"
                onClick={stopScreenShare}
                title="Stop screen share"
              >
                <FaStopCircle size={20} />
              </button>
            )}

            {/* Mixing indicator + volume sliders (desktop) */}
            {isScreenSharing && (
              <div className="flex items-center gap-2 pointer-events-auto px-3 py-1 rounded-full bg-black/40 ring-1 ring-white/10">
                <div className="text-xs">Mix</div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={micVolume}
                    onChange={(e) => { setMicVolume(Number(e.target.value)); if (micGainRef.current) micGainRef.current.gain.value = Number(e.target.value); }}
                    className="w-24"
                    aria-label="Mic volume"
                  />
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={displayVolume}
                    onChange={(e) => { setDisplayVolume(Number(e.target.value)); if (dispGainRef.current) dispGainRef.current.gain.value = Number(e.target.value); }}
                    className="w-24"
                    aria-label="Display volume"
                  />
                </div>
              </div>
            )}

            {/* Hang up */}
            <button
              className="ml-1 h-12 w-12 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 shadow-md"
              onClick={() => {
                try {
                  if (socketRef.current) socketRef.current.emit('leave', { roomId });
                } catch {}
                if (hangUp) hangUp();
              }}
              title="End call"
            >
              <HiOutlinePhoneMissedCall size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom controls (outside video) */}
      <div className={`md:hidden w-full max-w-full mt-2 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-black/60 backdrop-blur-md ring-1 ring-white/15">
          <button
            className={`h-10 w-10 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-600' : 'bg-zinc-800/70'}`}
            onClick={toggleMute}
            title="Toggle microphone"
          >
            {isMuted ? <FaMicrophoneSlash size={16} /> : <FaMicrophone className="text-emerald-400" size={16} />}
          </button>
          <div className="relative">
            <button
              className="h-10 w-10 rounded-full flex items-center justify-center bg-zinc-800/70"
              onClick={() => setShowAudioDevices(v => !v)}
              title="Select microphone"
            >
              <FiChevronUp size={14} />
            </button>
            {showAudioDevices && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-auto min-w-[12rem]">
                {audioDevices.map(d => (
                  <div
                    key={d.deviceId}
                    onClick={() => { setShowAudioDevices(false); switchAudioDevice(d.deviceId); }}
                    className={`px-3 py-2 text-sm hover:bg-white/10 cursor-pointer ${selectedAudioDevice === d.deviceId ? 'bg-white/10' : ''}`}
                  >
                    {d.label || `Mic ${d.deviceId.slice(0,6)}`}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            className={`h-10 w-10 rounded-full flex items-center justify-center ${isCameraOff ? 'bg-red-600' : 'bg-zinc-800/70'}`}
            onClick={toggleCamera}
            title="Toggle camera"
          >
            {isCameraOff ? <FaVideoSlash size={16} /> : <FaVideo className="text-emerald-400" size={16} />}
          </button>
          <div className="relative">
            <button
              className="h-10 w-10 rounded-full flex items-center justify-center bg-zinc-800/70"
              onClick={() => setShowVideoDevices(v => !v)}
              title="Select camera"
            >
              <FiChevronUp size={14} />
            </button>
            {showVideoDevices && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-auto min-w-[12rem]">
                {videoDevices.map(d => (
                  <div
                    key={d.deviceId}
                    onClick={() => { setShowVideoDevices(false); switchVideoDevice(d.deviceId); }}
                    className={`px-3 py-2 text-sm hover:bg-white/10 cursor-pointer ${selectedVideoDevice === d.deviceId ? 'bg-white/10' : ''}`}
                  >
                    {d.label || `Cam ${d.deviceId.slice(0,6)}`}
                  </div>
                ))}
              </div>
            )}
          </div>
          {!isScreenSharing ? (
            <button
              className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-600"
              onClick={startScreenShare}
              title="Start screen share"
            >
              <LuScreenShare size={16} />
            </button>
          ) : (
            <button
              className="h-10 w-10 rounded-full flex items-center justify-center bg-orange-600"
              onClick={stopScreenShare}
              title="Stop screen share"
            >
              <FaStopCircle size={18} />
            </button>
          )}
          {/* Mobile mixing UI (toggle showing sliders) */}
          {isScreenSharing && (
            <div className="flex items-center gap-2">
              <button
                className="h-8 w-8 rounded-full flex items-center justify-center bg-zinc-800/70"
                onClick={() => setShowVolumeControls(v => !v)}
                title="Show volume controls"
              >
                <div className="text-xs">Vol</div>
              </button>
              {showVolumeControls && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-white/10 rounded-xl shadow-2xl z-50 p-3 flex flex-col gap-2">
                  <label className="text-xs">Mic</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={micVolume}
                    onChange={(e) => { setMicVolume(Number(e.target.value)); if (micGainRef.current) micGainRef.current.gain.value = Number(e.target.value); }}
                  />
                  <label className="text-xs">Screen</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={displayVolume}
                    onChange={(e) => { setDisplayVolume(Number(e.target.value)); if (dispGainRef.current) dispGainRef.current.gain.value = Number(e.target.value); }}
                  />
                </div>
              )}
            </div>
          )}
          <button
            className="h-11 w-11 rounded-full flex items-center justify-center bg-red-600"
            onClick={() => {
              try {
                if (socketRef.current) socketRef.current.emit('leave', { roomId });
              } catch {}
              if (hangUp) hangUp();
            }}
            title="End call"
          >
            <HiOutlinePhoneMissedCall size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallRoom;