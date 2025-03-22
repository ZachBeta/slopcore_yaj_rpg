import * as THREE from 'three';
import { Player } from './player';
import { Socket, io } from 'socket.io-client';

// Define the callback types
type PlayerJoinCallback = (id: string, position: THREE.Vector3) => void;
type PlayerLeaveCallback = (id: string) => void;
type PlayerPositionUpdateCallback = (id: string, position: THREE.Vector3) => void;

export class NetworkManager {
  private localPlayer: Player;
  private onPlayerJoin: PlayerJoinCallback;
  private onPlayerLeave: PlayerLeaveCallback;
  private onPlayerPositionUpdate: PlayerPositionUpdateCallback;
  private lastPositionUpdate: number = 0;
  private updateInterval: number = 100; // Update every 100ms
  private socket: Socket;

  /**
   * Create a new network manager
   * @param localPlayer The local player instance
   * @param onPlayerJoin Callback for when a player joins
   * @param onPlayerLeave Callback for when a player leaves
   * @param onPlayerPositionUpdate Callback for when a player's position updates
   */
  constructor(
    localPlayer: Player,
    onPlayerJoin: PlayerJoinCallback,
    onPlayerLeave: PlayerLeaveCallback,
    onPlayerPositionUpdate: PlayerPositionUpdateCallback
  ) {
    this.localPlayer = localPlayer;
    this.onPlayerJoin = onPlayerJoin;
    this.onPlayerLeave = onPlayerLeave;
    this.onPlayerPositionUpdate = onPlayerPositionUpdate;
    
    // Initialize Socket.io connection
    this.initializeSocketConnection();
  }

  /**
   * Initialize Socket.io connection and set up event handlers
   */
  private initializeSocketConnection(): void {
    // Connect to Socket.io server
    this.socket = io('http://localhost:3000');

    // Handle connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
      
      // Send initial player data
      this.socket.emit('player_join', {
        position: this.localPlayer.getPosition(),
        rotation: this.localPlayer.getRotation()
      });
    });

    // Handle disconnect
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Handle receiving list of existing players
    this.socket.on('players_list', (players: any[]) => {
      players.forEach(player => {
        if (player.id !== this.socket.id) {
          this.onPlayerJoin(
            player.id,
            new THREE.Vector3(
              player.position.x,
              player.position.y,
              player.position.z
            )
          );
        }
      });
    });

    // Handle new player joining
    this.socket.on('player_joined', (player: any) => {
      this.onPlayerJoin(
        player.id,
        new THREE.Vector3(
          player.position.x,
          player.position.y,
          player.position.z
        )
      );
    });

    // Handle player leaving
    this.socket.on('player_left', (playerId: string) => {
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
  }

  /**
   * Send player position update to server
   */
  public sendPositionUpdate(position: THREE.Vector3): void {
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
      this.socket.disconnect();
    }
  }
} 