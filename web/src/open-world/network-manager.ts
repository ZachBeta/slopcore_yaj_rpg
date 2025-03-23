import * as THREE from 'three';
import { Player } from './player';
import { Socket, io } from 'socket.io-client';
import { GameEvent, GameEventPayloads, GameEventEmitter } from '../constants';

// Define the callback types
type PlayerJoinCallback = (id: string, position: THREE.Vector3, color: THREE.Color) => void;
type PlayerLeaveCallback = (id: string) => void;
type PlayerPositionUpdateCallback = (id: string, position: THREE.Vector3) => void;
type ConnectionStatusCallback = (status: 'connected' | 'disconnected' | 'error', error?: any) => void;

// Define HSL type
interface HSL {
  h: number;
  s: number;
  l: number;
}

interface Diagnostics {
  status: string;
  ping: number;
  fps: number;
  playerCount: number;
  uptime: number;
  colorPoolSize: number;
  availableColors: number;
  connections: number;
}

export class NetworkManager implements GameEventEmitter {
  private localPlayer: Player;
  private onPlayerJoin: PlayerJoinCallback;
  private onPlayerLeave: PlayerLeaveCallback;
  private onPlayerPositionUpdate: PlayerPositionUpdateCallback;
  private onConnectionStatus?: ConnectionStatusCallback;
  private lastPositionUpdate: number = 0;
  private updateInterval: number = 100; // Update every 100ms
  private socket: Socket | null = null;
  private playerColor: THREE.Color;
  private static usedHues: Set<number> = new Set();
  private otherPlayers: Map<string, boolean> = new Map(); // Track other players we've seen
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 5;
  private connectionUrl: string = '';
  private isConnected: boolean = false;
  private connectionRetryTimeout: any = null;
  private lastPing: number = 0;
  private lastPingTime: number = 0;
  private diagnosticsDiv: HTMLDivElement | null = null;
  private pingInterval: number = 1000;
  private eventHandlers: Map<GameEvent, Set<(payload: any) => void>> = new Map();

  // Default server URL for development
  private static readonly DEFAULT_SERVER_URL = 'http://localhost:3000';
  // Server URL for testing
  private static readonly TEST_SERVER_URL = 'http://localhost:3001';

  /**
   * Get the appropriate server URL based on environment
   */
  private static getServerUrl(): string {
    // Check if we're in a test environment
    if (process.env.NODE_ENV === 'test') {
      return NetworkManager.TEST_SERVER_URL;
    }
    // Use environment variable if set, otherwise fall back to default
    return process.env.SOCKET_SERVER_URL || NetworkManager.DEFAULT_SERVER_URL;
  }

  /**
   * Create a new network manager
   * @param localPlayer The local player instance
   * @param onPlayerJoin Callback for when a player joins
   * @param onPlayerLeave Callback for when a player leaves
   * @param onPlayerPositionUpdate Callback for when a player's position updates
   * @param onConnectionStatus Optional callback for connection status updates
   */
  constructor(
    localPlayer: Player,
    onPlayerJoin: PlayerJoinCallback,
    onPlayerLeave: PlayerLeaveCallback,
    onPlayerPositionUpdate: PlayerPositionUpdateCallback,
    onConnectionStatus?: ConnectionStatusCallback
  ) {
    this.localPlayer = localPlayer;
    this.onPlayerJoin = onPlayerJoin;
    this.onPlayerLeave = onPlayerLeave;
    this.onPlayerPositionUpdate = onPlayerPositionUpdate;
    this.onConnectionStatus = onConnectionStatus;
    
    // Don't set the color here, wait for server assignment
    this.playerColor = new THREE.Color(0xCCCCCC); // Temporary gray color
    this.localPlayer.setColor(this.playerColor);
    this.setupDiagnostics();
    this.socket = io(NetworkManager.getServerUrl());
    this.setupSocketEvents();
  }

