const { Server } = require('socket.io');

class GameServer {
  constructor(server, port, options = {}) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.players = new Map();
    this.isTestMode = options.isTestMode || false;
    
    // Predefined color pool with HSL values for better distinction
    this.colorPool = [
      // Primary Colors (maximum saturation and brightness)
      { r: 1, g: 0, b: 0 },    // Red
      { r: 0, g: 1, b: 0 },    // Green
      { r: 0, g: 0, b: 1 },    // Blue
      
      // Secondary Colors (maximum saturation and brightness)
      { r: 1, g: 1, b: 0 },    // Yellow
      { r: 0, g: 1, b: 1 },    // Cyan
      { r: 1, g: 0, b: 1 },    // Magenta
      
      // Tertiary Colors (balanced saturation)
      { r: 1, g: 0.5, b: 0 },  // Orange
      { r: 0.5, g: 1, b: 0 },  // Chartreuse
      { r: 0, g: 1, b: 0.5 },  // Spring Green
      { r: 0, g: 0.5, b: 1 },  // Azure
      { r: 0.5, g: 0, b: 1 },  // Purple
      { r: 1, g: 0, b: 0.5 },  // Rose
      
      // Dark variants (reduced brightness)
      { r: 0.7, g: 0, b: 0 },  // Dark Red
      { r: 0, g: 0.7, b: 0 },  // Dark Green
      { r: 0, g: 0, b: 0.7 },  // Dark Blue
      
      // Light variants (added white)
      { r: 1, g: 0.7, b: 0.7 }, // Light Red
      { r: 0.7, g: 1, b: 0.7 }, // Light Green
      { r: 0.7, g: 0.7, b: 1 }  // Light Blue
    ];

    // Verify we have exactly 18 colors
    if (this.colorPool.length !== 18) {
      throw new Error(`Color pool must have exactly 18 colors, but has ${this.colorPool.length}`);
    }
    
    this.availableColors = [...this.colorPool];
    this.lockedColors = new Map();
    this.pendingJoins = new Map();
    this.colorAssignmentPromise = Promise.resolve();
    this.COLOR_TOLERANCE = 0.001;
    this.usedRandomColors = new Set();
    this.colorAssignmentMutex = Promise.resolve();
    this.colorKeyCache = new Map();
    this.startTime = Date.now();
    this.lastTick = Date.now();
    this.tickCount = 0;
    this.fps = 0;
    this.fpsUpdateInterval = 1000; // Update FPS every second
    this.lastFpsUpdate = Date.now();

    if (!this.isTestMode) {
      console.log(`Attaching Socket.IO server to HTTP server on port ${port}`);
    }

    this.setupEventHandlers();
    this.startDiagnostics();
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

  // Helper method to generate a color key for comparison
  getColorKey(color) {
    return `${color.r.toFixed(6)},${color.g.toFixed(6)},${color.b.toFixed(6)}`;
  }

  // Helper method to check if colors are equal within tolerance
  areColorsEqual(c1, c2) {
    return Math.abs(c1.r - c2.r) < this.COLOR_TOLERANCE &&
           Math.abs(c1.g - c2.g) < this.COLOR_TOLERANCE &&
           Math.abs(c1.b - c2.b) < this.COLOR_TOLERANCE;
  }

  // Helper method to check if a color is from the pool
  isColorFromPool(color) {
    return this.colorPool.some(poolColor => 
      Math.abs(color.r - poolColor.r) < this.COLOR_TOLERANCE &&
      Math.abs(color.g - poolColor.g) < this.COLOR_TOLERANCE &&
      Math.abs(color.b - poolColor.b) < this.COLOR_TOLERANCE
    );
  }

