import * as THREE from 'three';
import { Player } from './player';
import { Socket, io } from 'socket.io-client';

// Define the callback types
type PlayerJoinCallback = (id: string, position: THREE.Vector3, color: THREE.Color) => void;
type PlayerLeaveCallback = (id: string) => void;
type PlayerPositionUpdateCallback = (id: string, position: THREE.Vector3) => void;

// Define HSL type
interface HSL {
  h: number;
  s: number;
  l: number;
}

export class NetworkManager {
  private localPlayer: Player;
  private onPlayerJoin: PlayerJoinCallback;
  private onPlayerLeave: PlayerLeaveCallback;
  private onPlayerPositionUpdate: PlayerPositionUpdateCallback;
  private lastPositionUpdate: number = 0;
  private updateInterval: number = 100; // Update every 100ms
  private socket: Socket;
  private playerColor: THREE.Color;
  private static usedHues: Set<number> = new Set();

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
    
    // Generate a random color for this player
    this.playerColor = this.generateRandomColor();
    this.localPlayer.setColor(this.playerColor);
    
    // Initialize Socket.io connection
    this.initializeSocketConnection();
  }

  /**
   * Generate a random vibrant color that's distinct from existing colors
   */
  private generateRandomColor(): THREE.Color {
    const numHueSegments = 12; // Divide the color wheel into 12 segments
    const hueStep = 1 / numHueSegments;
    
    // Find an unused hue segment
    let hue = 0;
    for (let i = 0; i < numHueSegments; i++) {
      const potentialHue = i * hueStep;
      if (!NetworkManager.usedHues.has(potentialHue)) {
        hue = potentialHue;
        NetworkManager.usedHues.add(potentialHue);
        break;
      }
    }
    
    // If all segments are used, pick a random one
    if (hue === 0 && NetworkManager.usedHues.size === numHueSegments) {
      hue = Math.floor(Math.random() * numHueSegments) * hueStep;
    }
    
    // Use high saturation and lightness for vibrant colors
    const saturation = 0.8 + Math.random() * 0.2; // 0.8-1.0
    const lightness = 0.5 + Math.random() * 0.1; // 0.5-0.6
    
    // Create and return the color
    return new THREE.Color().setHSL(hue, saturation, lightness);
  }

  /**
   * Clean up a color when a player disconnects
   */
  private cleanupColor(color: THREE.Color): void {
    const hsl: HSL = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    NetworkManager.usedHues.delete(hsl.h);
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
        rotation: this.localPlayer.getRotation(),
        color: {
          r: this.playerColor.r,
          g: this.playerColor.g,
          b: this.playerColor.b
        }
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
          const color = player.color ? 
            new THREE.Color(
              player.color.r || 1,
              player.color.g || 0,
              player.color.b || 0
            ) : 
            new THREE.Color(1, 0, 0); // Default red color

          this.onPlayerJoin(
            player.id,
            new THREE.Vector3(
              player.position?.x || 0,
              player.position?.y || 1,
              player.position?.z || 0
            ),
            color
          );
        }
      });
    });

    // Handle new player joining
    this.socket.on('player_joined', (player: any) => {
      const color = player.color ? 
        new THREE.Color(
          player.color.r || 1,
          player.color.g || 0,
          player.color.b || 0
        ) : 
        new THREE.Color(1, 0, 0); // Default red color

      this.onPlayerJoin(
        player.id,
        new THREE.Vector3(
          player.position?.x || 0,
          player.position?.y || 1,
          player.position?.z || 0
        ),
        color
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
      // Clean up our color
      this.cleanupColor(this.playerColor);
      this.socket.disconnect();
    }
  }
} 