import { Server as SocketIOServer } from 'socket.io';
import { io as SocketIOClient, Socket as ClientSocket } from 'socket.io-client';
import { createServer, Server as HTTPServer } from 'http';
import { AddressInfo } from 'net';
import { GameServer } from './game-server';
import { GameEvent } from '../src/constants';
import { Player } from '../src/types';

// Test timeouts
const CONNECTION_TIMEOUT = 5000;
const CLEANUP_TIMEOUT = 10000;
const TEST_PORT = 3001;
const RETRY_DELAY = 1000;
const MAX_RETRIES = 3;

let httpServer: HTTPServer | null = null;
let io: SocketIOServer | null = null;
let gameServer: GameServer | null = null;

interface GameServerOptions {
  isTestMode?: boolean;
}

interface TestEnvironment<T extends GameServer = GameServer> {
  httpServer: HTTPServer;
  io: SocketIOServer;
  gameServer: T;
  cleanup: () => Promise<void>;
  createClient: () => ClientSocket;
  connectAndJoin: (client: ClientSocket) => Promise<{ player: Player }>;
}

/**
 * Creates a socket.io server and client for testing on port 3001.
 * This uses real socket.io instances for reliable testing.
 */
export async function createSocketTestEnvironment<T extends GameServer = GameServer>(
  ServerClass: new (server: SocketIOServer, port: number, options: GameServerOptions) => T = GameServer as any
): Promise<TestEnvironment<T>> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (httpServer || io || gameServer) {
        await cleanupTestEnvironment();
      }

      httpServer = createServer();
      io = new SocketIOServer(httpServer);
      gameServer = new ServerClass(io, TEST_PORT, { isTestMode: true });

      await new Promise<void>((resolve, reject) => {
        httpServer!.once('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${TEST_PORT} in use, attempt ${attempt}/${MAX_RETRIES}`);
            cleanupTestEnvironment()
              .then(() => {
                if (attempt === MAX_RETRIES) {
                  reject(new Error(`Port ${TEST_PORT} is still in use after ${MAX_RETRIES} attempts`));
                } else {
                  setTimeout(resolve, RETRY_DELAY);
                }
              })
              .catch(reject);
          } else {
            reject(err);
          }
        });

        httpServer!.listen(TEST_PORT, () => {
          console.log(`Test server listening on port ${TEST_PORT}`);
          resolve();
        });
      });

      return {
        httpServer: httpServer as HTTPServer,
        io: io as SocketIOServer,
        gameServer: gameServer as T,
        cleanup: cleanupTestEnvironment,
        createClient,
        connectAndJoin: async (client: ClientSocket) => {
          const player = await connectAndJoinInternal(client);
          return { player };
        }
      };
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }

  throw new Error('Failed to create test environment after all retries');
}

async function cleanupTestEnvironment() {
  const cleanup = async () => {
    const promises: Promise<void>[] = [];

    if (gameServer) {
      promises.push(
        new Promise<void>((resolve) => {
          console.log('Closing game server');
          gameServer.close();
          gameServer = null;
          resolve();
        })
      );
    }

    if (io) {
      promises.push(
        new Promise<void>((resolve) => {
          io.close(() => {
            io = null;
            resolve();
          });
        })
      );
    }

    if (httpServer) {
      promises.push(
        new Promise<void>((resolve) => {
          httpServer.close(() => {
            console.log('HTTP server closed');
            httpServer = null;
            resolve();
          });
        })
      );
    }

    await Promise.all(promises);
  };

  try {
    await Promise.race([
      cleanup(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Cleanup timeout')), CLEANUP_TIMEOUT))
    ]);
  } catch (err) {
    console.error('Error during cleanup:', err);
    // Force cleanup if timeout occurs
    gameServer = null;
    io = null;
    httpServer = null;
  }
}

function createClient(): ClientSocket {
  return SocketIOClient(`http://localhost:${TEST_PORT}`, {
    reconnection: false,
    timeout: CONNECTION_TIMEOUT,
    forceNew: true
  });
}

function connectAndJoinInternal(client: ClientSocket): Promise<Player> {
  let timeoutHandle: NodeJS.Timeout;
  
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeoutHandle);
      client.removeAllListeners();
    };

    timeoutHandle = setTimeout(() => {
      cleanup();
      console.error('Connection timeout - client connected:', client.connected);
      client.disconnect();
      reject(new Error('Connection timeout - client connected but no PLAYER_JOINED event received'));
    }, CONNECTION_TIMEOUT);

    client.on('connect_error', (err) => {
      cleanup();
      console.error('Connection error:', err);
      reject(err);
    });

    client.on('connect', () => {
      client.emit(GameEvent.PLAYER_JOIN, {
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      });
    });

    client.on(GameEvent.PLAYER_JOINED, (player: Player) => {
      cleanup();
      resolve(player);
    });

    client.on('error', (error: Error) => {
      cleanup();
      reject(error);
    });

    client.connect();
  });
} 