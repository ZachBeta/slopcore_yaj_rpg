/**
 * Multiplayer testing and debugging commands
 * These commands can be executed from the browser console to help diagnose issues
 */
import * as THREE from 'three';
import { Socket, io } from 'socket.io-client';
import { GameEvent } from '../constants';

/**
 * Class for testing multiplayer sync issues
 */
export class MultiplayerTester {
  private socket: Socket;
  private serverUrl: string;
  private playerId: string = '';
  private isConnected: boolean = false;
  private connectedPlayers: Map<string, {
    id: string;
    position: THREE.Vector3;
    color: THREE.Color;
    lastUpdate: number;
  }> = new Map();
  
  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
    
    // Connect to server
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true
    });
    
    // Set up socket event handlers
    this.setupEvents();
  }
  
  /**
   * Set up socket event handlers
   */
  private setupEvents(): void {
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
    this.socket.on(GameEvent.PLAYER_JOINED, (data: any) => {
      console.log('Player joined:', data.id);
      
      // Save player data
      this.connectedPlayers.set(data.id, {
        id: data.id,
        position: new THREE.Vector3(data.position.x, data.position.y, data.position.z),
        color: new THREE.Color(data.color.r, data.color.g, data.color.b),
        lastUpdate: Date.now()
      });
    });
    
    // Player list
    this.socket.on(GameEvent.PLAYERS_LIST, (players: any[]) => {
      console.log('Received players list:', players.length, 'players');
      
      players.forEach(data => {
        this.connectedPlayers.set(data.id, {
          id: data.id,
          position: new THREE.Vector3(data.position.x, data.position.y, data.position.z),
          color: new THREE.Color(data.color.r, data.color.g, data.color.b),
          lastUpdate: Date.now()
        });
      });
      
      console.log('Connected players:', Array.from(this.connectedPlayers.keys()));
    });
    
    // Player moved
    this.socket.on(GameEvent.PLAYER_MOVED, (data: any) => {
      if (this.connectedPlayers.has(data.id)) {
        // Update player position
        const player = this.connectedPlayers.get(data.id)!;
        player.position.set(data.position.x, data.position.y, data.position.z);
        player.lastUpdate = Date.now();
      }
    });
    
    // Player left
    this.socket.on(GameEvent.PLAYER_LEFT, (playerId: string) => {
      console.log('Player left:', playerId);
      this.connectedPlayers.delete(playerId);
    });
    
    // Debug state
    this.socket.on('debug_state', (state: any) => {
      console.log('Received debug state:', state);
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
  public getPlayers(): any {
    return {
      count: this.connectedPlayers.size,
      players: Array.from(this.connectedPlayers.values()).map(p => ({
        id: p.id,
        position: {
          x: p.position.x.toFixed(2),
          y: p.position.y.toFixed(2),
          z: p.position.z.toFixed(2)
        },
        color: {
          r: p.color.r.toFixed(2),
          g: p.color.g.toFixed(2),
          b: p.color.b.toFixed(2)
        },
        age: Date.now() - p.lastUpdate
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

// Make available in global scope for browser console testing
(window as any).MultiplayerTester = MultiplayerTester;

// Helper function to create a tester
export function createTester(serverUrl?: string): MultiplayerTester {
  return new MultiplayerTester(serverUrl);
}

// Also expose in global scope
(window as any).createMultiplayerTester = createTester; 