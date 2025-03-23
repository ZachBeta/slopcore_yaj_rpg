import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

interface Color {
  r: number;
  g: number;
  b: number;
}

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
  color: Color;
}

interface GameServerOptions {
  isTestMode?: boolean;
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
}

export class GameServer {
  private io: Server;
  private players: Map<string, Player>;
  private isTestMode: boolean;
  private colorPool: Color[];
  private availableColors: Color[];
  private lockedColors: Map<string, Color>;
  private pendingJoins: Map<string, Promise<void>>;
  private colorAssignmentPromise: Promise<void>;
  private readonly COLOR_TOLERANCE: number = 0.001;
  private usedRandomColors: Set<Color>;
  private colorAssignmentMutex: Promise<void>;
  private colorKeyCache: Map<string, string>;
  private startTime: number;
  private lastTick: number;
  private tickCount: number;
  private fps: number;
  private readonly fpsUpdateInterval: number = 1000;
  private lastFpsUpdate: number;

  constructor(server: HttpServer, port: number, options: GameServerOptions = {}) {
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
    this.usedRandomColors = new Set();
    this.colorAssignmentMutex = Promise.resolve();
    this.colorKeyCache = new Map();
    this.startTime = Date.now();
    this.lastTick = Date.now();
    this.tickCount = 0;
    this.fps = 0;
    this.lastFpsUpdate = Date.now();

    if (!this.isTestMode) {
      console.log(`Attaching Socket.IO server to HTTP server on port ${port}`);
    }

    this.setupEventHandlers();
    this.startDiagnostics();
  }

  private generateSpawnPosition(): { x: number; y: number; z: number } {
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
  private getColorKey(color: Color): string {
    return `${color.r.toFixed(6)},${color.g.toFixed(6)},${color.b.toFixed(6)}`;
  }

  // Helper method to check if colors are equal within tolerance
  private areColorsEqual(c1: Color, c2: Color): boolean {
    return Math.abs(c1.r - c2.r) < this.COLOR_TOLERANCE &&
           Math.abs(c1.g - c2.g) < this.COLOR_TOLERANCE &&
           Math.abs(c1.b - c2.b) < this.COLOR_TOLERANCE;
  }

  // Helper method to check if a color is from the pool
  private isColorFromPool(color: Color): boolean {
    return this.colorPool.some(poolColor => 
      Math.abs(color.r - poolColor.r) < this.COLOR_TOLERANCE &&
      Math.abs(color.g - poolColor.g) < this.COLOR_TOLERANCE &&
      Math.abs(color.b - poolColor.b) < this.COLOR_TOLERANCE
    );
  }

  async generatePlayerColor(): Promise<Color> {
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
          const getColorDistance = (c1: Color, c2: Color): number => {
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
            const newColor: Color = {
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
          const usedMaxComponents = new Set<string>();
          
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

          const newColor: Color = {
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

  private startDiagnostics(): void {
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
        const diagnostics: ServerDiagnostics = {
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

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Player connected: ${socket.id}`);

      // Handle ping
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle player join
      socket.on('player_join', async (data: { position?: Player['position']; rotation?: Player['rotation'] }) => {
        // Generate spawn position and color
        const spawnPosition = this.generateSpawnPosition();
        const playerColor = await this.generatePlayerColor();
        
        const player: Player = {
          id: socket.id,
          position: data.position || spawnPosition,
          rotation: data.rotation || { 
            x: 0,
            y: Math.random() * Math.PI * 2, // Random initial facing direction
            z: 0
          },
          color: playerColor
        };
        this.players.set(socket.id, player);

        // Send existing players to the new player
        const existingPlayers = Array.from(this.players.values())
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
        const player = this.players.get(socket.id);
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
        const player = this.players.get(socket.id);
        if (player) {
          // Remove the used color
          const key = this.getColorKey(player.color);
          this.lockedColors.delete(key);
          this.players.delete(socket.id);
          this.io.emit('player_left', socket.id);
        }
      });

      // Handle chat messages
      socket.on('chat_message', (message: string) => {
        this.io.emit('chat_message', {
          id: socket.id,
          message: message
        });
      });
    });
  }

  public getIO(): Server {
    return this.io;
  }

  public close(): void {
    this.io.close();
  }
} 