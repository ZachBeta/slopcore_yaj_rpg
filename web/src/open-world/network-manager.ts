import * as THREE from 'three';
import { Player } from './player';
import { io, Socket } from 'socket.io-client';
import { GameEvent, GameEventPayloads, ConnectionStatus } from '../constants';
import { DebugState } from '../types';

// Define EventHandler type
type EventHandler<T extends GameEvent> = (payload: GameEventPayloads[T]) => void;

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

export class NetworkManager {
  private socket: Socket | null = null;
  private localPlayer: Player;
  private onPlayerJoin: (id: string, position: THREE.Vector3, color: THREE.Color) => void;
  private onPlayerLeave: (id: string) => void;
  private onPositionUpdate: (id: string, position: THREE.Vector3) => void;
  private onConnectionStatus: (status: ConnectionStatus, error?: Error) => void;
  private lastPositionUpdate: number = 0;
  private updateInterval: number = 1000 / 30; // 30 updates per second
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private eventHandlers: Map<GameEvent, Set<EventHandler<GameEvent>>> = new Map();
  private playerColor: THREE.Color;
  private static usedHues: Set<number> = new Set();
  private otherPlayers: Map<string, boolean> = new Map(); // Track other players we've seen
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 5;
  private connectionUrl: string = '';
  private connectionRetryTimeout: NodeJS.Timeout | null = null;
  private lastPing: number = 0;
  private lastPingTime: number = 0;
  private diagnosticsDiv: HTMLDivElement | null = null;
  private pingInterval: number = 1000;
  private debugState: DebugState | null = null;
  private debugStateListeners: Set<(state: DebugState) => void> = new Set();
  private diagnosticsInterval: NodeJS.Timeout | null = null;
  private pingIntervalId: NodeJS.Timeout | null = null;

  // Default server URL for development
  private static readonly DEFAULT_SERVER_URL = 'http://localhost:8080';
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
   * @param onPositionUpdate Callback for when a player's position updates
   * @param onConnectionStatus Optional callback for connection status updates
   */
  constructor(
    localPlayer: Player,
    onPlayerJoin: (id: string, position: THREE.Vector3, color: THREE.Color) => void,
    onPlayerLeave: (id: string) => void,
    onPositionUpdate: (id: string, position: THREE.Vector3) => void,
    onConnectionStatus: (status: ConnectionStatus, error?: Error) => void
  ) {
    // Clean up any existing diagnostics div from previous instances
    const existingDiagnostics = document.getElementById('diagnostics');
    if (existingDiagnostics) {
      existingDiagnostics.remove();
    }

    this.localPlayer = localPlayer;
    this.onPlayerJoin = onPlayerJoin;
    this.onPlayerLeave = onPlayerLeave;
    this.onPositionUpdate = onPositionUpdate;
    this.onConnectionStatus = onConnectionStatus;
    
    // Don't set the color here, wait for server assignment
    this.playerColor = new THREE.Color(0xCCCCCC); // Temporary gray color
    this.localPlayer.setColor(this.playerColor);
    this.setupDiagnostics();
    
    // Initialize event handlers for all game events
    Object.values(GameEvent).forEach(event => {
      this.eventHandlers.set(event, new Set());
    });
    
    // Start connection to server
    this.connect();
  }
  
  /**
   * Set up the debug state handler
   */
  private addDebugStateHandler(): void {
    if (!this.socket) return;
    
    this.socket.on('debug_state', (state: DebugState) => {
      this.debugState = state;
      this.debugStateListeners.forEach(listener => listener(state));
      
      // Log color mismatches
      const localPlayerState = state.players.find((p) => p.id === this.socket?.id);
      if (localPlayerState) {
        const currentColor = this.localPlayer.getColor();
        const expectedColor = localPlayerState.expectedColor;
        
        if (expectedColor && (
          Math.abs(currentColor.r - expectedColor.r) > 0.01 ||
          Math.abs(currentColor.g - expectedColor.g) > 0.01 ||
          Math.abs(currentColor.b - expectedColor.b) > 0.01
        )) {
          console.warn('Color mismatch detected!');
          console.table({
            current: {
              r: currentColor.r.toFixed(3),
              g: currentColor.g.toFixed(3),
              b: currentColor.b.toFixed(3)
            },
            expected: {
              r: expectedColor.r.toFixed(3),
              g: expectedColor.g.toFixed(3),
              b: expectedColor.b.toFixed(3)
            }
          });
        }
      }

      // Pretty print the debug state
      console.group('Server State');
      console.log('Players:', state.players.length);
      console.table(state.players.map((p) => ({
        id: p.id,
        color: `rgb(${p.color.r * 255}, ${p.color.g * 255}, ${p.color.b * 255})`,
        x: p.position.x.toFixed(2),
        y: p.position.y.toFixed(2),
        z: p.position.z.toFixed(2)
      })));
      console.log('Color Pool:', {
        available: state.colorPool.available.length,
        locked: state.colorPool.locked.length,
        random: state.colorPool.random.length
      });
      console.log('Diagnostics:', state.diagnostics);
      console.groupEnd();
    });
  }

