import { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebRTCProps {
  roomId: string;
  serverUrl: string;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  otherUserId: string | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  leaveRoom: () => void;
}

export const useWebRTC = ({ roomId, serverUrl }: UseWebRTCProps): UseWebRTCReturn => {
  // State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // ICE servers configuration (STUN servers for NAT traversal)
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ]
  };

  // Get user media (camera and microphone)
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access camera or microphone. Please check permissions.');
      throw err;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((socket: Socket, targetUserId: string) => {
    const pc = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          pc.addTrack(track, localStreamRef.current);
        }
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setIsConnected(true);
        setIsConnecting(false);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
        socket.emit('ice-candidate', {
          target: targetUserId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        setIsConnecting(false);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
        setRemoteStream(null);
      }
    };

    // Handle negotiation needed
    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', {
          target: targetUserId,
          offer: offer
        });
      } catch (err) {
        console.error('Error during negotiation:', err);
      }
    };

    return pc;
  }, []);

  // Initialize connection
  useEffect(() => {
    let socket: Socket;

    const init = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // Get local media stream
        await getLocalStream();

        // Connect to signaling server
        socket = io(serverUrl);
        socketRef.current = socket;

        // Socket event handlers
        socket.on('connect', () => {
          console.log('Connected to signaling server');
          socket.emit('join-room', roomId);
        });

        socket.on('joined-room', (joinedRoomId: string) => {
          console.log('Joined room:', joinedRoomId);
        });

        socket.on('room-full', (fullRoomId: string) => {
          console.log('Room is full:', fullRoomId);
          setError('This room is full. Only 2 participants allowed per room.');
          setIsConnecting(false);
        });

        socket.on('other-user', (userId: string) => {
          console.log('Other user already in room:', userId);
          setOtherUserId(userId);
          // Don't create offer here - wait for the other user to initiate via 'user-joined'
        });

        socket.on('user-joined', (userId: string) => {
          console.log('User joined room:', userId);
          setOtherUserId(userId);
          
          // Create peer connection and send offer only when someone joins (we're the first one)
          const pc = createPeerConnection(socket, userId);
          
          // Create and send offer
          pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .then(() => {
              socket.emit('offer', {
                target: userId,
                offer: pc.localDescription
              });
            })
            .catch(err => {
              console.error('Error creating offer:', err);
            });
        });

        socket.on('offer', async (data: { sender: string; offer: RTCSessionDescriptionInit }) => {
          console.log('Received offer from:', data.sender);
          
          // Create peer connection if not exists
          let pc = peerConnectionRef.current;
          if (!pc) {
            pc = createPeerConnection(socket, data.sender);
          }

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            socket.emit('answer', {
              target: data.sender,
              answer: answer
            });
          } catch (err) {
            console.error('Error handling offer:', err);
          }
        });

        socket.on('answer', async (data: { sender: string; answer: RTCSessionDescriptionInit }) => {
          console.log('Received answer from:', data.sender);
          const pc = peerConnectionRef.current;
          if (pc) {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            } catch (err) {
              console.error('Error handling answer:', err);
            }
          }
        });

        socket.on('ice-candidate', async (data: { sender: string; candidate: RTCIceCandidateInit }) => {
          console.log('Received ICE candidate from:', data.sender);
          const pc = peerConnectionRef.current;
          if (pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (err) {
              console.error('Error adding ICE candidate:', err);
            }
          }
        });

        socket.on('user-left', (userId: string) => {
          console.log('User left:', userId);
          setOtherUserId(null);
          setRemoteStream(null);
          setIsConnected(false);
          
          // Close peer connection
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from signaling server');
        });

        socket.on('connect_error', (err) => {
          console.error('Connection error:', err);
          setError('Failed to connect to signaling server');
          setIsConnecting(false);
        });

      } catch (err) {
        console.error('Initialization error:', err);
        setIsConnecting(false);
      }
    };

    init();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room');
        socketRef.current.disconnect();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, serverUrl, getLocalStream, createPeerConnection]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room');
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setOtherUserId(null);
  }, []);

  return {
    localStream,
    remoteStream,
    isConnected,
    isConnecting,
    error,
    otherUserId,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    leaveRoom
  };
};