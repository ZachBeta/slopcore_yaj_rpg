const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your actual domain
    methods: ["GET", "POST"]
  }
});

// Store connected players
const players = new Map();

// Socket.io event handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Handle player join
  socket.on('player_join', (data) => {
    const player = {
      id: socket.id,
      position: data.position,
      rotation: data.rotation || { x: 0, y: 0, z: 0 }
    };
    players.set(socket.id, player);

    // Send existing players to the new player
    const existingPlayers = Array.from(players.values());
    socket.emit('players_list', existingPlayers);

    // Broadcast new player to all other players
    socket.broadcast.emit('player_joined', player);
  });

  // Handle player position update
  socket.on('position_update', (data) => {
    const player = players.get(socket.id);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;
      socket.broadcast.emit('player_moved', {
        id: socket.id,
        position: data.position,
        rotation: data.rotation
      });
    }
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    players.delete(socket.id);
    io.emit('player_left', socket.id);
  });

  // Handle chat messages
  socket.on('chat_message', (message) => {
    io.emit('chat_message', {
      id: socket.id,
      message: message
    });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 