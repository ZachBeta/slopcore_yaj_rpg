import * as THREE from 'three';
import { Player } from './player';

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
  private mockPlayers: Map<string, THREE.Vector3> = new Map();
  private mockUpdateTimers: Map<string, number> = new Map();

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
    
    // Initialize mock multiplayer
    // In a real implementation, this would connect to a Socket.io server
    this.initializeMockMultiplayer();
  }

  /**
   * Initialize mock multiplayer functionality
   * This simulates a server by creating mock players that move randomly
   */
  private initializeMockMultiplayer(): void {
    console.log('Initializing mock multiplayer');
    
    // Create several mock players
    const numMockPlayers = 5;
    
    for (let i = 0; i < numMockPlayers; i++) {
      const id = `mock_player_${i}`;
      
      // Create random starting position
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        1,
        (Math.random() - 0.5) * 20
      );
      
      // Store the mock player
      this.mockPlayers.set(id, position);
      
      // Trigger the join callback
      this.onPlayerJoin(id, position);
      
      // Start a timer to update this player's position
      const updateRate = 1000 + Math.random() * 2000; // Between 1-3 seconds
      const timerId = window.setInterval(() => {
        this.updateMockPlayerPosition(id);
      }, updateRate);
      
      this.mockUpdateTimers.set(id, timerId);
    }
    
    // Occasionally add or remove mock players
    window.setInterval(() => {
      // 25% chance to add a player, 25% chance to remove a player
      const action = Math.random();
      
      if (action < 0.25 && this.mockPlayers.size < 10) {
        this.addMockPlayer();
      } else if (action < 0.5 && this.mockPlayers.size > 2) {
        this.removeMockPlayer();
      }
    }, 10000); // Check every 10 seconds
  }
  
  /**
   * Add a new mock player
   */
  private addMockPlayer(): void {
    const id = `mock_player_${Date.now()}`;
    
    // Create random starting position
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      1,
      (Math.random() - 0.5) * 20
    );
    
    // Store the mock player
    this.mockPlayers.set(id, position);
    
    // Trigger the join callback
    this.onPlayerJoin(id, position);
    
    // Start a timer to update this player's position
    const updateRate = 1000 + Math.random() * 2000; // Between 1-3 seconds
    const timerId = window.setInterval(() => {
      this.updateMockPlayerPosition(id);
    }, updateRate);
    
    this.mockUpdateTimers.set(id, timerId);
    
    console.log(`Added mock player ${id}`);
  }
  
  /**
   * Remove a random mock player
   */
  private removeMockPlayer(): void {
    // Get all mock player ids
    const ids = Array.from(this.mockPlayers.keys());
    
    // Pick a random player to remove
    const id = ids[Math.floor(Math.random() * ids.length)];
    
    // Clear their update timer
    const timerId = this.mockUpdateTimers.get(id);
    if (timerId) {
      window.clearInterval(timerId);
      this.mockUpdateTimers.delete(id);
    }
    
    // Remove them from the mock players
    this.mockPlayers.delete(id);
    
    // Trigger the leave callback
    this.onPlayerLeave(id);
    
    console.log(`Removed mock player ${id}`);
  }
  
  /**
   * Update a mock player's position
   */
  private updateMockPlayerPosition(id: string): void {
    if (!this.mockPlayers.has(id)) return;
    
    const position = this.mockPlayers.get(id).clone();
    
    // Move in a random direction
    const direction = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      0,
      (Math.random() - 0.5) * 2
    ).normalize();
    
    // Move by a random amount
    const distance = Math.random() * 2;
    position.add(direction.multiplyScalar(distance));
    
    // Keep y constant for now
    position.y = 1;
    
    // Store the new position
    this.mockPlayers.set(id, position);
    
    // Trigger the position update callback
    this.onPlayerPositionUpdate(id, position);
  }

  /**
   * Send player position update to server
   * In this mock implementation, we just track the time since last update
   */
  public sendPositionUpdate(position: THREE.Vector3): void {
    const now = performance.now();
    
    // Only send updates at a certain rate to reduce network traffic
    if (now - this.lastPositionUpdate < this.updateInterval) {
      return;
    }
    
    this.lastPositionUpdate = now;
    
    // In a real implementation, we would send this to the server
    // socket.emit('position_update', { position: position.toArray() });
    
    // No need to do anything in our mock implementation
  }
  
  /**
   * Disconnect from the server
   */
  public disconnect(): void {
    // In a real implementation, we would disconnect from Socket.io
    // socket.disconnect();
    
    // Clean up mock players
    this.mockPlayers.clear();
    
    // Clear all timers
    this.mockUpdateTimers.forEach(timerId => {
      window.clearInterval(timerId);
    });
    this.mockUpdateTimers.clear();
    
    console.log('Disconnected from mock server');
  }
} 