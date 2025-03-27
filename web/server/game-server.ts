import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { Color, Player, Position, Rotation, ServerDiagnostics, ObstacleData, MapData, DebugState } from '../src/types';
import { GameEvent, GameEventPayloads } from '../src/constants';

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
  private port: number = 0;
  private server: HttpServer;
  private lastDiagnosticsUpdate: number = Date.now();
  private diagnosticsInterval: NodeJS.Timeout | undefined;
  private stateVerificationInterval: NodeJS.Timeout | undefined;
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
  private mapData: MapData;
  private totalMessages: number = 0;
  private messageRates: number[] = [];
  private randomColors: Color[] = [];

  constructor(server: HttpServer, port: number, options: GameServerOptions = {}) {
    this.server = server;
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
    
    // Generate map data
    this.mapData = this.generateMapData();

    if (!this.isTestMode) {
      console.log(`Attaching Socket.IO server to HTTP server on port ${port}`);
    }

    this.setupEventHandlers();
    this.startDiagnostics();
    
    // Start periodic state verification
    if (!this.isTestMode) {
      this.stateVerificationInterval = setInterval(() => {
        this.verifyAllClientsState();
      }, 5000); // Check every 5 seconds
    }

    // Set up debug endpoints
    this.setupDebugEndpoints();
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

  public getColorDistance(c1: Color, c2: Color): number {
    // Calculate Euclidean distance in RGB space
    const rDiff = c1.r - c2.r;
    const gDiff = c1.g - c2.g;
    const bDiff = c1.b - c2.b;
    
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
  }

  private isColorUnique(color: Color, minDistance: number): boolean {
    // Check against locked colors
    for (const [, usedColor] of this.lockedColors) {
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
      const poolColor = this.colorPool[i];
      if (!poolColor) continue;
      if (this.areColorsEqual(poolColor, color)) {
        this.availableColors.push({
          r: poolColor.r,
          g: poolColor.g,
          b: poolColor.b
        });
        return;
      }
    }
  }

  private hslToRgb(h: number, s: number, l: number): Color {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return { r, g, b };
  }

  generatePlayerColor(socketId: string): Promise<Color> {
    return this.colorAssignmentMutex.then(() => {
      try {
        // Try to get a color from the available pool first
        if (this.availableColors.length > 0) {
          const colorIndex = Math.floor(Math.random() * this.availableColors.length);
          const poolColor = this.availableColors[colorIndex];
          if (!poolColor) {
            throw new Error('Color at index is undefined');
          }
          const color: Color = {
            r: poolColor.r,
            g: poolColor.g,
            b: poolColor.b
          };
          this.availableColors.splice(colorIndex, 1);
          this.lockedColors.set(socketId, color);
          return color;
        }

        const MIN_COLOR_DISTANCE = 0.5;
        let attempts = 0;
        const MAX_ATTEMPTS = 2000;

        // Get all used colors (including locked, pool, and random)
        const allUsedColors = new Set<Color>();
        for (const [, color] of this.lockedColors) {
          allUsedColors.add(color);
        }
        for (const color of this.colorPool) {
          allUsedColors.add(color);
        }
        for (const color of this.usedRandomColors) {
          allUsedColors.add(color);
        }

        // Try to generate a unique random color
        while (attempts < MAX_ATTEMPTS) {
          // Generate a color with high saturation and medium brightness
          const hue = Math.random();
          const saturation = 0.7 + Math.random() * 0.3; // High saturation
          const lightness = 0.4 + Math.random() * 0.2; // Medium lightness

          const newColor = this.hslToRgb(hue, saturation, lightness);

          // Check if the color is unique enough from all used colors
          let isUnique = true;
          for (const usedColor of allUsedColors) {
            if (this.getColorDistance(newColor, usedColor) < MIN_COLOR_DISTANCE) {
              isUnique = false;
              break;
            }
          }

          if (isUnique) {
            const newColorCopy = { ...newColor };
            this.usedRandomColors.add(newColorCopy);
            this.lockedColors.set(socketId, newColorCopy);
            return newColorCopy;
          }

          attempts++;
        }

        // Last resort: generate maximally distinct color
        const newColor: Color = {
          r: 0.1 + (Math.random() * 0.2),
          g: 0.1 + (Math.random() * 0.2),
          b: 0.1 + (Math.random() * 0.2)
        };

        // Randomly choose which component gets the max value
        const component = Math.random() < 0.33 ? 'r' : Math.random() < 0.5 ? 'g' : 'b';
        newColor[component as keyof Color] = 1.0;

        const newColorCopy = { ...newColor };
        this.usedRandomColors.add(newColorCopy);
        this.lockedColors.set(socketId, newColorCopy);
        return newColorCopy;
      } catch (error) {
        throw error;
      }
    });
  }

  private startDiagnostics(): void {
    if (this.isTestMode) {
      return; // Don't start diagnostics in test mode
    }

    // Clear any existing interval
    if (this.diagnosticsInterval) {
      clearInterval(this.diagnosticsInterval);
    }

    this.diagnosticsInterval = setInterval(() => {
      const now = Date.now();
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

    // Prevent the interval from keeping the process alive
    this.diagnosticsInterval.unref();
  }

  /**
   * Verify the state of all connected clients
   */
  private verifyAllClientsState(): void {
    this.players.forEach((player, socketId) => {
      const expectedColor = this.lockedColors.get(socketId);
      if (!expectedColor) return;

      const socket = this.io.sockets.sockets.get(socketId);
      if (!socket) return;

      // Request client's current state
      socket.emit('request_client_state', {
        timestamp: Date.now(),
        expectedState: {
          color: expectedColor,
          position: player.position
        }
      });
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Player connected: ${socket.id}`);

      // Handle ping
      socket.on(GameEvent.PING, () => {
        socket.emit(GameEvent.PONG, { timestamp: Date.now() });
      });

      // Add debug state request handler
      socket.on('debug_request_state', () => {
        const debugState = {
          players: Array.from(this.players.entries()).map(([id, player]) => ({
            id,
            position: player.position,
            color: player.color,
            expectedColor: this.lockedColors.get(id)
          })),
          colorPool: {
            available: this.availableColors,
            locked: Array.from(this.lockedColors.entries()),
            random: Array.from(this.usedRandomColors),
            total: this.colorPool
          },
          diagnostics: {
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            fps: this.fps,
            playerCount: this.players.size,
            colorPoolSize: this.colorPool.length,
            availableColors: this.availableColors.length,
            lockedColors: this.lockedColors.size,
            randomColors: this.usedRandomColors.size,
            connections: this.io.engine.clientsCount
          }
        };

        // Send debug state back to the requesting client
        socket.emit('debug_state', debugState);
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
          color: playerColor,
          lastActivity: Date.now()
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
        socket.emit(GameEvent.PLAYER_JOINED, player);
        
        // Send the map data to the client
        socket.emit(GameEvent.MAP_DATA, this.mapData);
        
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

      // Handle client state response
      socket.on('client_state_response', (_clientState: { 
        position: Position; 
        color: Color;
        timestamp: number;
      }) => {
        const player = this.players.get(socket.id);
        const expectedColor = this.lockedColors.get(socket.id);
        
        if (!player || !expectedColor) {
          socket.emit('state_verification_failed', { error: 'Player not found' });
          return;
        }

        const colorDrift = Math.abs(clientState.color.r - expectedColor.r) +
                         Math.abs(clientState.color.g - expectedColor.g) +
                         Math.abs(clientState.color.b - expectedColor.b);

        const positionDrift = Math.abs(clientState.position.x - player.position.x) +
                            Math.abs(clientState.position.y - player.position.y) +
                            Math.abs(clientState.position.z - player.position.z);

        const driftReport = {
          colorDrift,
          positionDrift,
          expectedState: {
            color: expectedColor,
            position: player.position
          },
          needsCorrection: colorDrift > 0.01 || positionDrift > 0.1,
          timestamp: clientState.timestamp
        };

        socket.emit('state_verification_result', driftReport);

        // If significant drift detected, force correction
        if (driftReport.needsCorrection) {
          socket.emit('force_state_correction', {
            color: expectedColor,
            position: player.position
          });
        }
      });
    });
  }

  public getIO(): Server {
    return this.io;
  }

  /**
   * Closes the game server and cleans up resources
   */
  public close(): void {
    // Clear the diagnostics interval if it exists
    if (this.diagnosticsInterval) {
      clearInterval(this.diagnosticsInterval);
      this.diagnosticsInterval = undefined;
    }

    // Clear the state verification interval if it exists
    if (this.stateVerificationInterval) {
      clearInterval(this.stateVerificationInterval);
      this.stateVerificationInterval = undefined;
    }

    // Remove all socket listeners to allow garbage collection
    if (this.io) {
      this.io.removeAllListeners();
      
      // Close all connections
      const connectedSockets = this.io.sockets.sockets;
      connectedSockets.forEach((socket) => {
        socket.disconnect(true);
      });
      
      // Close the socket.io server
      this.io.close();
    }
  }

  private handlePlayerJoin(socket: Socket, data: { position: { x: number; y: number; z: number } }): void {
    const playerId = uuidv4();
    const color = this.getNextColor();
    
    const player: Player = {
      id: playerId,
      position: data.position,
      rotation: { x: 0, y: 0, z: 0 },
      color,
      lastActivity: Date.now()
    };

    this.players.set(playerId, player);
    socket.data.playerId = playerId;

    // Notify the joining player of their ID and color
    socket.emit(GameEvent.PLAYER_JOINED, player);

    // Broadcast to all other players
    socket.broadcast.emit(GameEvent.PLAYER_JOINED, player);

    // Send current players list to the new player
    socket.emit(GameEvent.PLAYERS_LIST, Array.from(this.players.values()));
  }

  private handlePositionUpdate(socket: Socket, data: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } }): void {
    const playerId = socket.data.playerId;
    if (!playerId) return;

    const player = this.players.get(playerId);
    if (!player) return;

    player.position = data.position;
    player.rotation = data.rotation;

    // Broadcast to all other players
    socket.broadcast.emit(GameEvent.PLAYER_MOVED, {
      id: playerId,
      position: data.position,
      rotation: data.rotation
    });
  }

  private handlePlayerDisconnect(socket: Socket): void {
    const playerId = socket.data.playerId;
    if (!playerId) return;

    const player = this.players.get(playerId);
    if (!player) return;

    // Release the player's color
    this.releaseColor(player.color);

    // Remove the player
    this.players.delete(playerId);

    // Notify other players
    socket.broadcast.emit(GameEvent.PLAYER_LEFT, playerId);
  }

  private updateDiagnostics(): void {
    const now = Date.now();
    this.lastDiagnosticsUpdate = now;

    const diagnostics: ServerDiagnostics = {
      uptime: now - this.startTime,
      playerCount: this.players.size,
      fps: this.fps,
      colorPoolSize: this.colorPool.length,
      availableColors: this.availableColors.length,
      lockedColors: this.lockedColors.size,
      randomColors: this.usedRandomColors.size,
      connections: this.io.engine.clientsCount
    };

    this.io.emit(GameEvent.SERVER_DIAGNOSTICS, diagnostics);
  }

  private generateRandomColor(): Color {
    const hue = Math.random();
    const saturation = 0.7 + Math.random() * 0.3; // High saturation
    const lightness = 0.5 + Math.random() * 0.2; // Medium to high brightness
    return this.hslToRgb(hue, saturation, lightness);
  }

  private getNextColor(): Color {
    if (this.availableColors.length > 0) {
      const color = this.availableColors.pop();
      if (!color) {
        // This should never happen since we checked length > 0
        throw new Error('No available colors despite length check');
      }
      return {
        r: color.r,
        g: color.g,
        b: color.b
      };
    }

    // Generate a random color if no predefined colors are available
    return this.generateRandomColor();
  }

  private releaseColor(color: Color): void {
    this.recycleColor(color);
  }

  // Generate the map data that will be shared with all clients
  private generateMapData(): MapData {
    const worldSize = 100;
    const obstacles: ObstacleData[] = [];
    
    // Create some random obstacles - cubes and cylinders
    for (let i = 0; i < 20; i++) {
      // Decide on shape type
      const type = Math.random() > 0.5 ? 'cube' as const : 'cylinder' as const;
      
      // Generate random position
      const x = (Math.random() - 0.5) * (worldSize - 10);
      const z = (Math.random() - 0.5) * (worldSize - 10);
      
      let obstacleData: ObstacleData;
      
      if (type === 'cube') {
        // Create a cube with random size
        const size = 0.5 + Math.random() * 2;
        obstacleData = {
          type,
          position: { x, y: size / 2, z },
          scale: { x: 1, y: 1 + Math.random() * 3, z: 1 },
          color: this.generateRandomRGBColor(),
          size
        };
      } else {
        // Create a cylinder with random height and radius
        const radius = 0.5 + Math.random() * 1;
        const height = 1 + Math.random() * 3;
        obstacleData = {
          type,
          position: { x, y: height / 2, z },
          scale: { x: 1, y: 1, z: 1 },
          color: this.generateRandomRGBColor(),
          radius,
          height
        };
      }
      
      obstacles.push(obstacleData);
    }
    
    return { worldSize, obstacles };
  }
  
  // Generate a random RGB color for obstacles
  private generateRandomRGBColor(): Color {
    // Random color with HSL to get nice vibrant colors
    const hue = Math.random();
    // Use fixed saturation and lightness for vibrant colors
    const s = 0.7;
    const l = 0.5;
    
    // Convert HSL to RGB
    return this.hslToRgb(hue, s, l);
  }

  /**
   * Add a new endpoint to expose debug state
   */
  private setupDebugEndpoints(): void {
    if (!this.io) return;

    // Request for debug state
    this.io.on('connection', (socket: Socket) => {
      socket.on('request_debug_state', () => {
        // Send detailed debug state to client
        const debugState: DebugState = {
          players: Array.from(this.players.values()).map(player => ({
            id: player.id,
            position: player.position,
            color: player.color,
            // Include expected color from locked colors map if available
            expectedColor: this.lockedColors.get(player.id)
          })),
          colorPool: {
            available: this.availableColors,
            locked: Array.from(this.lockedColors.entries()),
            random: Array.from(this.usedRandomColors),
            total: [...this.availableColors, ...Array.from(this.lockedColors.values()), ...Array.from(this.usedRandomColors)]
          },
          diagnostics: {
            connections: this.io ? this.io.engine.clientsCount : 0,
            totalMessages: this.totalMessages,
            averageUpdateRate: this.messageRates.reduce((sum: number, rate: number) => sum + rate, 0) / 
                              (this.messageRates.length || 1),
            playerCount: this.players.size,
            startTime: this.startTime,
            uptime: Date.now() - this.startTime
          }
        };
        
        socket.emit('debug_state', debugState);
      });
      
      // Request to verify local player state against server state
      socket.on('verify_player_state', () => {
        const player = this.players.get(socket.id);
        const expectedColor = this.lockedColors.get(socket.id);
        
        if (!player || !expectedColor) {
          socket.emit('verification_failed', { error: 'Player not found' });
          return;
        }
        
        socket.emit('state_verification', {
          expected: {
            id: player.id,
            position: player.position,
            color: expectedColor
          },
          timestamp: Date.now()
        });
      });
      
      // Client reports its state for verification
      socket.on('client_state_response', (_clientState: { 
        position: Position; 
        color: Color;
        timestamp: number;
      }) => {
        // Rest of the client_state_response handler remains the same
      });
    });
  }
} 