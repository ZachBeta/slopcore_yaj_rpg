import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { createServer, Server as HttpServer } from 'http';
import { AddressInfo } from 'net';
import { GameServer } from './game-server';
import { GameEvent } from '../src/constants';
import { Player } from '../src/types';

// Test timeouts
const CONNECTION_TIMEOUT = 3000;
const CLEANUP_TIMEOUT = 5000;

interface GameServerOptions {
  isTestMode?: boolean;
}

/**
 * Creates an in-memory socket.io server and client for testing.
 * This uses real socket.io instances but with in-memory communication.
 */
export async function createSocketTestEnvironment<T extends GameServer = GameServer>(
  ServerClass: new (server: HttpServer, port: number, options: GameServerOptions) => T = GameServer as any
) {
  // Create real HTTP server
  const httpServer = createServer();
  
  // Start server on a random available port
  await new Promise<void>(resolve => {
    httpServer.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });
  
  const port = (httpServer.address() as AddressInfo).port;
  
  // Create real GameServer with test mode enabled
  const gameServer = new ServerClass(httpServer, port, { isTestMode: true });
  
  // Function to create a connected client
  const createClient = () => {
    return Client(`http://127.0.0.1:${port}`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 100,
      autoConnect: false // Don't connect automatically
    });
  };
  
  // Function to connect a client and join the game
  const connectAndJoin = async (client: ClientSocket) => {
    return new Promise<{ player: Player, socket: ClientSocket }>((resolve, reject) => {
      console.log('Attempting to connect and join...');
      
      // Make sure we're starting with a fresh connection
      if (client.connected) {
        console.log('Client already connected, disconnecting first');
        client.disconnect();
      }
      
      // Set a longer timeout for connection
      const timeout = setTimeout(() => {
        console.error('Connection timeout - client connected:', client.connected);
        client.disconnect();
        reject(new Error('Connection timeout - client connected but no PLAYER_JOINED event received'));
      }, CONNECTION_TIMEOUT);
      
      client.on('connect', () => {
        console.log('Socket connected, sending player_join event');
        client.emit(GameEvent.PLAYER_JOIN, {
          position: { x: 0, y: 1, z: 0 }
        });
      });
      
      client.on(GameEvent.PLAYER_JOINED, (player: Player) => {
        console.log('Received player_joined event with id:', player.id);
        clearTimeout(timeout);
        resolve({ player, socket: client });
      });
      
      // Debug events
      client.onAny((event, ...args) => {
        console.log(`Received event: ${event}`, args);
      });
      
      client.on('connect_error', (err) => {
        console.error('Connection error:', err);
        clearTimeout(timeout);
        reject(err);
      });
      
      client.on('error', (err) => {
        console.error('Socket error:', err);
        clearTimeout(timeout);
        reject(new Error(`Socket error: ${err}`));
      });
      
      // Listen for disconnect events
      client.on('disconnect', (reason) => {
        console.log('Socket disconnected during connection:', reason);
      });
      
      console.log('Calling client.connect()');
      client.connect();
    });
  };
  
  // Function to shut down the test environment
  const cleanup = async () => {
    return new Promise<void>((resolve) => {
      console.log('Cleaning up test environment');
      
      // Close the game server first
      if (gameServer && typeof gameServer.close === 'function') {
        console.log('Closing game server');
        gameServer.close();
      }
      
      // Close the HTTP server with a timeout to ensure all connections are cleaned up
      const closeTimeout = setTimeout(() => {
        console.warn('Server close timeout exceeded, forcing shutdown');
        resolve();
      }, CLEANUP_TIMEOUT);
      
      httpServer.close(() => {
        console.log('HTTP server closed');
        clearTimeout(closeTimeout);
        resolve();
      });
    });
  };
  
  return {
    httpServer,
    gameServer,
    port,
    createClient,
    connectAndJoin,
    cleanup
  };
} 