  async generatePlayerColor() {
    // Use a mutex to ensure only one color is being generated at a time
    return new Promise((resolve, reject) => {
      this.colorAssignmentMutex = this.colorAssignmentMutex.then(async () => {
        try {
          // Try to get a color from the available pool first
          if (this.availableColors.length > 0) {
            const colorIndex = Math.floor(Math.random() * this.availableColors.length);
            const color = { ...this.availableColors[colorIndex] }; // Clone to prevent reference issues
            this.availableColors.splice(colorIndex, 1);
            resolve(color);
            return;
          }

          // If no colors are available in the pool, generate a unique random color
          const getColorDistance = (c1, c2) => {
            return Math.sqrt(
              Math.pow(c1.r - c2.r, 2) +
              Math.pow(c1.g - c2.g, 2) +
              Math.pow(c1.b - c2.b, 2)
            );
          };

          const MIN_COLOR_DISTANCE = 0.4;
          const MIN_POOL_DISTANCE = 0.4;
          let attempts = 0;
          const MAX_ATTEMPTS = 1000;

          while (attempts < MAX_ATTEMPTS) {
            // Generate a random color with at least one high component
            const newColor = {
              r: Math.random(),
              g: Math.random(),
              b: Math.random()
            };

            // Ensure at least one component is high (0.8-1.0)
            const maxComponent = Math.random() < 0.33 ? 'r' : Math.random() < 0.5 ? 'g' : 'b';
            newColor[maxComponent] = 0.8 + (Math.random() * 0.2); // Between 0.8 and 1.0

            // Check distance from all used colors
            let isUnique = true;
            
            // First check against locked colors
            for (const [_, usedColor] of this.lockedColors) {
              const distance = getColorDistance(newColor, usedColor);
              if (distance < MIN_COLOR_DISTANCE) {
                isUnique = false;
                break;
              }
            }

            // Then check against pool colors
            if (isUnique) {
              for (const poolColor of this.colorPool) {
                const distance = getColorDistance(newColor, poolColor);
                if (distance < MIN_POOL_DISTANCE) {
                  isUnique = false;
                  break;
                }
              }
            }

            // Finally check against other random colors
            if (isUnique) {
              for (const usedRandomColor of this.usedRandomColors) {
                const distance = getColorDistance(newColor, usedRandomColor);
                if (distance < MIN_COLOR_DISTANCE) {
                  isUnique = false;
                  break;
                }
              }
            }

            if (isUnique) {
              const newColorCopy = { ...newColor }; // Clone to prevent reference issues
              this.usedRandomColors.add(newColorCopy);
              resolve(newColor);
              return;
            }

            attempts++;
          }

          // Last resort: generate a color that's guaranteed to be different
          const usedMaxComponents = new Set();
          
          // Track all used max components with high precision
          for (const [_, color] of this.lockedColors) {
            const max = Math.max(color.r, color.g, color.b);
            usedMaxComponents.add(max.toFixed(3));
          }
          for (const color of this.colorPool) {
            const max = Math.max(color.r, color.g, color.b);
            usedMaxComponents.add(max.toFixed(3));
          }
          for (const color of this.usedRandomColors) {
            const max = Math.max(color.r, color.g, color.b);
            usedMaxComponents.add(max.toFixed(3));
          }

          // Find an unused maximum component value
          let maxValue = 1.0;
          while (usedMaxComponents.has(maxValue.toFixed(3)) && maxValue > 0.8) {
            maxValue -= 0.01;
          }

          // If we couldn't find a unique max value above 0.8, try a lower range
          if (maxValue <= 0.8) {
            maxValue = 0.8;
            while (usedMaxComponents.has(maxValue.toFixed(3)) && maxValue > 0.6) {
              maxValue -= 0.01;
            }
          }

          const newColor = {
            r: Math.random() * 0.3,
            g: Math.random() * 0.3,
            b: Math.random() * 0.3
          };

          // Randomly choose which component gets the max value
          const component = Math.random() < 0.33 ? 'r' : Math.random() < 0.5 ? 'g' : 'b';
          newColor[component] = maxValue;

          const newColorCopy = { ...newColor }; // Clone to prevent reference issues
          this.usedRandomColors.add(newColorCopy);
          resolve(newColor);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  startDiagnostics() {
    setInterval(() => {
      const now = Date.now();
      const delta = now - this.lastTick;
      this.lastTick = now;
      this.tickCount++;

      // Update FPS every second
      if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
        this.fps = Math.round((this.tickCount * 1000) / (now - this.lastFpsUpdate));
        this.tickCount = 0;
        this.lastFpsUpdate = now;

        // Broadcast diagnostics to all clients
        const diagnostics = {
          uptime: Math.floor((now - this.startTime) / 1000),
          fps: this.fps,
          playerCount: this.players.size,
          colorPoolSize: this.colorPool.length,
          availableColors: this.availableColors.length,
          lockedColors: this.lockedColors.size,
          randomColors: this.usedRandomColors.size,
          connections: this.io.engine.clientsCount
        };

        this.io.emit('server_diagnostics', diagnostics);
        
        if (!this.isTestMode) {
          console.log('Server Diagnostics:', diagnostics);
        }
      }
    }, 1000 / 60); // 60Hz tick rate
  }

  setupEventHandlers() {
    // Track connection attempts per IP
    const connectionAttempts = new Map();
    const MAX_CONNECTIONS_PER_MINUTE = this.isTestMode ? 100 : 10;
    const RESET_INTERVAL = 60000;
    const JOIN_TIMEOUT = this.isTestMode ? 5000 : 10000;

    this.io.on('connection', (socket) => {
      // Rate limiting for connections
      const clientIp = socket.handshake.address;
      const now = Date.now();
      const clientAttempts = connectionAttempts.get(clientIp) || [];
      
      while (clientAttempts.length > 0 && clientAttempts[0] < now - RESET_INTERVAL) {
        clientAttempts.shift();
      }
      
      if (clientAttempts.length >= MAX_CONNECTIONS_PER_MINUTE) {
        if (!this.isTestMode) {
          console.log(`Rate limit exceeded for ${clientIp}`);
        }
        socket.emit('error', { message: 'Rate limit exceeded' });
        socket.disconnect(true);
        return;
      }
      
      clientAttempts.push(now);
      connectionAttempts.set(clientIp, clientAttempts);

      if (!this.isTestMode) {
        console.log(`Player connected: ${socket.id}`);
        console.log(`Current players: ${Array.from(this.players.keys()).join(', ') || 'none'}`);
      }

      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('player_join', async (data) => {
        const joinTimeout = setTimeout(() => {
          if (this.pendingJoins.has(socket.id)) {
            this.pendingJoins.delete(socket.id);
            socket.emit('error', { message: 'Join operation timed out' });
            socket.disconnect(true);
          }
        }, JOIN_TIMEOUT);

        this.pendingJoins.set(socket.id, joinTimeout);

        try {
          if (!this.isTestMode) {
            console.log(`Player join event from ${socket.id}:`, data);
          }

          const spawnPosition = this.generateSpawnPosition();
          let playerColor = data.color;
          let attempts = 0;
          const MAX_COLOR_ATTEMPTS = 5;

          while (attempts < MAX_COLOR_ATTEMPTS) {
            try {
              if (!playerColor) {
                playerColor = await this.generatePlayerColor();
              }
              
              // Verify we got a valid color
              if (!playerColor || typeof playerColor.r !== 'number' || 
                  typeof playerColor.g !== 'number' || typeof playerColor.b !== 'number') {
                throw new Error('Invalid color generated: color components must be numbers');
              }

              // Verify color components are in valid range
              if (playerColor.r < 0 || playerColor.r > 1 ||
                  playerColor.g < 0 || playerColor.g > 1 ||
                  playerColor.b < 0 || playerColor.b > 1) {
                throw new Error('Invalid color generated: color components must be between 0 and 1');
              }
              
              // Double-check color uniqueness using the helper method
              let isUnique = true;
              for (const [existingId, existingColor] of this.lockedColors) {
                if (this.areColorsEqual(existingColor, playerColor)) {
                  isUnique = false;
                  if (!this.isTestMode) {
                    console.log(`Color conflict for ${socket.id} with ${existingId}, retrying...`);
                  }
                  break;
                }
              }

              if (isUnique) {
                this.lockedColors.set(socket.id, { ...playerColor }); // Clone to prevent reference issues
                
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

                if (!this.isTestMode) {
                  console.log(`Added player ${socket.id} to players map. Total players: ${this.players.size}`);
                }

                clearTimeout(this.pendingJoins.get(socket.id));
                this.pendingJoins.delete(socket.id);

                socket.emit('player_joined', player);

                const existingPlayers = Array.from(this.players.values())
                  .filter(p => p.id !== socket.id)
                  .map(p => ({
                    id: p.id,
                    position: p.position,
                    rotation: p.rotation,
                    color: p.color
                  }));

                socket.emit('players_list', existingPlayers);
                socket.broadcast.emit('player_joined', player);
                return;
              }

              // If color is not unique, try again with a new color
              playerColor = null;
              attempts++;
            } catch (error) {
              if (attempts >= MAX_COLOR_ATTEMPTS) {
                throw error;
              }
              playerColor = null;
              attempts++;
            }
          }

          throw new Error('Failed to generate unique color after multiple attempts');
        } catch (error) {
          if (!this.isTestMode) {
            console.error(`Error in player_join for ${socket.id}:`, error.message);
          }
          clearTimeout(this.pendingJoins.get(socket.id));
          this.pendingJoins.delete(socket.id);
          this.lockedColors.delete(socket.id);
          this.players.delete(socket.id);
          socket.emit('error', { message: error.message || 'Failed to join game' });
          socket.disconnect(true);
        }
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
          // Return the color to the available pool if it was from our predefined set
          const playerColor = player.color;
          const isFromPool = this.colorPool.some(color => 
            Math.abs(color.r - playerColor.r) < this.COLOR_TOLERANCE &&
            Math.abs(color.g - playerColor.g) < this.COLOR_TOLERANCE &&
            Math.abs(color.b - playerColor.b) < this.COLOR_TOLERANCE
          );
          
          if (isFromPool) {
            this.availableColors.push({ ...playerColor }); // Clone to prevent reference issues
          } else {
            // Remove from used random colors if it was a random color
            this.usedRandomColors.delete(playerColor);
          }
          
          // Remove the color lock
          this.lockedColors.delete(socket.id);
          
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
    // Clean up any pending operations
    for (const [socketId, timeout] of this.pendingJoins) {
      clearTimeout(timeout);
    }
    this.pendingJoins.clear();

    // Close the socket.io server
    if (this.io) {
      this.io.close();
    }
  }
}

module.exports = { GameServer }; 