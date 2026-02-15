const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active rooms and their participants
const rooms = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist folder (for production)
app.use(express.static(path.join(__dirname, '../dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: Array.from(rooms.keys()) });
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room
  socket.on('join-room', (roomId) => {
    console.log(`User ${socket.id} attempting to join room: ${roomId}`);
    
    // Check if room exists and has space
    const room = rooms.get(roomId);
    
    if (room && room.size >= 2) {
      // Room is full
      socket.emit('room-full', roomId);
      console.log(`Room ${roomId} is full, rejected user ${socket.id}`);
      return;
    }

    // Join the room
    socket.join(roomId);
    socket.roomId = roomId;
    
    // Add to room tracking
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);

    const participantCount = rooms.get(roomId).size;
    console.log(`User ${socket.id} joined room ${roomId}. Participants: ${participantCount}`);

    // Notify user they joined successfully
    socket.emit('joined-room', roomId);

    // Notify other participant in the room
    socket.to(roomId).emit('user-joined', socket.id);

    // If there's already someone in the room, notify the new user
    if (participantCount > 1) {
      const otherParticipant = Array.from(rooms.get(roomId)).find(id => id !== socket.id);
      socket.emit('other-user', otherParticipant);
    }
  });

  // Handle WebRTC offer
  socket.on('offer', (data) => {
    const { target, offer } = data;
    console.log(`Relaying offer from ${socket.id} to ${target}`);
    socket.to(target).emit('offer', {
      sender: socket.id,
      offer: offer
    });
  });

  // Handle WebRTC answer
  socket.on('answer', (data) => {
    const { target, answer } = data;
    console.log(`Relaying answer from ${socket.id} to ${target}`);
    socket.to(target).emit('answer', {
      sender: socket.id,
      answer: answer
    });
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    const { target, candidate } = data;
    console.log(`Relaying ICE candidate from ${socket.id} to ${target}`);
    socket.to(target).emit('ice-candidate', {
      sender: socket.id,
      candidate: candidate
    });
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.delete(socket.id);
        
        // Notify other participant
        socket.to(socket.roomId).emit('user-left', socket.id);
        
        // Clean up empty rooms
        if (room.size === 0) {
          rooms.delete(socket.roomId);
          console.log(`Room ${socket.roomId} deleted (empty)`);
        } else {
          console.log(`Room ${socket.roomId} now has ${room.size} participant(s)`);
        }
      }
    }
  });

  // Handle explicit leave room
  socket.on('leave-room', () => {
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.delete(socket.id);
        socket.leave(socket.roomId);
        socket.to(socket.roomId).emit('user-left', socket.id);
        
        if (room.size === 0) {
          rooms.delete(socket.roomId);
        }
      }
      socket.roomId = null;
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
});