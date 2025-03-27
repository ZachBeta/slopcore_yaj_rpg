import * as http from 'http';
import { Server } from 'socket.io';
import { io as ioc, Socket } from 'socket.io-client';
import { GameServer } from './game-server';
import { silenceConsole } from '../src/test/test-utils';

// Export for use in test files
export type { ConsoleSilencer } from '../src/test/test-utils';

export interface TestServerSetup {
  server: http.Server;
  gameServer: GameServer;
  serverSocket: Server;
  port: number;
  clientUrl: string;
  cleanup: () => Promise<void>;
}

// Constants for testing
export const CONNECTION_TIMEOUT = 500; // Shorter timeout (500ms)
export const DEFAULT_TEST_PORT = 3001;

// Socket event constants
export const SOCKET_EVENTS = {
  PLAYER_JOIN: 'player_join',
  PLAYER_JOINED: 'player_joined',
  CONNECT: 'connect',
  CONNECT_ERROR: 'connect_error',
  DISCONNECT: 'disconnect',
  REQUEST_PLAYER_DETAILS: 'request_player_details'
};

// Types for socket events
export interface PlayerJoinEvent {
  playerName: string;
}

export interface PlayerJoinedEvent {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  color: { r: number; g: number; b: number };
}

/**
 * Create a test server and socket for testing
 */
export const setupTestServer = async (
  port = DEFAULT_TEST_PORT
): Promise<TestServerSetup> => {
  // Create HTTP server
  const server = http.createServer();
  
  // Create Socket.IO server
  const serverSocket = new Server(server);
  
  // Create game server - GameServer constructor expects the HTTP server and port
  const gameServer = new GameServer(server, port);
  
  // Find an available port (try the default first, then increment)
  let currentPort = port;
  let isPortAvailable = false;
  
  while (!isPortAvailable && currentPort < port + 100) {
    try {
      await new Promise<void>((resolve, reject) => {
        server.once('error', (err: Error) => {
          if ('code' in err && err.code === 'EADDRINUSE') {
            log(`Port ${currentPort} in use, trying next...`);
            currentPort++;
            resolve();
          } else {
            reject(err);
          }
        });
        
        server.listen(currentPort, () => {
          isPortAvailable = true;
          resolve();
        });
      });
    } catch (err) {
      log(`Error setting up server on port ${currentPort}: ${err}`);
      currentPort++;
    }
  }
  
  if (!isPortAvailable) {
    throw new Error(`Could not find available port after trying ${port} through ${currentPort - 1}`);
  }
  
  const clientUrl = `http://localhost:${currentPort}`;
  
  // Return setup objects and cleanup function
  return {
    server,
    gameServer,
    serverSocket,
    port: currentPort,
    clientUrl,
    cleanup: async () => {
      return cleanupServer(server, gameServer);
    },
  };
};

/**
 * Connect a client to the server and join the game
 */
export const connectAndJoinGame = (
  url: string,
  playerName: string = 'Test Player'
): Promise<{ client: Socket; player: PlayerJoinedEvent }> => {
  return new Promise<{ client: Socket; player: PlayerJoinedEvent }>((resolve, reject) => {
    const client = ioc(url, {
      autoConnect: false,
      reconnection: false,
      timeout: CONNECTION_TIMEOUT,
    });
    
    // Set a timeout for connection
    const timeout = setTimeout(() => {
      log('Connection timeout - client connected:', client.connected);
      client.disconnect();
      reject(new Error('Connection timeout - client did not connect'));
    }, CONNECTION_TIMEOUT);
    
    // Set up event listeners before connecting
    client.once(SOCKET_EVENTS.PLAYER_JOINED, (data: PlayerJoinedEvent) => {
      log('Received player_joined event:', data);
      clearTimeout(timeout);
      resolve({ client, player: data });
    });
    
    client.on(SOCKET_EVENTS.CONNECT, () => {
      log('Socket connected, sending player_join event');
      client.emit(SOCKET_EVENTS.PLAYER_JOIN, { playerName });
    });
    
    client.on(SOCKET_EVENTS.CONNECT_ERROR, (err: Error) => {
      log(`Connection error: ${err}`);
      clearTimeout(timeout);
      client.disconnect();
      reject(err);
    });
    
    client.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      log(`Socket disconnected during connection: ${reason}`);
    });
    
    log('Calling client.connect()');
    client.connect();
  });
};

/**
 * Clean up the test server
 */
export const cleanupServer = async (
  server: http.Server,
  gameServer: GameServer
): Promise<void> => {
  return new Promise<void>((resolve) => {
    log('Cleaning up test environment');
    
    try {
      log('Closing game server');
      // Use close() instead of cleanup()
      if (gameServer && typeof gameServer.close === 'function') {
        gameServer.close();
      }
      
      // Add a safety timeout to close the server in case it hangs
      const safetyTimeout = setTimeout(() => {
        log('Server close timed out, forcing resolve');
        resolve();
      }, 500);
      
      server.close((err: Error | undefined) => {
        clearTimeout(safetyTimeout);
        if (err) {
          log(`Warning during server close: ${err}`);
        } else {
          log('HTTP server closed');
        }
        resolve();
      });
    } catch (err) {
      log(`Error during cleanup: ${err}`);
      resolve(); // Always resolve to prevent test hanging
    }
  });
};

/**
 * Helper function to silently log during tests
 */
export const log = (message: string, ...args: unknown[]): void => {
  if (process.env.NODE_ENV !== 'test' || process.env.DEBUG === 'true') {
    console.log(message, ...args);
  }
};

/**
 * Setup console silencing for tests
 */
export const setupTestConsole = (): ReturnType<typeof silenceConsole> => {
  return silenceConsole();
};

/**
 * Wait for a specific amount of time
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
}; 