import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';

interface Player {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  color: {
    r: number;
    g: number;
    b: number;
  };
  lastActivity: number; // Track last activity time
}

interface ServerDiagnostics {
  uptime: number;
  fps: number;
  playerCount: number;
  colorPoolSize: number;
  availableColors: number;
  lockedColors: number;
  randomColors: number;
  connections: number;
  memoryUsage: NodeJS.MemoryUsage;
}

const app: Express = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your actual domain
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000, // 60 second ping timeout (default is 20s)
  pingInterval: 25000, // 25 second ping interval (default is 25s)
});

// Set proper MIME types
app.use((req: Request, res: Response, next: NextFunction) => {
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
const players: Map<string, Player> = new Map();
const usedHues: Set<string> = new Set();

// Server diagnostics state
const startTime: number = Date.now();
let tickCount: number = 0;
let fps: number = 0;
const fpsUpdateInterval: number = 1000; // Update FPS every second
let lastFpsUpdate: number = Date.now();

// Player inactivity cleanup - remove players that haven't been active for 5 minutes
const PLAYER_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const playerCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, player] of players.entries()) {
    if (now - player.lastActivity > PLAYER_TIMEOUT) {
      console.log(`Removing inactive player: ${id}`);
      // Remove the used color
      const key = `${player.color.r},${player.color.g},${player.color.b}`;
      usedHues.delete(key);
      players.delete(id);
      io.emit('player_left', id);
    }
  }
}, 60000); // Check every minute

// Start diagnostics broadcast
const diagnosticsInterval = setInterval(() => {
  const now: number = Date.now();
  tickCount++;

  // Update FPS every second
  if (now - lastFpsUpdate >= fpsUpdateInterval) {
    fps = Math.round((tickCount * 1000) / (now - lastFpsUpdate));
    tickCount = 0;
    lastFpsUpdate = now;

    // Broadcast diagnostics to all clients
    const diagnostics: ServerDiagnostics = {
      uptime: Math.floor((now - startTime) / 1000),
      fps: fps,
      playerCount: players.size,
      colorPoolSize: 12, // Number of predefined colors
      availableColors: 12 - usedHues.size,
      lockedColors: usedHues.size,
      randomColors: 0, // We don't use random colors in this implementation
      connections: io.engine.clientsCount,
      memoryUsage: process.memoryUsage()
    };

    io.emit('server_diagnostics', diagnostics);
    console.log('Server Diagnostics:', {
      ...diagnostics,
      memoryUsage: {
        rss: Math.round(diagnostics.memoryUsage.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(diagnostics.memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(diagnostics.memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        external: Math.round(diagnostics.memoryUsage.external / 1024 / 1024) + 'MB'
      }
    });
  }
}, 1000 / 60); // 60Hz tick rate

// Generate a random spawn position
function generateSpawnPosition(): { x: number; y: number; z: number } {
  const minSpawnRadius: number = 15; // Minimum distance from center
  const maxSpawnRadius: number = 40; // Maximum distance from center
  const angle: number = Math.random() * Math.PI * 2; // Random angle
  const distance: number = minSpawnRadius + (Math.random() * (maxSpawnRadius - minSpawnRadius)); // Random distance between min and max
  
  return {
    x: Math.cos(angle) * distance,
    y: 1, // Height above ground
    z: Math.sin(angle) * distance
  };
}

// Generate a random color for a player
function generatePlayerColor(): { r: number; g: number; b: number } {
  const colors: Array<{ r: number; g: number; b: number }> = [
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
    const key: string = `${color.r},${color.g},${color.b}`;
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
io.on('connection', (socket: Socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Handle ping
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // Handle player join
  socket.on('player_join', (data: { position?: Player['position']; rotation?: Player['rotation'] }) => {
    // Generate spawn position and color
    const spawnPosition = generateSpawnPosition();
    const playerColor = generatePlayerColor();
    
    const player: Player = {
      id: socket.id,
      position: data.position || spawnPosition,
      rotation: data.rotation || { 
        x: 0,
        y: Math.random() * Math.PI * 2, // Random initial facing direction
        z: 0
      },
      color: playerColor,
      lastActivity: Date.now()
    };
    players.set(socket.id, player);

    // Send existing players to the new player
    const existingPlayers = Array.from(players.values())
      .filter(p => p.id !== socket.id)
      .map(p => ({
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
  socket.on('position_update', (data: { position: Player['position']; rotation: Player['rotation'] }) => {
    const player = players.get(socket.id);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;
      player.lastActivity = Date.now(); // Update activity timestamp
      socket.broadcast.emit('player_moved', {
        id: socket.id,
        position: data.position,
        rotation: data.rotation
      });
    }
  });

  // Handle player disconnect
  socket.on('disconnect', (reason) => {
    console.log(`Player disconnected: ${socket.id}, reason: ${reason}`);
    const player = players.get(socket.id);
    if (player) {
      // Remove the used color
      const key = `${player.color.r},${player.color.g},${player.color.b}`;
      usedHues.delete(key);
      players.delete(socket.id);
      io.emit('player_left', socket.id);
    }
    
    // Cleanup socket handlers
    socket.removeAllListeners();
  });

  // Handle chat messages
  socket.on('chat_message', (message: string) => {
    const player = players.get(socket.id);
    if (player) {
      player.lastActivity = Date.now(); // Update activity timestamp
      io.emit('chat_message', {
        id: socket.id,
        message: message
      });
    }
  });
  
  // Handle error events
  socket.on('error', (error) => {
    console.error(`Socket error for player ${socket.id}:`, error);
  });
});

// Start server
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Proper cleanup on server shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  
  // Clear intervals
  clearInterval(playerCleanupInterval);
  clearInterval(diagnosticsInterval);
  
  // Close all socket connections
  io.disconnectSockets();
  
  // Close the server
  server.close(() => {
    console.log('Server shutdown complete.');
    process.exit(0);
  });
});

export { server as Server }; 