import EventEmitter from 'events';
import { Color, Player, Position, Rotation } from '../src/types';
import { GameEvent } from '../src/constants';

// Mock Socket class for testing
export class MockSocket extends EventEmitter {
  id: string;
  connected: boolean = false;
  
  constructor(id: string) {
    super();
    this.id = id;
  }
  
  emit(event: string, ...args: unknown[]): boolean {
    return super.emit(event, ...args);
  }
  
  connect(): void {
    this.connected = true;
    this.emit('connect');
  }
  
  disconnect(): void {
    this.connected = false;
    this.emit('disconnect', 'client disconnect');
  }
  
  close(): void {
    this.connected = false;
    this.removeAllListeners();
  }
}

// Mock Socket Server for testing
export class MockSocketServer extends EventEmitter {
  private players: Map<string, Player> = new Map();
  private colorPool: Color[] = [
    { r: 1, g: 0, b: 0 },    // Red
    { r: 0, g: 1, b: 0 },    // Green
    { r: 0, g: 0, b: 1 },    // Blue
    { r: 1, g: 1, b: 0 },    // Yellow
    { r: 0, g: 1, b: 1 },    // Cyan
    { r: 1, g: 0, b: 1 },    // Magenta
    { r: 1, g: 0.5, b: 0 },  // Orange
    { r: 0.5, g: 0, b: 1 },  // Purple
    { r: 0, g: 1, b: 0.5 },  // Spring Green
    { r: 1, g: 0, b: 0.5 },  // Pink
    { r: 0.5, g: 1, b: 0 },  // Lime
    { r: 0, g: 0.5, b: 1 }   // Sky Blue
  ];
  private availableColors: Color[] = [...this.colorPool];
  private lockedColors: Map<string, Color> = new Map();
  private connections: Map<string, MockSocket> = new Map();
  
  constructor() {
    super();
  }
  
  createConnection(socketId: string): MockSocket {
    const socket = new MockSocket(socketId);
    this.connections.set(socketId, socket);
    
    // Set up event handlers
    socket.on('connect', () => {
      this.handleConnect(socket);
    });
    
    socket.on('disconnect', (reason) => {
      this.handleDisconnect(socket, reason);
    });
    
    socket.on(GameEvent.PLAYER_JOIN, (data) => {
      this.handlePlayerJoin(socket, data);
    });
    
    socket.on(GameEvent.POSITION_UPDATE, (data) => {
      this.handlePositionUpdate(socket, data);
    });
    
    return socket;
  }
  
  private handleConnect(socket: MockSocket): void {
    console.log(`Mock socket connected: ${socket.id}`);
  }
  
  private handleDisconnect(socket: MockSocket, reason: string): void {
    console.log(`Mock socket disconnected: ${socket.id}, reason: ${reason}`);
    this.handlePlayerLeave(socket.id);
  }
  
  private handlePlayerJoin(socket: MockSocket, data: { position?: Position }): void {
    // Generate a color
    const color = this.generatePlayerColor(socket.id);
    
    // Create player
    const player: Player = {
      id: socket.id,
      position: data.position || { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      color: color
    };
    
    // Add to players map
    this.players.set(socket.id, player);
    
    // Send events
    socket.emit(GameEvent.PLAYER_JOINED, player);
    
    // Send other players to this player
    const otherPlayers = Array.from(this.players.values())
      .filter(p => p.id !== socket.id);
    
    socket.emit(GameEvent.PLAYERS_LIST, otherPlayers);
    
    // Broadcast to other players
    for (const [id, otherSocket] of this.connections.entries()) {
      if (id !== socket.id) {
        otherSocket.emit(GameEvent.PLAYER_JOINED, player);
      }
    }
  }
  
  private handlePositionUpdate(socket: MockSocket, data: { position: Position, rotation: Rotation }): void {
    const player = this.players.get(socket.id);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;
      
      // Broadcast to other players
      for (const [id, otherSocket] of this.connections.entries()) {
        if (id !== socket.id) {
          otherSocket.emit(GameEvent.PLAYER_MOVED, {
            id: socket.id,
            position: data.position,
            rotation: data.rotation
          });
        }
      }
    }
  }
  
  private handlePlayerLeave(socketId: string): void {
    // Remove player
    const player = this.players.get(socketId);
    if (player) {
      // Recycle color
      this.recycleColor(player.color, socketId);
      
      // Remove from players map
      this.players.delete(socketId);
      
      // Broadcast to other players
      for (const [id, socket] of this.connections.entries()) {
        if (id !== socketId) {
          socket.emit(GameEvent.PLAYER_LEFT, socketId);
        }
      }
    }
    
    // Remove from connections
    this.connections.delete(socketId);
  }
  
  private generatePlayerColor(socketId: string): Color {
    if (this.availableColors.length > 0) {
      const color = this.availableColors.pop();
      if (!color) {
        throw new Error('No available colors');
      }
      this.lockedColors.set(socketId, color);
      return color;
    }

    // Generate a random color if no pre-defined colors are available
    const color: Color = {
      r: Math.random(),
      g: Math.random(),
      b: Math.random()
    };
    this.lockedColors.set(socketId, color);
    return color;
  }
  
  private recycleColor(color: Color, socketId: string): void {
    this.lockedColors.delete(socketId);
    this.availableColors.push({ ...color });
  }
  
  // Helper methods for tests
  getPlayers(): Map<string, Player> {
    return this.players;
  }
  
  getAvailableColors(): Color[] {
    return this.availableColors;
  }
  
  getLockedColors(): Map<string, Color> {
    return this.lockedColors;
  }
  
  reset(): void {
    this.players.clear();
    this.lockedColors.clear();
    this.availableColors = [...this.colorPool];
    
    // Close all connections
    for (const { 1: socket } of this.connections) {
      if (socket.connected) {
        socket.disconnect();
      }
      socket.close();
    }
    this.connections.clear();
  }
} 