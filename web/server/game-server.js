const { Server } = require('socket.io');

class GameServer {
  constructor(server, port) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.players = new Map();
    this.usedHues = new Set();

    // Only log that we're attaching
    console.log(`Attaching Socket.IO server to HTTP server on port ${port}`);

    this.setupEventHandlers();
  }

  generateSpawnPosition() {
    const minSpawnRadius = 15;
    const maxSpawnRadius = 40;
    const angle = Math.random() * Math.PI * 2;
    const distance = minSpawnRadius + (Math.random() * (maxSpawnRadius - minSpawnRadius));
    
    return {
      x: Math.cos(angle) * distance,
      y: 1,
      z: Math.sin(angle) * distance
    };
  }

  generatePlayerColor() {
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

    for (const color of colors) {
      const key = `${color.r},${color.g},${color.b}`;
      if (!this.usedHues.has(key)) {
        this.usedHues.add(key);
        return color;
      }
    }

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return { ...randomColor };
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Player connected: ${socket.id}`);
      console.log(`Current players: ${Array.from(this.players.keys()).join(', ') || 'none'}`);

      socket.on('player_join', (data) => {
        console.log(`Player join event from ${socket.id}:`, data);
        const spawnPosition = this.generateSpawnPosition();
        
        // Use client's color if provided, otherwise generate one
        const playerColor = data.color || this.generatePlayerColor();
        
        const player = {
          id: socket.id,
          position: data.position || spawnPosition,
          rotation: data.rotation || { 
            x: 0,
            y: Math.random() * Math.PI * 2,
            z: 0
          },
          color: playerColor
        };
        this.players.set(socket.id, player);
        console.log(`Added player ${socket.id} to players map. Total players: ${this.players.size}`);

        // First send the player their own data
        console.log(`Sending player_joined to ${socket.id} with data:`, player);
        socket.emit('player_joined', player);

        // Then send them the list of other players
        const existingPlayers = Array.from(this.players.values())
          .filter(p => p.id !== socket.id)
          .map(p => ({
            id: p.id,
            position: p.position,
            rotation: p.rotation,
            color: p.color
          }));
        console.log(`Sending players_list to ${socket.id} with ${existingPlayers.length} players:`, existingPlayers);
        socket.emit('players_list', existingPlayers);

        // Broadcast new player to all other players
        console.log(`Broadcasting player_joined to other players for ${socket.id}`);
        socket.broadcast.emit('player_joined', player);
      });

      socket.on('position_update', (data) => {
        const player = this.players.get(socket.id);
        if (player) {
          player.position = data.position;
          player.rotation = data.rotation;
          socket.broadcast.emit('player_moved', {
            id: socket.id,
            position: data.position,
            rotation: data.rotation
          });
        } else {
          console.error(`Received position update from unknown player: ${socket.id}`);
        }
      });

      socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        const player = this.players.get(socket.id);
        if (player) {
          const key = `${player.color.r},${player.color.g},${player.color.b}`;
          this.usedHues.delete(key);
          this.players.delete(socket.id);
          console.log(`Removed player ${socket.id}. Remaining players: ${this.players.size}`);
          this.io.emit('player_left', socket.id);
        } else {
          console.log(`Player ${socket.id} not found in players map on disconnect`);
        }
      });
    });
  }

  getIO() {
    return this.io;
  }

  close() {
    this.io.close();
  }
}

module.exports = { GameServer }; 