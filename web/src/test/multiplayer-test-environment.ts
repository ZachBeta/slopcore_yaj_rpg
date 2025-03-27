import * as THREE from 'three';
import { ThreeTestEnvironment } from './three-test-environment';
import { Player } from '../open-world/player';
import { GameEvent } from '../constants';
import { MockSocketServer, MockSocket } from '../../server/mock-socket-server';
import { EventEmitter as _EventEmitter } from 'events';
import { Position as _Position, Rotation as _Rotation, Color as _Color } from '../types';

interface PlayerInfo {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  color: {
    r: number;
    g: number;
    b: number;
  };
}

interface PlayerDebugInfo {
  local: PlayerInfo;
  [playerId: string]: PlayerInfo;
}

/**
 * Creates a test environment for multiplayer scenarios
 * This simulates a network with multiple clients connected to a server
 */
export class MultiplayerTestEnvironment extends ThreeTestEnvironment {
  // Server simulation
  mockServer: MockSocketServer;
  
  // Client socket connections
  localSocket: MockSocket;
  remoteSockets: Map<string, MockSocket> = new Map();
  
  // Player objects
  localPlayer: Player;
  remotePlayers: Map<string, Player> = new Map();
  
  constructor() {
    super();
    
    // Create the mock server
    this.mockServer = new MockSocketServer();
    
    // Create the local player
    this.localPlayer = new Player('local-player', true);
    this.add(this.localPlayer.getObject());
    
    // Create the local socket connection
    this.localSocket = this.mockServer.createConnection('local-player');
    this.setupLocalPlayerEvents();
  }
  
  /**
   * Set up event handling for the local player
   */
  private setupLocalPlayerEvents(): void {
    // Handle local player initial connection
    this.localSocket.on(GameEvent.PLAYER_JOINED, (data) => {
      this.localPlayer.setPosition(new THREE.Vector3(
        data.position.x,
        data.position.y,
        data.position.z
      ));
      
      this.localPlayer.setColor(new THREE.Color(
        data.color.r,
        data.color.g,
        data.color.b
      ));
    });
    
    // Handle remote player joins
    this.localSocket.on(GameEvent.PLAYER_JOINED, (data) => {
      if (data.id === this.localPlayer.getId()) return;
      
      const remotePlayer = new Player(data.id, false);
      remotePlayer.setPosition(new THREE.Vector3(
        data.position.x,
        data.position.y,
        data.position.z
      ));
      
      remotePlayer.setColor(new THREE.Color(
        data.color.r,
        data.color.g,
        data.color.b
      ));
      
      this.add(remotePlayer.getObject());
      this.remotePlayers.set(data.id, remotePlayer);
    });
    
    // Handle player list
    this.localSocket.on(GameEvent.PLAYERS_LIST, (players) => {
      players.forEach((data) => {
        if (data.id === this.localPlayer.getId()) return;
        
        const remotePlayer = new Player(data.id, false);
        remotePlayer.setPosition(new THREE.Vector3(
          data.position.x,
          data.position.y,
          data.position.z
        ));
        
        remotePlayer.setColor(new THREE.Color(
          data.color.r,
          data.color.g,
          data.color.b
        ));
        
        this.add(remotePlayer.getObject());
        this.remotePlayers.set(data.id, remotePlayer);
      });
    });
    
    // Handle player movement
    this.localSocket.on(GameEvent.PLAYER_MOVED, (data) => {
      if (data.id === this.localPlayer.getId()) return;
      
      const player = this.remotePlayers.get(data.id);
      if (player) {
        player.setPosition(new THREE.Vector3(
          data.position.x,
          data.position.y,
          data.position.z
        ));
      }
    });
    
    // Handle player leave
    this.localSocket.on(GameEvent.PLAYER_LEFT, (playerId) => {
      const player = this.remotePlayers.get(playerId);
      if (player) {
        this.remove(player.getObject());
        this.remotePlayers.delete(playerId);
      }
    });
  }
  