  private setupDiagnostics() {
    // Create diagnostics overlay
    this.diagnosticsDiv = document.createElement('div');
    this.diagnosticsDiv.id = 'diagnostics';
    this.diagnosticsDiv.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: #00ff00;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      border-radius: 5px;
      min-width: 200px;
    `;
    document.body.appendChild(this.diagnosticsDiv);

    // Initialize with connecting status
    this.updateDiagnostics({
      status: 'Connecting...',
      ping: 0,
      fps: 0,
      playerCount: 0,
      uptime: 0,
      colorPoolSize: 0,
      availableColors: 0,
      connections: 0
    });

    // Start ping interval
    setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.lastPing = Date.now();
        this.socket.emit('ping');
      }
    }, this.pingInterval);
  }

  private updateDiagnostics(data: Partial<Diagnostics>) {
    if (!this.diagnosticsDiv) return;

    const diagnostics = {
      status: data.status || (this.isConnected ? 'Connected' : 'Disconnected'),
      ping: `${data.ping || (Date.now() - this.lastPing)}ms`,
      fps: `${data.fps || 0} FPS`,
      players: `${data.playerCount || this.otherPlayers.size + 1} players`,
      uptime: data.uptime ? `${Math.floor(data.uptime / 60)}:${(data.uptime % 60).toString().padStart(2, '0')}` : '0:00',
      colors: data.colorPoolSize ? `${data.availableColors}/${data.colorPoolSize} available` : 'N/A',
      connections: `${data.connections || this.otherPlayers.size + 1} connected`
    };

    this.diagnosticsDiv.innerHTML = Object.entries(diagnostics)
      .map(([key, value]) => `${key}: ${value}`)
      .join('<br>');
  }

  /**
   * Connect to a Socket.IO server
   * @param url Optional server URL to connect to. If not provided, uses environment-based URL
   */
  public connect(url?: string): void {
    if (this.socket) {
      this.disconnect();
    }
    
    this.connectionUrl = url || NetworkManager.getServerUrl();
    this.connectionAttempts = 0;
    this.connectToServer();
  }

  /**
   * Connect to the Socket.IO server with retry logic
   */
  private connectToServer(): void {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.error(`Failed to connect after ${this.maxConnectionAttempts} attempts.`);
      this.onConnectionStatus?.('error', new Error('Max connection attempts reached'));
      return;
    }

    this.connectionAttempts++;
    console.log(`Attempting to connect to Socket.io server at ${this.connectionUrl} (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
    
    this.socket = io(this.connectionUrl, {
      reconnectionAttempts: 3,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  /**
   * Setup all Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Handle connection events
    this.socket.on('connect', () => {
      console.log('Connected to server with ID:', this.socket?.id);
      this.isConnected = true;
      this.connectionAttempts = 0;
      this.onConnectionStatus?.('connected');
      
      // Send initial player data without color
      const playerData = {
        position: this.localPlayer.getPosition(),
        rotation: this.localPlayer.getRotation()
      };
      console.log('Sending player_join with data:', playerData);
      this.socket?.emit('player_join', playerData);
    });

    // Handle color assignment from server
    this.socket.on('color_assigned', (data: { color: { r: number, g: number, b: number } }) => {
      console.log('Received color assignment:', data);
      this.playerColor = new THREE.Color(data.color.r, data.color.g, data.color.b);
      this.localPlayer.setColor(this.playerColor);
    });

    // Handle connect error
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.onConnectionStatus?.('error', error);
      
      // Try to reconnect
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        clearTimeout(this.connectionRetryTimeout);
        this.connectionRetryTimeout = setTimeout(() => {
          this.connectToServer();
        }, 2000);
      }
    });

    // Handle disconnect
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
      this.onConnectionStatus?.('disconnected');
      this.otherPlayers.clear(); // Clear other players on disconnect
    });

    // Handle receiving list of existing players
    this.socket.on('players_list', (players: any[]) => {
      console.log('Received players_list event with players:', players);
      players.forEach(player => {
        if (player.id !== this.socket?.id && !this.otherPlayers.has(player.id)) {
          this.otherPlayers.set(player.id, true);
          console.log('Adding existing player from players_list:', player.id);
          const position = new THREE.Vector3(
            player.position.x,
            player.position.y,
            player.position.z
          );
          const color = new THREE.Color(
            player.color.r,
            player.color.g,
            player.color.b
          );
          this.onPlayerJoin(player.id, position, color);
        }
      });
    });

    // Handle new player joining
    this.socket.on('player_joined', (data: any) => {
      console.log('Player joined:', data);
      if (data.id !== this.socket?.id && !this.otherPlayers.has(data.id)) {
        this.otherPlayers.set(data.id, true);
        const position = new THREE.Vector3(
          data.position.x,
          data.position.y,
          data.position.z
        );
        const color = new THREE.Color(
          data.color.r,
          data.color.g,
          data.color.b
        );
        this.onPlayerJoin(data.id, position, color);
      }
    });

    // Handle player leaving
    this.socket.on('player_left', (playerId: string) => {
      console.log('Received player_left event for:', playerId);
      this.otherPlayers.delete(playerId);
      this.onPlayerLeave(playerId);
    });

    // Handle player movement updates
    this.socket.on('player_moved', (data: any) => {
      this.onPlayerPositionUpdate(
        data.id,
        new THREE.Vector3(
          data.position.x,
          data.position.y,
          data.position.z
        )
      );
    });

    // Handle server diagnostics
    this.socket.on('server_diagnostics', (data: any) => {
      this.updateDiagnostics(data);
    });

    // Handle pong
    this.socket.on('pong', (data: { timestamp: number }) => {
      this.lastPingTime = Date.now() - data.timestamp;
      this.updateDiagnostics({ ping: this.lastPingTime });
    });
  }

  /**
   * Send player position update to server
   */
  public sendPositionUpdate(position: THREE.Vector3): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    const now = performance.now();
    
    // Only send updates at a certain rate to reduce network traffic
    if (now - this.lastPositionUpdate < this.updateInterval) {
      return;
    }
    
    this.lastPositionUpdate = now;
    
    // Send position update to server
    this.socket.emit('position_update', {
      position: {
        x: position.x,
        y: position.y,
        z: position.z
      },
      rotation: this.localPlayer.getRotation()
    });
  }
  
  /**
   * Disconnect from the server
   */
  public disconnect(): void {
    if (this.socket) {
      // Clean up our color
      this.playerColor = new THREE.Color(0xCCCCCC); // Temporary gray color
      this.localPlayer.setColor(this.playerColor);
      this.socket.disconnect();
      this.socket = null;
    }
    
    clearTimeout(this.connectionRetryTimeout);
    this.isConnected = false;
    this.otherPlayers.clear();
  }

  /**
   * Check if the manager is connected to the server
   */
  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  private setupSocketEvents(): void {
    // Forward all socket events to our event handlers
    Object.values(GameEvent).forEach(event => {
      this.socket?.on(event, (payload: any) => {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
          handlers.forEach(handler => handler(payload));
        }
      });
    });
  }

  on<T extends GameEvent>(event: T, listener: (payload: GameEventPayloads[T]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(listener);
  }

  emit<T extends GameEvent>(event: T, payload: GameEventPayloads[T]): void {
    this.socket?.emit(event, payload);
  }

  off<T extends GameEvent>(event: T, listener: (payload: GameEventPayloads[T]) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(listener);
    }
  }
} 