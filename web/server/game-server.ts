import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Color, Player, Position, Rotation, ServerDiagnostics } from '../src/types';
import { GameEvent, ConnectionStatus, GAME_CONFIG, GameEventPayloads } from '../src/constants';

interface GameServerOptions {
  isTestMode?: boolean;
}

export class GameServer {
  protected colorPool: Color[];
  protected availableColors: Color[];
  protected lockedColors: Map<string, Color>;
  protected usedRandomColors: Set<Color>;
  protected players: Map<string, Player>;
  private io: Server;
  private port: number;
  private server: HttpServer;
  private lastDiagnosticsUpdate: number;
  private diagnosticsInterval: NodeJS.Timeout;
  private fps: number;
  private startTime: number;
  private isTestMode: boolean;
  private pendingJoins: Map<string, Promise<void>>;
  private colorAssignmentPromise: Promise<void>;
  private readonly COLOR_TOLERANCE: number = 0.001;
  private colorAssignmentMutex: Promise<void>;
  private colorKeyCache: Map<string, string>;
  private lastTick: number;
  private tickCount: number;
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

  private generateSpawnPosition(): Position {
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
    const precision = 6;
    return `${color.r.toFixed(precision)},${color.g.toFixed(precision)},${color.b.toFixed(precision)}`;
  }

  // Helper method to check if colors are equal within tolerance
  private areColorsEqual(c1: Color, c2: Color): boolean {
    return this.getColorKey(c1) === this.getColorKey(c2);
  }

  private getColorDistance(c1: Color, c2: Color): number {
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
    );
  }

  private isColorUnique(color: Color, minDistance: number): boolean {
    // Check against locked colors
    for (const [_, usedColor] of this.lockedColors) {
      if (this.getColorDistance(color, usedColor) < minDistance) {
        return false;
      }
    }

    // Check against pool colors
    for (const poolColor of this.colorPool) {
      if (this.getColorDistance(color, poolColor) < minDistance) {
        return false;
      }
    }

    // Check against other random colors
    for (const usedRandomColor of this.usedRandomColors) {
      if (this.getColorDistance(color, usedRandomColor) < minDistance) {
        return false;
      }
    }

    return true;
  }

  private recycleColor(color: Color): void {
    // Remove from locked colors (already done in disconnect handler)
    
    // Check if it was a random color
    const colorKey = this.getColorKey(color);
    for (const usedColor of this.usedRandomColors) {
      if (this.getColorKey(usedColor) === colorKey) {
        this.usedRandomColors.delete(usedColor);
        return;
      }
    }
    
    // If not a random color, it must be from the pool
    // Find matching pool color and make it available again
    for (let i = 0; i < this.colorPool.length; i++) {
      if (this.areColorsEqual(this.colorPool[i], color)) {
        this.availableColors.push({ ...this.colorPool[i] });
        return;
      }
    }
  }

  async generatePlayerColor(socketId: string): Promise<Color> {
    return new Promise((resolve, reject) => {
      this.colorAssignmentMutex = this.colorAssignmentMutex.then(async () => {
        try {
          // Try to get a color from the available pool first
          if (this.availableColors.length > 0) {
            const colorIndex = Math.floor(Math.random() * this.availableColors.length);
            const color = { ...this.availableColors[colorIndex] };
            this.availableColors.splice(colorIndex, 1);
            this.lockedColors.set(socketId, color);
            resolve(color);
            return;
          }

          const MIN_COLOR_DISTANCE = 0.4;
          let attempts = 0;
          const MAX_ATTEMPTS = 1000;

          // Try to generate a unique random color
          while (attempts < MAX_ATTEMPTS) {
            const newColor: Color = {
              r: Math.random(),
              g: Math.random(),
              b: Math.random()
            };

            // Ensure at least one component is high (0.8-1.0)
            const maxComponent = Math.random() < 0.33 ? 'r' : Math.random() < 0.5 ? 'g' : 'b';
            newColor[maxComponent as keyof Color] = 0.8 + (Math.random() * 0.2);

            // Ensure other components are lower to increase contrast
            const otherComponents = ['r', 'g', 'b'].filter(c => c !== maxComponent);
            otherComponents.forEach(c => {
              newColor[c as keyof Color] = Math.random() * 0.6;
            });

            if (this.isColorUnique(newColor, MIN_COLOR_DISTANCE)) {
              const newColorCopy = { ...newColor };
              this.usedRandomColors.add(newColorCopy);
              this.lockedColors.set(socketId, newColorCopy);
              resolve(newColorCopy);
              return;
            }

            attempts++;
          }

          // Last resort: generate a color with maximum contrast
          const usedMaxComponents = new Set<string>();
          
          // Track all used max components with high precision
          for (const [_, color] of this.lockedColors) {
            const max = Math.max(color.r, color.g, color.b);
            usedMaxComponents.add(max.toFixed(6));
          }
          for (const color of this.colorPool) {
            const max = Math.max(color.r, color.g, color.b);
            usedMaxComponents.add(max.toFixed(6));
          }
          for (const color of this.usedRandomColors) {
            const max = Math.max(color.r, color.g, color.b);
            usedMaxComponents.add(max.toFixed(6));
          }

          // Find an unused maximum component value
          let maxValue = 1.0;
          while (usedMaxComponents.has(maxValue.toFixed(6)) && maxValue > 0.6) {
            maxValue -= 0.01;
          }

          const newColor: Color = {
            r: Math.random() * 0.2,
            g: Math.random() * 0.2,
            b: Math.random() * 0.2
          };

          // Randomly choose which component gets the max value
          const component = Math.random() < 0.33 ? 'r' : Math.random() < 0.5 ? 'g' : 'b';
          newColor[component as keyof Color] = maxValue;

          const newColorCopy = { ...newColor };
          this.usedRandomColors.add(newColorCopy);
          this.lockedColors.set(socketId, newColorCopy);
          resolve(newColorCopy);
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

        this.io.emit(GameEvent.SERVER_DIAGNOSTICS, diagnostics);
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
      socket.on(GameEvent.PING, () => {
        socket.emit(GameEvent.PONG, { timestamp: Date.now() });
      });

      // Handle player join
      socket.on(GameEvent.PLAYER_JOIN, async (data: GameEventPayloads[typeof GameEvent.PLAYER_JOIN]) => {
        // Generate spawn position and color
        const spawnPosition = this.generateSpawnPosition();
        const playerColor = await this.generatePlayerColor(socket.id);
        
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
        socket.emit(GameEvent.PLAYER_JOIN, { id: socket.id, position: player.position, rotation: player.rotation, color: player.color });
        
        // Then send them the list of other players
        socket.emit(GameEvent.PLAYERS_LIST, existingPlayers);

        // Broadcast new player to all other players
        socket.broadcast.emit(GameEvent.PLAYER_JOINED, player);
      });

      // Handle player position update
      socket.on(GameEvent.POSITION_UPDATE, (data: { position: Position; rotation: Rotation }) => {
        const player = this.players.get(socket.id);
        if (player) {
          player.position = data.position;
          player.rotation = data.rotation;
          // Emit to all clients including sender
          this.io.emit(GameEvent.PLAYER_MOVED, {
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
          // Recycle the color
          this.recycleColor(player.color);
          // Remove from locked colors
          this.lockedColors.delete(socket.id);
          // Remove from players
          this.players.delete(socket.id);
          // Notify other players
          this.io.emit(GameEvent.PLAYER_LEFT, socket.id);
        }
      });

      // Handle chat messages
      socket.on(GameEvent.CHAT_MESSAGE, (message: string) => {
        this.io.emit(GameEvent.CHAT_MESSAGE, {
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