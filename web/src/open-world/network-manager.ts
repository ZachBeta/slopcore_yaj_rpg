import * as THREE from 'three';
import { Player } from './player';
import { io, Socket } from 'socket.io-client';
import { GameEvent, GameEventPayloads, ConnectionStatus } from '../constants';

// Define the callback types
type PlayerJoinCallback = (id: string, position: THREE.Vector3, color: THREE.Color) => void;
type PlayerLeaveCallback = (id: string) => void;
type PlayerPositionUpdateCallback = (id: string, position: THREE.Vector3) => void;
type ConnectionStatusCallback = (status: ConnectionStatus, error?: Error) => void;

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

type EventHandler<T extends GameEvent> = (payload: GameEventPayloads[T]) => void;

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
  private debugState: Record<string, unknown> | null = null;
  private debugStateListeners: Set<(state: Record<string, unknown>) => void> = new Set();

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
    this.localPlayer = localPlayer;
    this.onPlayerJoin = onPlayerJoin;
    this.onPlayerLeave = onPlayerLeave;
    this.onPositionUpdate = onPositionUpdate;
    this.onConnectionStatus = onConnectionStatus;
    
    // Don't set the color here, wait for server assignment
    this.playerColor = new THREE.Color(0xCCCCCC); // Temporary gray color
    this.localPlayer.setColor(this.playerColor);
    this.setupDiagnostics();
    this.socket = io(NetworkManager.getServerUrl());
    this.setupSocketEvents();

    // Add debug state listener
    this.socket?.on('debug_state', (state: any) => {
      this.debugState = state;
      this.debugStateListeners.forEach(listener => listener(state));
      
      // Log color mismatches
      const localPlayerState = state.players.find((p: any) => p.id === this.socket?.id);
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
      console.table(state.players.map((p: any) => ({
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
      this.onConnectionStatus?.(ConnectionStatus.ERROR, new Error('Max connection attempts reached'));
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
      this.onConnectionStatus?.(ConnectionStatus.CONNECTED);
      
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
      console.group('Color Assignment');
      console.log('Received color assignment:', data);
      
      // Create a new color instance with the assigned RGB values
      const assignedColor = new THREE.Color(
        data.color.r,
        data.color.g,
        data.color.b
      );
      
      console.log('Previous color:', {
        r: this.playerColor.r.toFixed(4),
        g: this.playerColor.g.toFixed(4),
        b: this.playerColor.b.toFixed(4)
      });
      
      // Update both the network manager's color and the player's color
      this.playerColor = assignedColor.clone();
      this.localPlayer.setColor(assignedColor);
      
      console.log('New color set:', {
        r: this.playerColor.r.toFixed(4),
        g: this.playerColor.g.toFixed(4),
        b: this.playerColor.b.toFixed(4)
      });
      
      // Verify the color was properly applied
      const verifyColor = this.localPlayer.getColor();
      console.log('Verification - player color:', {
        r: verifyColor.r.toFixed(4),
        g: verifyColor.g.toFixed(4),
        b: verifyColor.b.toFixed(4)
      });
      
      // Request immediate state verification to confirm
      this.verifyClientState();
    });

    // Handle connect error
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.onConnectionStatus?.(ConnectionStatus.ERROR, error);
      
      // Try to reconnect
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        if (this.connectionRetryTimeout) {
          clearTimeout(this.connectionRetryTimeout);
        }
        this.connectionRetryTimeout = setTimeout(() => {
          this.connectToServer();
        }, 2000);
      }
    });

    // Handle disconnect
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
      this.onConnectionStatus?.(ConnectionStatus.DISCONNECTED);
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
      this.onPositionUpdate(
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

    // Handle state verification results
    this.socket.on('state_verification_result', (report: any) => {
      console.group('State Verification Report');
      console.log('Color drift:', report.colorDrift.toFixed(4));
      console.log('Position drift:', report.positionDrift.toFixed(4));
      console.log('Needs correction:', report.needsCorrection);
      
      if (report.needsCorrection) {
        console.warn('State correction needed!');
        
        const currentColor = this.localPlayer.getColor();
        const expectedColor = report.expectedState.color;
        const currentPos = this.localPlayer.getPosition();
        const expectedPos = report.expectedState.position;
        
        console.group('Color State');
        console.log('Current color (RGB):', {
          r: currentColor.r.toFixed(4),
          g: currentColor.g.toFixed(4),
          b: currentColor.b.toFixed(4)
        });
        console.log('Expected color (RGB):', {
          r: expectedColor.r.toFixed(4),
          g: expectedColor.g.toFixed(4),
          b: expectedColor.b.toFixed(4)
        });
        console.log('Color differences:', {
          r: Math.abs(currentColor.r - expectedColor.r).toFixed(4),
          g: Math.abs(currentColor.g - expectedColor.g).toFixed(4),
          b: Math.abs(currentColor.b - expectedColor.b).toFixed(4)
        });
        console.groupEnd();

        console.group('Position State');
        console.log('Current position:', {
          x: currentPos.x.toFixed(4),
          y: currentPos.y.toFixed(4),
          z: currentPos.z.toFixed(4)
        });
        console.log('Expected position:', {
          x: expectedPos.x.toFixed(4),
          y: expectedPos.y.toFixed(4),
          z: expectedPos.z.toFixed(4)
        });
        console.log('Position differences:', {
          x: Math.abs(currentPos.x - expectedPos.x).toFixed(4),
          y: Math.abs(currentPos.y - expectedPos.y).toFixed(4),
          z: Math.abs(currentPos.z - expectedPos.z).toFixed(4)
        });
        console.groupEnd();
      }
      console.groupEnd();
    });

    // Handle forced state corrections
    this.socket.on('force_state_correction', (correctState: any) => {
      console.warn('Applying forced state correction');
      
      // Create a new color instance with the correct RGB values
      const correctedColor = new THREE.Color(
        correctState.color.r,
        correctState.color.g,
        correctState.color.b
      );
      
      // Update both the network manager's color and the player's color
      this.playerColor = correctedColor.clone();
      this.localPlayer.setColor(correctedColor);

      // Update position if needed
      if (correctState.position) {
        this.localPlayer.setPosition(new THREE.Vector3(
          correctState.position.x,
          correctState.position.y,
          correctState.position.z
        ));
      }
    });

    // Handle player join response
    this.socket.on('player_join_response', (data: any) => {
      console.group('Player Join Response');
      console.log('Received join response:', data);
      
      if (data.color) {
        console.log('Color included in join response');
        // Create a new color instance with the assigned RGB values
        const assignedColor = new THREE.Color(
          data.color.r,
          data.color.g,
          data.color.b
        );
        
        console.log('Previous color:', {
          r: this.playerColor.r.toFixed(4),
          g: this.playerColor.g.toFixed(4),
          b: this.playerColor.b.toFixed(4)
        });
        
        // Update both the network manager's color and the player's color
        this.playerColor = assignedColor.clone();
        this.localPlayer.setColor(assignedColor);
        
        console.log('New color set:', {
          r: this.playerColor.r.toFixed(4),
          g: this.playerColor.g.toFixed(4),
          b: this.playerColor.b.toFixed(4)
        });
        
        // Verify the color was properly applied
        const verifyColor = this.localPlayer.getColor();
        console.log('Verification - player color:', {
          r: verifyColor.r.toFixed(4),
          g: verifyColor.g.toFixed(4),
          b: verifyColor.b.toFixed(4)
        });
        
        // Request immediate state verification to confirm
        this.verifyClientState();
      } else {
        console.warn('No color in join response');
      }
      console.groupEnd();
    });

    // Handle server request for client state
    this.socket.on('request_client_state', (data: { timestamp: number, expectedState: any }) => {
      console.group('Server State Verification Request');
      console.log('Server expects:', data.expectedState);
      
      const currentState = {
        position: this.localPlayer.getPosition(),
        color: this.localPlayer.getColor(),
        timestamp: data.timestamp
      };
      
      console.log('Current client state:', {
        position: {
          x: currentState.position.x.toFixed(4),
          y: currentState.position.y.toFixed(4),
          z: currentState.position.z.toFixed(4)
        },
        color: {
          r: currentState.color.r.toFixed(4),
          g: currentState.color.g.toFixed(4),
          b: currentState.color.b.toFixed(4)
        }
      });

      // Send our current state back to the server
      this.socket?.emit('client_state_response', {
        position: {
          x: currentState.position.x,
          y: currentState.position.y,
          z: currentState.position.z
        },
        color: {
          r: currentState.color.r,
          g: currentState.color.g,
          b: currentState.color.b
        },
        timestamp: data.timestamp
      });
      
      console.log('Sent state response to server');
      console.groupEnd();
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
    
    if (this.connectionRetryTimeout) {
      clearTimeout(this.connectionRetryTimeout);
    }
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
  public onDebugState(callback: (state: Record<string, unknown>) => void): () => void {
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