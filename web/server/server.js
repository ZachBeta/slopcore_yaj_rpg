const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your actual domain
    methods: ["GET", "POST"]
  }
});

// Set proper MIME types
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.type('application/javascript');
  }
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve client directory for game.js
app.use('/client', express.static(path.join(__dirname, '../client')));

// Store connected players and used colors
const players = new Map();
const usedHues = new Set();

// Server diagnostics state
const startTime = Date.now();
let lastTick = Date.now();
let tickCount = 0;
let fps = 0;
const fpsUpdateInterval = 1000; // Update FPS every second
let lastFpsUpdate = Date.now();

// Start diagnostics broadcast
setInterval(() => {
  const now = Date.now();
  const delta = now - lastTick;
  lastTick = now;
  tickCount++;

  // Update FPS every second
  if (now - lastFpsUpdate >= fpsUpdateInterval) {
    fps = Math.round((tickCount * 1000) / (now - lastFpsUpdate));
    tickCount = 0;
    lastFpsUpdate = now;

    // Broadcast diagnostics to all clients
    const diagnostics = {
      uptime: Math.floor((now - startTime) / 1000),
      fps: fps,
      playerCount: players.size,
      colorPoolSize: 12, // Number of predefined colors
      availableColors: 12 - usedHues.size,
      lockedColors: usedHues.size,
      randomColors: 0, // We don't use random colors in this implementation
      connections: io.engine.clientsCount
    };

    io.emit('server_diagnostics', diagnostics);
    console.log('Server Diagnostics:', diagnostics);
  }
}, 1000 / 60); // 60Hz tick rate

// Generate a random spawn position
function generateSpawnPosition() {
  const minSpawnRadius = 15; // Minimum distance from center
  const maxSpawnRadius = 40; // Maximum distance from center
  const angle = Math.random() * Math.PI * 2; // Random angle
  const distance = minSpawnRadius + (Math.random() * (maxSpawnRadius - minSpawnRadius)); // Random distance between min and max
  
  return {
    x: Math.cos(angle) * distance,
    y: 1, // Height above ground
    z: Math.sin(angle) * distance
  };
}

// Generate a random color for a player
function generatePlayerColor() {
  const colors = [
    { r: 1, g: 0, b: 0 },    // Red
    { r: 0, g: 1, b: 0 },    // Green
    { r: 0, g: 0, b: 1 },    // Blue
    { r: 1, g: 1, b: 0 },    // Yellow
    { r: 1, g: 0, b: 1 },    // Magenta
    { r: 0, g: 1, b: 1 },    // Cyan
    { r: 1, g: 0.5, b: 0 },  // Orange
    { r: 0.5, g: 0, b: 1 },  // Purple
    { r: 0, g: 1, b: 0.5 },  // Spring Green
    { r: 1, g: 0, b: 0.5 },  // Pink
    { r: 0.5, g: 1, b: 0 },  // Lime
    { r: 0, g: 0.5, b: 1 }   // Sky Blue
  ];

  // Find an unused color
  for (const color of colors) {
    const key = `${color.r},${color.g},${color.b}`;
    if (!usedHues.has(key)) {
      usedHues.add(key);
      return color;
    }
  }

  // If all colors are used, return a random one
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  return { ...randomColor };
}

// Socket.io event handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Handle ping
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // Handle player join
  socket.on('player_join', (data) => {
    // Generate spawn position and color
    const spawnPosition = generateSpawnPosition();
    const playerColor = generatePlayerColor();
    
    const player = {
      id: socket.id,
      position: data.position || spawnPosition,
      rotation: data.rotation || { 
        x: 0,
        y: Math.random() * Math.PI * 2, // Random initial facing direction
        z: 0
      },
      color: playerColor
    };
    players.set(socket.id, player);

    // Send existing players to the new player
    const existingPlayers = Array.from(players.values()).filter(p => p.id !== socket.id).map(p => ({
      id: p.id,
      position: p.position,
      rotation: p.rotation,
      color: p.color
    }));

    // First send the player their own data
    socket.emit('player_joined', player);
    
    // Then send them the list of other players
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
    const player = players.get(socket.id);
    if (player) {
      // Remove the used color
      const key = `${player.color.r},${player.color.g},${player.color.b}`;
      usedHues.delete(key);
      players.delete(socket.id);
      io.emit('player_left', socket.id);
    }
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
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { Server: server }; 