  /**
   * Add a remote player to the environment
   */
  addRemotePlayer(id: string, initialPosition?: THREE.Vector3): MockSocket {
    const socket = this.mockServer.createConnection(id);
    this.remoteSockets.set(id, socket);
    
    // Connect the socket
    socket.connect();
    
    // Join the game
    socket.emit(GameEvent.PLAYER_JOIN, { 
      position: initialPosition ? {
        x: initialPosition.x,
        y: initialPosition.y,
        z: initialPosition.z
      } : undefined 
    });
    
    return socket;
  }
  
  /**
   * Update a remote player's position
   */
  updateRemotePlayerPosition(id: string, position: THREE.Vector3): void {
    const socket = this.remoteSockets.get(id);
    if (socket) {
      socket.emit(GameEvent.POSITION_UPDATE, {
        position: {
          x: position.x,
          y: position.y,
          z: position.z
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0
        }
      });
    }
  }
  
  /**
   * Simulate a position update from the local player
   */
  updateLocalPlayerPosition(position: THREE.Vector3): void {
    this.localPlayer.setPosition(position);
    
    this.localSocket.emit(GameEvent.POSITION_UPDATE, {
      position: {
        x: position.x,
        y: position.y,
        z: position.z
      },
      rotation: {
        x: 0,
        y: 0,
        z: 0
      }
    });
  }
  
  /**
   * Start the multiplayer simulation
   */
  startMultiplayer(): void {
    // Connect the local socket
    this.localSocket.connect();
    
    // Join the game
    this.localSocket.emit(GameEvent.PLAYER_JOIN, {
      position: {
        x: 0,
        y: 1,
        z: 0
      }
    });
  }
  
  /**
   * Check if a remote player is at the expected position
   */
  isRemotePlayerAtPosition(id: string, expected: THREE.Vector3, tolerance = 0.001): boolean {
    const player = this.remotePlayers.get(id);
    if (!player) return false;
    
    const position = player.getPosition();
    return (
      Math.abs(position.x - expected.x) <= tolerance &&
      Math.abs(position.y - expected.y) <= tolerance &&
      Math.abs(position.z - expected.z) <= tolerance
    );
  }
  
  /**
   * Check if a remote player has the expected color
   */
  doesRemotePlayerHaveColor(id: string, expected: THREE.Color, tolerance = 0.001): boolean {
    const player = this.remotePlayers.get(id);
    if (!player) return false;
    
    const color = player.getColor();
    return (
      Math.abs(color.r - expected.r) <= tolerance &&
      Math.abs(color.g - expected.g) <= tolerance &&
      Math.abs(color.b - expected.b) <= tolerance
    );
  }
  
  /**
   * Get details of all current players for debugging
   */
  getPlayerDebugInfo(): PlayerDebugInfo {
    const players: PlayerDebugInfo = {
      local: {
        id: this.localPlayer.getId(),
        position: {
          x: this.localPlayer.getPosition().x,
          y: this.localPlayer.getPosition().y,
          z: this.localPlayer.getPosition().z
        },
        color: {
          r: this.localPlayer.getColor().r,
          g: this.localPlayer.getColor().g,
          b: this.localPlayer.getColor().b
        }
      }
    };
    
    // Remote players
    for (const [id, player] of this.remotePlayers.entries()) {
      const pos = player.getPosition();
      const col = player.getColor();
      players[id] = {
        id,
        position: { x: pos.x, y: pos.y, z: pos.z },
        color: { r: col.r, g: col.g, b: col.b }
      };
    }
    
    return players;
  }
  
  /**
   * Clean up all resources
   */
  cleanup(): void {
    // Disconnect all sockets
    this.localSocket.disconnect();
    this.remoteSockets.forEach(socket => socket.disconnect());
    
    // Reset the server
    this.mockServer.reset();
    
    // Clean up the scene
    super.cleanup();
  }
} 