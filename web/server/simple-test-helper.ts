// Rename the file to .ts and ensure the exports are working
export { TestSocket, TestServer, simulatePlayerJoining, isColorUnique, getColorKey };

/**
 * Simple TestSocket that emulates a socket.io socket without network connections
 */
import { EventEmitter } from 'events';
import { Player, Color } from '../src/types';
import { GameEvent } from '../src/constants';

export class TestSocket extends EventEmitter {
  id: string;
  connected: boolean = false;
  
  constructor(id: string) {
    super();
    this.id = id;
  }
  
  connect(): void {
    this.connected = true;
    this.emit('connect');
  }
  
  disconnect(): void {
    this.connected = false;
    this.emit('disconnect', 'io client disconnect');
    this.removeAllListeners();
  }
}

/**
 * Simple test server that creates test sockets
 */
export class TestServer {
  private nextSocketId = 1;
  private sockets: Map<string, TestSocket> = new Map();
  
  createSocket(): TestSocket {
    const id = `socket-${this.nextSocketId++}`;
    const socket = new TestSocket(id);
    this.sockets.set(id, socket);
    return socket;
  }
  
  cleanup(): void {
    // Disconnect all sockets
    for (const socket of this.sockets.values()) {
      if (socket.connected) {
        socket.disconnect();
      }
    }
    this.sockets.clear();
  }
}

/**
 * Helper function to simulate a player joining via a socket
 */
export function simulatePlayerJoining(socket: TestSocket): Promise<Player> {
  return new Promise((resolve) => {
    socket.once(GameEvent.PLAYER_JOINED, (player: Player) => {
      resolve(player);
    });
    
    // Connect the socket first
    socket.connect();
    
    // Then emit player_join event
    socket.emit(GameEvent.PLAYER_JOIN, {
      position: { x: 0, y: 1, z: 0 }
    });
  });
}

/**
 * Helper to verify that a color is unique compared to a set of other colors
 */
export function isColorUnique(color: Color, otherColors: Color[]): boolean {
  const MIN_COLOR_DISTANCE = 0.3;
  
  for (const otherColor of otherColors) {
    const rDiff = color.r - otherColor.r;
    const gDiff = color.g - otherColor.g;
    const bDiff = color.b - otherColor.b;
    
    const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
    if (distance < MIN_COLOR_DISTANCE) {
      return false;
    }
  }
  
  return true;
}

/**
 * Helper to serialize a color for comparisons
 */
export function getColorKey(color: Color): string {
  return `${color.r.toFixed(6)},${color.g.toFixed(6)},${color.b.toFixed(6)}`;
} 