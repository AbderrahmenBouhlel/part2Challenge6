# WebRTC Video Calling App

A real-time one-to-one video calling application built with native WebRTC APIs and WebSocket signaling. Users can join shared rooms to establish secure peer-to-peer video connections.

## Features

- **Native WebRTC**: Uses browser-native WebRTC APIs without third-party SDKs
- **WebSocket Signaling**: Real-time signaling server using Socket.io
- **Room-based Access**: Only users in the same room can connect (max 2 participants per room)
- **Camera & Microphone**: Full control over media devices with mute/unmute and video on/off
- **Peer-to-Peer**: Direct connection between participants for low latency
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Project Structure

```
.
├── src/                      # React frontend
│   ├── hooks/
│   │   └── useWebRTC.ts      # WebRTC logic hook
│   ├── App.tsx               # Main application component
│   ├── App.css               # Application styles
│   └── ...
├── server/                   # WebSocket signaling server
│   ├── server.js             # Main server file
│   └── package.json          # Server dependencies
├── package.json              # Frontend dependencies
└── README.md                 # This file
```

## Prerequisites

- Node.js 18+ installed
- Modern web browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- Camera and microphone access

## Installation & Setup

### 1. Clone/Extract the Project

```bash
cd webrtc-video-call
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Server Dependencies

```bash
cd server
npm install
cd ..
```

## Running the Application

You need to run both the **signaling server** and the **frontend** simultaneously.

### Option 1: Run in Separate Terminals

**Terminal 1 - Start the Signaling Server:**

```bash
cd server
npm start
```

The server will start on `http://localhost:3001`

**Terminal 2 - Start the Frontend:**

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is in use)

### Option 2: Using Concurrently (Recommended for Development)

Install the `concurrently` package to run both:

```bash
npm install --save-dev concurrently
```

Add to your root `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "server": "cd server && npm start",
    "start": "concurrently \"npm run server\" \"npm run dev\""
  }
}
```

Then run:

```bash
npm start
```

## How to Use

### 1. Start the Application

1. Start the signaling server: `cd server && npm start`
2. Start the frontend: `npm run dev`
3. Open your browser to `http://localhost:5173`

### 2. Join a Room

- Enter a **Room ID** or click **Random** to generate one
- Click **Join Room**
- Allow camera and microphone permissions when prompted

### 3. Connect with Another Person

- Share the Room ID with the person you want to call
- They must enter the same Room ID and join
- Once both are in the room, the WebRTC connection will establish automatically

### 4. During the Call

- **Mute/Unmute**: Click the microphone button
- **Video On/Off**: Click the video camera button
- **Leave Call**: Click the red phone button

## WebRTC Connection Flow

```
┌─────────────┐                    ┌─────────────┐
│   User A    │                    │   User B    │
└──────┬──────┘                    └──────┬──────┘
       │                                   │
       │  1. Join Room "XYZ"               │
       │ ───────────────────────────────>  │
       │                                   │
       │  2. User B joins Room "XYZ"       │
       │ <───────────────────────────────  │
       │                                   │
       │  3. User A creates Offer          │
       │  4. User A sends Offer via Server │
       │ ───────────────────────────────>  │
       │                                   │
       │  5. User B receives Offer         │
       │  6. User B creates Answer         │
       │  7. User B sends Answer           │
       │ <───────────────────────────────  │
       │                                   │
       │  8. Exchange ICE Candidates       │
       │ <───────────────────────────────> │
       │                                   │
       │  9. Peer-to-Peer Connection       │
       │     Established!                  │
       │ <══════════════════════════════=> │
```

## Architecture

### Frontend (React + TypeScript)

- **useWebRTC Hook**: Manages WebRTC peer connection, media streams, and signaling
- **Socket.io Client**: Connects to signaling server for room management and SDP exchange
- **RTCPeerConnection**: Native WebRTC API for peer-to-peer connection

### Signaling Server (Node.js + Express + Socket.io)

- **Room Management**: Tracks participants in each room (max 2)
- **Message Relay**: Forwards offers, answers, and ICE candidates between peers
- **Events**:
  - `join-room`: User joins a room
  - `offer`: WebRTC offer from one peer to another
  - `answer`: WebRTC answer in response to offer
  - `ice-candidate`: ICE candidate exchange
  - `user-left`: Notification when a user disconnects

## Configuration

### Signaling Server Port

Default: `3001`

Change in `server/server.js`:
```javascript
const PORT = process.env.PORT || 3001;
```

### Frontend Server URL

Default: `http://localhost:3001`

Can be changed in the UI before joining a room, or modify the default in `src/App.tsx`:
```typescript
const [serverUrl, setServerUrl] = useState('http://localhost:3001');
```

### STUN/TURN Servers

The app uses Google's public STUN servers for NAT traversal:

```javascript
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};
```

For production, consider adding TURN servers for better connectivity behind strict firewalls.

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome 60+ | ✅ Full |
| Firefox 60+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Edge 79+ | ✅ Full |
| Opera 47+ | ✅ Full |

## Troubleshooting

### Camera/Microphone Not Working

1. Check browser permissions (click the lock icon in the address bar)
2. Ensure no other app is using the camera/microphone
3. Try refreshing the page

### Cannot Connect to Other User

1. Verify both users are using the **exact same Room ID**
2. Check that the signaling server is running
3. Check browser console for errors
4. Try using the same network first (some NAT configurations block P2P)

### Connection Drops Frequently

1. Check internet stability
2. Try adding TURN servers for relay capability
3. Disable VPN if active

### Server Connection Error

1. Ensure the server is running on the correct port
2. Check firewall settings
3. Verify the server URL in the UI matches your server address

## Production Deployment

### 1. Build the Frontend

```bash
npm run build
```

### 2. Deploy the Signaling Server

```bash
cd server
npm start
```

For production, use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name webrtc-signaling
```

### 3. Environment Variables

Create a `.env` file in the server directory:

```env
PORT=3001
NODE_ENV=production
```

### 4. HTTPS Required

For production, both the frontend and signaling server must use HTTPS for camera/microphone access.

## Security Considerations

- All video/audio streams are **end-to-end encrypted** via WebRTC's DTLS-SRTP
- Signaling server only relays connection setup messages
- No video/audio data passes through the server
- Room IDs should be kept private

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Signaling**: Node.js, Express, Socket.io
- **WebRTC**: Native browser APIs

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

**Happy Video Calling! 🎥📞**
