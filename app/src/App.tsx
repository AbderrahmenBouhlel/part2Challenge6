import { useState, useRef, useEffect } from 'react';
import { useWebRTC } from './hooks/useWebRtc';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  LogIn, 
  Users, 
  Radio,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from './components/ui/alert';
import './App.css';

function App() {
  const [roomId, setRoomId] = useState('');
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
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
  } = useWebRTC({
    roomId: joinedRoom || '',
    serverUrl
  });

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle join room
  const handleJoinRoom = () => {
    if (roomId.trim()) {
      setJoinedRoom(roomId.trim());
    }
  };

  // Handle leave room
  const handleLeaveRoom = () => {
    leaveRoom();
    setJoinedRoom(null);
    setRoomId('');
  };

  // Generate a random room ID
  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
    setRoomId(randomId);
  };

  // Join screen
  if (!joinedRoom) {
    return (
      <div className="app-shell join-shell min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="card-glass reveal w-full max-w-md bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
              <Radio className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              WebRTC Video Call
            </CardTitle>
            <CardDescription className="text-slate-400">
              Join a room to start a secure peer-to-peer video call
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Server URL Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Signaling Server URL
              </label>
              <Input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://localhost:3001"
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">
                Default: localhost:3001 for local development
              </p>
            </div>

            {/* Room ID Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Room ID
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter room ID"
                  className="flex-1 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 uppercase"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
                <Button
                  variant="outline"
                  onClick={generateRoomId}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  Random
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Share this Room ID with the person you want to call
              </p>
            </div>

            {/* Join Button */}
            <Button
              onClick={handleJoinRoom}
              disabled={!roomId.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-6"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Join Room
            </Button>

            {/* Instructions */}
            <div className="pt-4 border-t border-slate-700">
              <h4 className="text-sm font-medium text-slate-300 mb-2">How it works:</h4>
              <ul className="text-xs text-slate-400 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">1.</span>
                  Enter or generate a Room ID
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">2.</span>
                  Share the Room ID with your contact
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">3.</span>
                  Both join the same room to connect
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">4.</span>
                  Enjoy secure peer-to-peer video calling!
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Video call screen
  return (
    <div className="app-shell call-shell min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="app-header bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">WebRTC Video Call</h1>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Room: <span className="text-blue-400 font-mono">{joinedRoom}</span></span>
                {isConnected && (
                  <span className="flex items-center gap-1 text-green-400">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Connected
                  </span>
                )}
                {isConnecting && !isConnected && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Connecting...
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-4 h-4" />
              <span className="text-sm">
                {otherUserId ? '2' : '1'} / 2
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeaveRoom}
              className="bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="w-4 h-4 mr-1" />
              Leave
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="alert-glow mb-4 bg-red-900/50 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Video Grid */}
          <div className="video-grid relative h-[calc(100vh-180px)] min-h-[400px] rounded-2xl overflow-hidden bg-slate-900">
            {/* Remote Video (Full Size) */}
            <div className="absolute inset-0">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-12 h-12 text-slate-500" />
                    </div>
                    <p className="text-slate-400 text-lg">
                      {isConnecting ? 'Waiting for other participant...' : 'No one else in the room'}
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                      Share Room ID: <span className="text-blue-400 font-mono">{joinedRoom}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Local Video (Picture-in-Picture) */}
            <div className="pip-frame absolute bottom-4 right-4 w-48 md:w-64 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700 bg-slate-800">
              {localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                  <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                </div>
              )}
              
              {/* Local video label */}
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                You
              </div>
            </div>

            {/* Connection Status Overlay */}
            {isConnecting && !isConnected && !error && (
              <div className="status-chip absolute top-4 left-4 px-4 py-2 bg-yellow-500/90 rounded-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium text-yellow-950">Establishing connection...</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="control-dock mt-4 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={toggleAudio}
              className={`rounded-full w-14 h-14 p-0 border-2 ${
                isAudioEnabled 
                  ? 'border-slate-600 bg-slate-800 text-white hover:bg-slate-700' 
                  : 'border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={toggleVideo}
              className={`rounded-full w-14 h-14 p-0 border-2 ${
                isVideoEnabled 
                  ? 'border-slate-600 bg-slate-800 text-white hover:bg-slate-700' 
                  : 'border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleLeaveRoom}
              className="rounded-full w-16 h-16 p-0 bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="w-8 h-8" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;