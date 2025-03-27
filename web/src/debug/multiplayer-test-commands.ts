/**
 * Multiplayer testing and debugging commands
 * These commands can be executed from the browser console to help diagnose issues
 */
import * as _THREE from 'three';
import { io, Socket } from 'socket.io-client';
import { GameEvent } from '../constants';
import { Position, Rotation, Color } from '../types';

interface PlayerInfo {
  id: string;
  position: Position;
  color: Color;
}

interface PlayersInfo {
  count: number;
  players: PlayerInfo[];
}

interface PlayerJoinedEvent {
  id: string;
  position: Position;
  rotation: Rotation;
  color: Color;
}

interface PlayerMovedEvent {
  id: string;
  position: Position;
  rotation: Rotation;
}

/**
 * Class for testing multiplayer sync issues
 */
export class MultiplayerTester {
  private socket: Socket;
  private serverUrl: string;
  private playerId: string = '';
  private isConnected: boolean = false;
  private players: Map<string, PlayerInfo> = new Map();
  
  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
    
    // Connect to server
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true
    });
    
    // Set up socket event handlers
    this.setupSocketListeners();
  }
  
  /**
   * Set up socket event handlers
   */
  private setupSocketListeners(): void {
    // Connection
    this.socket.on('connect', () => {
      console.log('Connected to server:', this.serverUrl);
      console.log('Socket ID:', this.socket.id);
      this.playerId = this.socket.id;
      this.isConnected = true;
      
      // Join the game
      this.joinGame();
    });
    
    // Disconnection
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });
    
    // Player joined
    this.socket.on(GameEvent.PLAYER_JOINED, (data: PlayerJoinedEvent) => {
      console.log('Player joined:', data);
      this.players.set(data.id, data);
    });
    
    // Player list
    this.socket.on(GameEvent.PLAYERS_LIST, (players: PlayerInfo[]) => {
      console.log('Players list:', players);
      this.players.clear();
      players.forEach(player => {
        this.players.set(player.id, player);
      });
    });
    
    // Player moved
    this.socket.on(GameEvent.PLAYER_MOVED, (data: PlayerMovedEvent) => {
      console.log('Player moved:', data);
      const player = this.players.get(data.id);
      if (player) {
        player.position = data.position;
        player.rotation = data.rotation;
      }
    });
    
    // Player left
    this.socket.on(GameEvent.PLAYER_LEFT, (playerId: string) => {
      console.log('Player left:', playerId);
      this.players.delete(playerId);
    });
    
    // Debug state
    this.socket.on('debug_state', (state: { [key: string]: unknown }) => {
      console.log('Debug state:', state);
    });
  }
  
  /**
   * Join the game
   */
  public joinGame(position = { x: 0, y: 1, z: 0 }): void {
    if (!this.isConnected) {
      console.log('Not connected to server');
      return;
    }
    
    this.socket.emit(GameEvent.PLAYER_JOIN, { position });
  }
  
  /**
   * Send a position update
   */
  public sendPosition(x: number, y: number, z: number): void {
    if (!this.isConnected) {
      console.log('Not connected to server');
      return;
    }
    
    this.socket.emit(GameEvent.POSITION_UPDATE, {
      position: { x, y, z },
      rotation: { x: 0, y: 0, z: 0 }
    });
    
    console.log('Sent position update:', { x, y, z });
  }
  
  /**
   * Request the server's debug state
   */
  public requestDebugState(): void {
    if (!this.isConnected) {
      console.log('Not connected to server');
      return;
    }
    
    this.socket.emit('request_debug_state');
    console.log('Requested debug state');
  }
  
  /**
   * Trigger a state verification
   */
  public verifyState(): void {
    if (!this.isConnected) {
      console.log('Not connected to server');
      return;
    }
    
    this.socket.emit('verify_player_state');
    console.log('Requested state verification');
  }
  
  /**
   * Get the list of connected players
   */
  public getPlayers(): PlayersInfo {
    return {
      count: this.players.size,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        position: p.position,
        color: p.color
      }))
    };
  }
  
  /**
   * Send multiple position updates in a sequence
   */
  public sendRandomMovement(count: number = 10, delay: number = 100): void {
    if (!this.isConnected) {
      console.log('Not connected to server');
      return;
    }
    
    let i = 0;
    const interval = setInterval(() => {
      if (i >= count) {
        clearInterval(interval);
        console.log('Finished random movement');
        return;
      }
      
      const position = {
        x: Math.random() * 20 - 10,
        y: Math.random() * 5 + 1,
        z: Math.random() * 20 - 10
      };
      
      this.sendPosition(position.x, position.y, position.z);
      i++;
    }, delay);
  }
  
  /**
   * Send position updates for all players simultaneously
   * NOTE: This is a test function to stress the server
   */
  public stressTest(count: number = 100): void {
    if (!this.isConnected) {
      console.log('Not connected to server');
      return;
    }
    
    console.log(`Starting stress test with ${count} position updates`);
    
    // Send many updates very quickly
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const position = {
          x: Math.random() * 20 - 10,
          y: Math.random() * 5 + 1,
          z: Math.random() * 20 - 10
        };
        
        this.sendPosition(position.x, position.y, position.z);
        
        if (i === count - 1) {
          console.log('Stress test complete');
          
          // Request debug state after test
          setTimeout(() => {
            this.requestDebugState();
          }, 500);
        }
      }, i * 10); // 10ms between updates = 100 updates per second
    }
  }
  
  /**
   * Disconnect from the server
   */
  public disconnect(): void {
    this.socket.disconnect();
    console.log('Disconnected from server');
  }
}

// Export factory function
export function createMultiplayerTester(serverUrl: string): MultiplayerTester {
  return new MultiplayerTester(serverUrl);
}

// Add to global scope for debugging
declare global {
  var MultiplayerTester: typeof MultiplayerTester;
  var createMultiplayerTester: typeof createMultiplayerTester;
}
globalThis.MultiplayerTester = MultiplayerTester;
globalThis.createMultiplayerTester = createMultiplayerTester; 