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
  const TEST_TIMEOUT = 30000;

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
    
    // Add error listener
    socket.on('connect_error', (err) => {
      done(new Error(`Connection error: ${err.message}`));
    });
    
    socket.on('error', (err) => {
      done(new Error(`Socket error: ${err.message}`));
    });
    
    // Add connection timeout handler
    const timeoutId = setTimeout(() => {
      done(new Error('Socket connection timed out'));
    }, 5000);
    
    socket.on(GameEvent.PLAYER_JOINED, (player: Player) => {
      clearTimeout(timeoutId);
      expect(player.id).toBeDefined();
      expect(typeof player.id).toBe('string');
      expect(player.position).toBeDefined();
      expect(player.position.x).toBeDefined();
      expect(player.position.y).toBeDefined();
      expect(player.position.z).toBeDefined();
      expect(player.color).toBeDefined();
      
      // Verify the player was actually added to the server's player list
      const players = gameServer.getPlayers();
      expect(players.has(player.id)).toBe(true);
      
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
    let playerId: string | null = null;
    
    // Add error listeners
    socket.on('connect_error', (err) => {
      done(new Error(`Connection error: ${err.message}`));
    });
    
    socket.on('error', (err) => {
      done(new Error(`Socket error: ${err.message}`));
    });
    
    // Set timeout for entire test
    const timeoutId = setTimeout(() => {
      done(new Error('Test timed out: No movement event received'));
    }, 5000);
    
    socket.on(GameEvent.PLAYER_JOINED, (player: Player) => {
      playerId = player.id;
      
      // Update position after player is registered
      socket.emit(GameEvent.POSITION_UPDATE, {
        position: { x: 1, y: 0, z: 1 },
        rotation: { x: 0, y: 0, z: 0 }
      });
    });

    socket.on(GameEvent.PLAYER_MOVED, (data: { id: string; position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } }) => {
      clearTimeout(timeoutId);
      expect(data.id).toBeDefined();
      expect(data.position).toBeDefined();
      expect(data.position.x).toBe(1); // Check exact coordinates
      expect(data.position.y).toBe(0);
      expect(data.position.z).toBe(1);
      expect(data.rotation).toBeDefined();
      
      // Verify this is the same player we registered
      if (playerId) {
        expect(data.id).toBe(playerId);
      }
      
      // Verify player position was updated in server
      const players = gameServer.getPlayers();
      const player = players.get(data.id);
      expect(player).toBeDefined();
      expect(player?.position.x).toBe(1);
      expect(player?.position.z).toBe(1);
      
      done();
    });

    // Connect and join
    socket.on('connect', () => {
      socket.emit(GameEvent.PLAYER_JOIN, { position: { x: 0, y: 0, z: 0 } });
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
    
    // Add error listeners
    socket.on('connect_error', (err) => {
      done(new Error(`Connection error: ${err.message}`));
    });
    
    socket.on('error', (err) => {
      done(new Error(`Socket error: ${err.message}`));
    });
    
    // Set timeout for entire test
    const timeoutId = setTimeout(() => {
      done(new Error(`Test timed out: playersListReceived=${playersListReceived}, playerJoinedReceived=${playerJoinedReceived}`));
    }, 5000);

    const checkCompletion = () => {
      if (playersListReceived && playerJoinedReceived) {
        clearTimeout(timeoutId);
        
        // Final validation - check game server state
        const players = gameServer.getPlayers();
        expect(players.size).toBeGreaterThan(0);
        
        // Verify color assignment
        const player = Array.from(players.values())[0];
        expect(player.color).toBeDefined();
        
        done();
      }
    };

    socket.on(GameEvent.PLAYERS_LIST, (players: Player[]) => {
      expect(Array.isArray(players)).toBe(true);
      // Should have at least the current player
      if (players.length > 0) {
        const player = players[0];
        expect(player.id).toBeDefined();
        expect(player.position).toBeDefined();
        expect(player.color).toBeDefined();
      }
      playersListReceived = true;
      checkCompletion();
    });

    socket.on(GameEvent.PLAYER_JOINED, (player: Player) => {
      expect(player.id).toBeDefined();
      expect(typeof player.id).toBe('string');
      expect(player.position).toBeDefined();
      expect(player.color).toBeDefined();
      playerJoinedReceived = true;
      checkCompletion();
    });

    // Connect and join
    socket.on('connect', () => {
      // Add log to see when connection happens
      console.log = jest.fn().mockImplementation((message) => {
        if (typeof message === 'string' && message.includes('player joined')) {
          console.info('Connection established for multiple players test');
        }
      });
      
      socket.emit(GameEvent.PLAYER_JOIN, { 
        position: { x: 0, y: 0, z: 0 },
        // Include optional data to make test more robust
        username: 'test-player'
      });
    });
  }, TEST_TIMEOUT);
}); 