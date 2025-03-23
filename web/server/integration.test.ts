import { GameServer } from './game-server';
import { createServer, Server as HttpServer } from 'http';
import { io as Client, Socket } from 'socket.io-client';
import type { Color, Player } from '../src/types';
import { GameEvent } from '../src/constants';

// Test-specific subclass to access protected properties
class TestGameServer extends GameServer {
  getColorPool(): Color[] {
    return this.colorPool;
  }

  getAvailableColors(): Color[] {
    return this.availableColors;
  }

  getLockedColors(): Map<string, Color> {
    return this.lockedColors;
  }

  getUsedRandomColors(): Set<Color> {
    return this.usedRandomColors;
  }

  getPlayers(): Map<string, Player> {
    return this.players;
  }

  setAvailableColors(colors: Color[]): void {
    this.availableColors = colors;
  }

  clearLockedColors(): void {
    this.lockedColors.clear();
  }

  clearUsedRandomColors(): void {
    this.usedRandomColors.clear();
  }

  clearPlayers(): void {
    this.players.clear();
  }
}

describe('Socket.IO Server Integration Tests', () => {
  let server: HttpServer;
  let gameServer: TestGameServer;
  let clientSocket: Socket | null = null;
  let serverSocket: Socket | null = null;
  const testPort = 3001;
  const TEST_TIMEOUT = 5000;

  beforeAll((done) => {
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    server = createServer();
    gameServer = new TestGameServer(server, testPort, { isTestMode: true });
    
    // Start server and wait for it to be ready
    server.listen(testPort, () => {
      // Give server a moment to fully initialize
      setTimeout(done, 100);
    });

    // Add error handler for the server
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // If port is in use, try to close any existing connections
        server.close(() => {
          // Try to listen again after a short delay
          setTimeout(() => {
            server.listen(testPort, () => {
              setTimeout(done, 100);
            });
          }, 100);
        });
      } else {
        console.error('Server error:', err);
        done(err);
      }
    });
  }, TEST_TIMEOUT);

  afterAll(async () => {
    jest.restoreAllMocks();
    
    // Clean up sockets
    if (clientSocket) {
      if (clientSocket.connected) {
        clientSocket.disconnect();
      }
      clientSocket.close();
    }
    if (serverSocket) {
      if (serverSocket.connected) {
        serverSocket.disconnect();
      }
      serverSocket.close();
    }

    // Clear the diagnostics interval
    if (gameServer) {
      clearInterval(gameServer['diagnosticsInterval']);
    }

    // Then close servers with proper cleanup
    await new Promise<void>((resolve) => {
      if (gameServer) {
        try {
          gameServer.close();
        } catch (err) {
          console.error('Error closing game server:', err);
        }
      }
      if (server) {
        try {
          server.close(() => {
            resolve();
          });
        } catch (err) {
          console.error('Error closing HTTP server:', err);
          resolve();
        }
      } else {
        resolve();
      }
    });

    // Final cleanup
    clientSocket = null;
    serverSocket = null;
    gameServer = null as unknown as TestGameServer;
    server = null as unknown as HttpServer;
  }, TEST_TIMEOUT);

  beforeEach((done) => {
    // Create new client socket for each test
    clientSocket = Client(`http://localhost:${testPort}`, {
      forceNew: true,
      transports: ['websocket']
    });

    // Wait for server to be ready
    setTimeout(done, 100);
  }, TEST_TIMEOUT);

  afterEach((done) => {
    // Disconnect client socket
    if (clientSocket) {
      if (clientSocket.connected) {
        clientSocket.disconnect();
      }
      clientSocket.close();
      clientSocket = null;
    }

    // Wait for server to process disconnection
    setTimeout(done, 100);
  }, TEST_TIMEOUT);

  test('handles player joining', (done) => {
    expect(clientSocket).toBeDefined();
    if (!clientSocket) {
      done(new Error('Client socket not initialized'));
      return;
    }

    const socket = clientSocket;
    socket.on(GameEvent.PLAYER_JOINED, (player: Player) => {
      expect(player.id).toBeDefined();
      expect(player.position).toBeDefined();
      expect(player.color).toBeDefined();
      done();
    });

    // Connect to server
    socket.on('connect', () => {
      // Join the game
      socket.emit(GameEvent.PLAYER_JOIN, { position: { x: 0, y: 0, z: 0 } });
    });
  }, TEST_TIMEOUT);

  test('handles player movement', (done) => {
    expect(clientSocket).toBeDefined();
    if (!clientSocket) {
      done(new Error('Client socket not initialized'));
      return;
    }

    const socket = clientSocket;
    socket.on(GameEvent.PLAYER_MOVED, (data: { id: string; position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } }) => {
      expect(data.id).toBeDefined();
      expect(data.position).toBeDefined();
      expect(data.rotation).toBeDefined();
      done();
    });

    // Connect and join
    socket.on('connect', () => {
      socket.emit(GameEvent.PLAYER_JOIN, { position: { x: 0, y: 0, z: 0 } });
      
      // Update position after a short delay
      setTimeout(() => {
        socket.emit(GameEvent.POSITION_UPDATE, {
          position: { x: 1, y: 0, z: 1 },
          rotation: { x: 0, y: 0, z: 0 }
        });
      }, 100);
    });
  }, TEST_TIMEOUT);

  test('handles multiple players', (done) => {
    expect(clientSocket).toBeDefined();
    if (!clientSocket) {
      done(new Error('Client socket not initialized'));
      return;
    }

    const socket = clientSocket;
    let playersListReceived = false;
    let playerJoinedReceived = false;

    const checkCompletion = () => {
      if (playersListReceived && playerJoinedReceived) {
        done();
      }
    };

    socket.on(GameEvent.PLAYERS_LIST, (players: Player[]) => {
      expect(Array.isArray(players)).toBe(true);
      playersListReceived = true;
      checkCompletion();
    });

    socket.on(GameEvent.PLAYER_JOINED, (player: Player) => {
      expect(player.id).toBeDefined();
      expect(player.position).toBeDefined();
      expect(player.color).toBeDefined();
      playerJoinedReceived = true;
      checkCompletion();
    });

    // Connect and join
    socket.on('connect', () => {
      socket.emit(GameEvent.PLAYER_JOIN, { position: { x: 0, y: 0, z: 0 } });
    });
  }, TEST_TIMEOUT);
}); 