  private setupDiagnostics() {
    // Create diagnostics overlay
    if (this.diagnosticsDiv) {
      document.body.removeChild(this.diagnosticsDiv);
    }
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
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
    }
    this.pingIntervalId = setInterval(() => {
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
    // Clean up any existing connection
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
    // Clean up existing connection if any
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.error(`Failed to connect after ${this.maxConnectionAttempts} attempts.`);
      this.onConnectionStatus?.(ConnectionStatus.ERROR, new Error('Max connection attempts reached'));
      return;
    }

    this.connectionAttempts++;
    console.log(`Attempting to connect to Socket.io server at ${this.connectionUrl} (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
    
    try {
      // Create socket with better connection options
      this.socket = io(this.connectionUrl, {
        reconnectionAttempts: this.maxConnectionAttempts,
        timeout: 10000,
        // Start with polling, which is more reliable for initial connection
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        forceNew: true
      });
      
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create socket connection:', error);
      this.handleConnectionError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Handle connection errors with retry logic
   */
  private handleConnectionError(error: Error): void {
    console.error('Connection error:', error);
    this.onConnectionStatus?.(ConnectionStatus.ERROR, error);
    
    // Try to reconnect with a limit
    if (this.connectionAttempts < this.maxConnectionAttempts) {
      if (this.connectionRetryTimeout) {
        clearTimeout(this.connectionRetryTimeout);
        this.connectionRetryTimeout = null;
      }
      
      // Exponential backoff for retries
      const delay = Math.min(2000 * Math.pow(1.5, this.connectionAttempts), 30000);
      
      console.log(`Will retry connection in ${delay}ms (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
      
      this.connectionRetryTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.log(`Retrying connection (attempt ${this.connectionAttempts + 1}/${this.maxConnectionAttempts})`);
          this.connectToServer();
        }
      }, delay);
    } else {
      // Stop trying after max attempts
      console.error(`Failed to connect after ${this.maxConnectionAttempts} attempts`);
      this.disconnect(); // Clean disconnect to prevent further retries
    }
  }

  /**
   * Setup all Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Clear existing event handlers first to prevent duplicates
    this.socket.removeAllListeners();

    // Set up event handlers here
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.onConnectionStatus?.(ConnectionStatus.CONNECTED);
      this.connectionAttempts = 0;
      
      // Log transport being used
      try {
        console.log('Using transport:', this.socket?.io.engine.transport.name);
      } catch (_error) {
        console.log('Could not determine transport type');
      }
      
      // Notify listeners
      this.eventHandlers.get(GameEvent.CONNECTION_STATUS)?.forEach(handler => {
        handler(ConnectionStatus.CONNECTED);
      });
      
      // Join the game
      this.socket?.emit(GameEvent.PLAYER_JOIN, {
        position: {
          x: this.localPlayer.getPosition().x,
          y: this.localPlayer.getPosition().y,
          z: this.localPlayer.getPosition().z
        },
        rotation: this.localPlayer.getRotation()
      });
    });

    // Handle connect error with limited retries
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.onConnectionStatus?.(ConnectionStatus.ERROR, error);
      this.handleConnectionError(error);
    });

    // Handle disconnect
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.isConnected = false;
      this.onConnectionStatus?.(ConnectionStatus.DISCONNECTED);
      this.otherPlayers.clear(); // Clear other players on disconnect
      
      // If server closed the connection or there was a transport error, try to reconnect
      if (['transport close', 'transport error', 'ping timeout', 'io server disconnect'].includes(reason)) {
        this.handleConnectionError(new Error(reason));
      }
    });
    
    // Set up forwarding for all game events
    Object.values(GameEvent).forEach(event => {
      this.socket?.on(event, (payload: unknown) => {
        const handlers = this.eventHandlers.get(event as GameEvent);
        if (handlers) {
          handlers.forEach(handler => handler(payload as GameEventPayloads[typeof event]));
        }
      });
    });
    
    // Set up other event handlers
    this.addDebugStateHandler();
    this.setupGameEvents();
  }
  
  /**
   * Set up game-specific event handlers
   */
  private setupGameEvents(): void {
    if (!this.socket) return;
    
    // Handle map data from server
    this.socket.on(GameEvent.MAP_DATA, (mapData: GameEventPayloads[typeof GameEvent.MAP_DATA]) => {
      console.log('Received map data from server:', mapData);
    });

    // Handle receiving list of existing players
    this.socket.on(GameEvent.PLAYERS_LIST, (players: GameEventPayloads[typeof GameEvent.PLAYERS_LIST]) => {
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

    // Handle individual player join events
    this.socket.on(GameEvent.PLAYER_JOINED, (player: GameEventPayloads[typeof GameEvent.PLAYER_JOINED]) => {
      console.log('Received player_joined event:', player);
      if (player.id !== this.socket?.id && !this.otherPlayers.has(player.id)) {
        this.otherPlayers.set(player.id, true);
        console.log('Adding new player from player_joined:', player.id);
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

    // Handle player leave events
    this.socket.on(GameEvent.PLAYER_LEFT, (playerId: GameEventPayloads[typeof GameEvent.PLAYER_LEFT]) => {
      console.log('Player left:', playerId);
      if (this.otherPlayers.has(playerId)) {
        this.otherPlayers.delete(playerId);
        this.onPlayerLeave(playerId);
      }
    });

    // Handle position updates
    this.socket.on(GameEvent.POSITION_UPDATE, (data: { id: string; position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } }) => {
      if (data.id !== this.socket?.id) {
        const position = new THREE.Vector3(
          data.position.x,
          data.position.y,
          data.position.z
        );
        this.onPositionUpdate(data.id, position);
      }
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
    // Clean up the socket
    if (this.socket) {
      // Clean up our color
      this.playerColor = new THREE.Color(0xCCCCCC); // Temporary gray color
      this.localPlayer.setColor(this.playerColor);
      
      // Clean up socket
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Clean up all resources
    this.cleanup();
  }

  /**
   * Check if the manager is connected to the server
   */
  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  private setupSocketEvents(): void {
    // No need for this method as we set up all event handlers in setupEventHandlers
    // Keeping this empty to avoid breaking existing code
  }

  public on<T extends GameEvent>(event: T, listener: EventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(listener as EventHandler<GameEvent>);
  }

  public off<T extends GameEvent>(event: T, listener: EventHandler<T>): void {
    this.eventHandlers.get(event)?.delete(listener as EventHandler<GameEvent>);
  }

  /**
   * Request current server state
   */
  public requestDebugState(): void {
    this.socket?.emit('debug_request_state');
  }

  /**
   * Subscribe to debug state updates
   */
  public onDebugState(callback: (state: DebugState) => void): () => void {
    this.debugStateListeners.add(callback);
    if (this.debugState) {
      callback(this.debugState);
    }
    return () => this.debugStateListeners.delete(callback);
  }

  /**
   * Request state verification from server
   */
  public verifyClientState(): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot verify state: not connected to server');
      return;
    }

    const currentPosition = this.localPlayer.getPosition();
    const currentColor = this.localPlayer.getColor();

    const stateData = {
      position: {
        x: currentPosition.x,
        y: currentPosition.y,
        z: currentPosition.z
      },
      color: {
        r: currentColor.r,
        g: currentColor.g,
        b: currentColor.b
      }
    };

    console.log('Sending state verification request:', stateData);
    this.socket.emit('verify_client_state', stateData);
  }

  private handleError(error: Error): void {
    console.error('Network error:', error);
    this.isConnected = false;
    this.onConnectionStatus(ConnectionStatus.ERROR, error);
  }

  private handleMaxConnectionAttempts(): void {
    console.error('Max connection attempts reached');
    this.isConnected = false;
    this.onConnectionStatus?.(ConnectionStatus.ERROR, new Error('Max connection attempts reached'));
  }

  private handleSocketConnect(): void {
    console.log('Connected to server');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.onConnectionStatus?.(ConnectionStatus.CONNECTED);
  }

  private handleSocketError(error: Error): void {
    console.error('Socket error:', error);
    this.isConnected = false;
    this.onConnectionStatus?.(ConnectionStatus.ERROR, error);
  }

  private handleSocketDisconnect(): void {
    console.log('Disconnected from server');
    this.isConnected = false;
    this.onConnectionStatus?.(ConnectionStatus.DISCONNECTED);
  }

  /**
   * Clean up all resources
   */
  private cleanup(): void {
    // Clear intervals
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
    if (this.diagnosticsInterval) {
      clearInterval(this.diagnosticsInterval);
      this.diagnosticsInterval = null;
    }
    if (this.connectionRetryTimeout) {
      clearTimeout(this.connectionRetryTimeout);
      this.connectionRetryTimeout = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Remove DOM elements
    if (this.diagnosticsDiv) {
      if (document.body.contains(this.diagnosticsDiv)) {
        document.body.removeChild(this.diagnosticsDiv);
      }
      this.diagnosticsDiv = null;
    }

    // Clean up any orphaned diagnostics divs
    const existingDiagnostics = document.getElementById('diagnostics');
    if (existingDiagnostics) {
      existingDiagnostics.remove();
    }

    // Clear event handlers
    this.eventHandlers.forEach(handlers => {
      handlers.forEach(handler => {
        // Remove each handler from socket events
        if (this.socket) {
          Object.values(GameEvent).forEach(event => {
            this.socket?.off(event, handler as (...args: any[]) => void);
          });
        }
      });
      handlers.clear();
    });
    this.eventHandlers.clear();
    this.debugStateListeners.clear();

    // Reset state
    this.otherPlayers.clear();
    this.debugState = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.lastPing = 0;
    this.lastPingTime = 0;
  }

  /**
   * Destroy the network manager and clean up all resources
   * Call this when the game is shutting down
   */
  public destroy(): void {
    this.disconnect();
    this.cleanup();
  }
}

// Enable Hot Module Replacement
declare const module: { hot?: { accept: (callback: (err: Error | null) => void) => void } };
if (module.hot) {
  module.hot.accept((err: Error | null) => {
    if (err) {
      console.error('Error accepting HMR update', err);
    }
  });
} 