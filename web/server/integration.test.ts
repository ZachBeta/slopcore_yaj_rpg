import express, { Express } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { io as Client, Socket } from 'socket.io-client';
import { GameServer } from './game-server';
import { execSync } from 'child_process';
import { GameEvent, ConnectionStatus, GameEventPayloads } from '../src/constants';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import type { Color, Position, Rotation } from '../src/types';

// Set environment to test mode
process.env.NODE_ENV = 'test';

const testPort = 3001;

interface Player {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
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

  getPlayers(): Map<string, any> {
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
  let app: Express;
  let server: HttpServer;
  let gameServer: TestGameServer;
  let clientSocket: Socket | null = null;
  let serverSocket: Socket | null = null;

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
  }, 5000);

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
          await new Promise<void>((resolve) => server.close(() => resolve()));
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
    gameServer = null as any;
    server = null as any;
  }, 5000);

  beforeEach((done) => {
    // Create new client socket for each test
    clientSocket = Client(`http://localhost:${testPort}`, {
      forceNew: true,
      transports: ['websocket']
    });

    // Wait for server to be ready
    setTimeout(done, 100);
  }, 5000);

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
  }, 5000);

  test('should handle player join with unique colors and positions', (done) => {
    console.log('Starting player join test...');
    const secondClient = Client(`http://localhost:${testPort}`, {
      reconnectionDelay: 0,
      forceNew: true,
      transports: ['websocket']
    });
    const thirdClient = Client(`http://localhost:${testPort}`, {
      reconnectionDelay: 0,
      forceNew: true,
      transports: ['websocket']
    });
    
    // Track colors and positions by player ID
    const playerColors = new Map<string, string>();
    const playerPositions = new Map<string, string>();
    let testCompleted = false;

    const cleanup = () => {
      testCompleted = true;
      if (secondClient) {
        if (secondClient.connected) secondClient.disconnect();
        secondClient.removeAllListeners();
      }
      if (thirdClient) {
        if (thirdClient.connected) thirdClient.disconnect();
        thirdClient.removeAllListeners();
      }
    };

    const checkPlayersState = (players: Player[]) => {
      const clientId = (this as any)?.id || 'unknown';
      console.log(`[Client ${clientId}] Received players_list with ${players.length} players`);
      
      // Update our tracking for each player
      players.forEach(player => {
        if (player.color) {
          const colorKey = `${player.color.r},${player.color.g},${player.color.b}`;
          playerColors.set(player.id, colorKey);
          console.log(`[Color] Player ${player.id} has color ${colorKey}`);
        }
        if (player.position) {
          const posKey = `${player.position.x},${player.position.y},${player.position.z}`;
          playerPositions.set(player.id, posKey);
          console.log(`[Position] Player ${player.id} at ${posKey}`);
        }
      });

      // Log current state
      console.log(`[State] Total tracked players: ${playerColors.size}`);
      console.log(`[State] Current players and colors:`, Array.from(playerColors.entries()));
      console.log(`[State] Current players and positions:`, Array.from(playerPositions.entries()));
      
      // Only check final state when we have all three clients connected and have received their data
      if (playerColors.size >= 3 && playerPositions.size >= 3 && !testCompleted) {
        console.log('[FINAL] All players received and connected, checking final state');
        try {
          // Check color uniqueness
          expect(playerColors.size).toBe(3);
          const uniqueColors = new Set(playerColors.values());
          expect(uniqueColors.size).toBe(3);
          
          // Check position uniqueness
          expect(playerPositions.size).toBe(3);
          const uniquePositions = new Set(playerPositions.values());
          expect(uniquePositions.size).toBe(3);
          
          cleanup();
          done();
        } catch (error) {
          console.error('[ERROR] Final state check failed:', error instanceof Error ? error.message : String(error));
          cleanup();
          done(error);
        }
      }
    };

    // Set up error handlers
    const onError = (error: Error) => {
      console.error('[ERROR] Socket error:', error);
      if (!testCompleted) {
        cleanup();
        done(error);
      }
    };

    // Also listen for player_joined events to track state
    const onPlayerJoined = (data: Player) => {
      console.log(`[Event] Player joined: ${data.id}`);
      if (data.color) {
        const colorKey = `${data.color.r},${data.color.g},${data.color.b}`;
        playerColors.set(data.id, colorKey);
        console.log(`[Color] Player ${data.id} has color ${colorKey}`);
      }
      if (data.position) {
        const posKey = `${data.position.x},${data.position.y},${data.position.z}`;
        playerPositions.set(data.id, posKey);
        console.log(`[Position] Player ${data.id} at ${posKey}`);
      }
    };

    secondClient.on('error', onError);
    thirdClient.on('error', onError);

    // Set up players_list and player_joined handlers for all clients
    clientSocket.on(GameEvent.PLAYERS_LIST, (players: GameEventPayloads[typeof GameEvent.PLAYERS_LIST]) => {
      checkPlayersState(players);
    });
    secondClient.on(GameEvent.PLAYERS_LIST, (players: GameEventPayloads[typeof GameEvent.PLAYERS_LIST]) => {
      checkPlayersState(players);
    });
    thirdClient.on(GameEvent.PLAYERS_LIST, (players: GameEventPayloads[typeof GameEvent.PLAYERS_LIST]) => {
      checkPlayersState(players);
    });

    clientSocket.on(GameEvent.PLAYER_JOINED, (player: GameEventPayloads[typeof GameEvent.PLAYER_JOINED]) => {
      onPlayerJoined(player);
    });
    secondClient.on(GameEvent.PLAYER_JOINED, (player: GameEventPayloads[typeof GameEvent.PLAYER_JOINED]) => {
      onPlayerJoined(player);
    });
    thirdClient.on(GameEvent.PLAYER_JOINED, (player: GameEventPayloads[typeof GameEvent.PLAYER_JOINED]) => {
      onPlayerJoined(player);
    });

    // Use different positions for each client
    const positions = [
      { x: 0, y: 1, z: 0 },
      { x: 5, y: 1, z: 5 },
      { x: -5, y: 1, z: -5 }
    ];
    
    // Connect clients in sequence with longer delays
    console.log('Connecting first client...');
    clientSocket.emit(GameEvent.PLAYER_JOIN, { position: positions[0] });
    
    setTimeout(() => {
      if (!testCompleted) {
        console.log('Connecting second client...');
        secondClient.emit(GameEvent.PLAYER_JOIN, { position: positions[1] });
      }
    }, 500);

    setTimeout(() => {
      if (!testCompleted) {
        console.log('Connecting third client...');
        thirdClient.emit(GameEvent.PLAYER_JOIN, { position: positions[2] });
      }
    }, 1000);

    // Add timeout for the entire test
    setTimeout(() => {
      if (!testCompleted) {
        console.error('Test timeout');
        cleanup();
        done(new Error('Test timeout'));
      }
    }, 5000);
  }, 10000);

  test('should handle player position updates', (done) => {
    if (!clientSocket) {
      done(new Error('Client socket not initialized'));
      return;
    }

    const position = { x: 1, y: 2, z: 3 };
    const rotation = { x: 0.1, y: 0.2, z: 0.3 };

    clientSocket.on(GameEvent.PLAYER_MOVED, (data: GameEventPayloads[typeof GameEvent.PLAYER_MOVED]) => {
      try {
        expect(data).toBeDefined();
        expect(data.id).toBe(clientSocket!.id);
        expect(data.position).toEqual(position);
        expect(data.rotation).toEqual(rotation);
        done();
      } catch (error) {
        done(error);
      }
    });

    clientSocket.emit(GameEvent.POSITION_UPDATE, { position, rotation });
  });

  test('should handle chat messages', (done) => {
    if (!clientSocket) {
      done(new Error('Client socket not initialized'));
      return;
    }

    clientSocket.on(GameEvent.CHAT_MESSAGE, (data: GameEventPayloads[typeof GameEvent.CHAT_MESSAGE]) => {
      try {
        expect(data).toBeDefined();
        expect(data.id).toBe(clientSocket!.id);
        expect(data.message).toBe('Hello, World!');
        done();
      } catch (error) {
        done(error);
      }
    });

    clientSocket.emit(GameEvent.CHAT_MESSAGE, { id: clientSocket.id, message: 'Hello, World!' });
  });

  test('should handle player joining', (done) => {
    if (!clientSocket) {
      done(new Error('Client socket not initialized'));
      return;
    }

    clientSocket.on(GameEvent.PLAYER_JOINED, (player: GameEventPayloads[typeof GameEvent.PLAYER_JOINED]) => {
      try {
        expect(player).toBeDefined();
        expect(player.id).toBeDefined();
        expect(player.position).toBeDefined();
        expect(player.color).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });

    clientSocket.emit(GameEvent.PLAYER_JOIN, { position: { x: 0, y: 0, z: 0 } });
  });

  test('should handle player movement', (done) => {
    if (!clientSocket) {
      done(new Error('Client socket not initialized'));
      return;
    }

    const newPosition = { x: 1, y: 2, z: 3 };
    const newRotation = { x: 0.1, y: 0.2, z: 0.3 };

    clientSocket.on(GameEvent.PLAYER_MOVED, (data: GameEventPayloads[typeof GameEvent.PLAYER_MOVED]) => {
      try {
        expect(data.id).toBe(clientSocket!.id);
        expect(data.position).toEqual(newPosition);
        expect(data.rotation).toEqual(newRotation);
        done();
      } catch (error) {
        done(error);
      }
    });

    clientSocket.emit(GameEvent.POSITION_UPDATE, { position: newPosition, rotation: newRotation });
  });

  test('should handle player disconnection', (done) => {
    if (!clientSocket) {
      done(new Error('Client socket not initialized'));
      return;
    }

    const onError = (error: Error) => {
      done(error);
    };

    const onPlayerLeft = (playerId: string) => {
      try {
        expect(playerId).toBe(clientSocket!.id);
        done();
      } catch (error) {
        done(error);
      }
    };

    clientSocket.on('error', onError);
    clientSocket.on(GameEvent.PLAYER_LEFT, onPlayerLeft);
    clientSocket.disconnect();
  });

  test('should handle multiple players', (done) => {
    if (!clientSocket) {
      done(new Error('Client socket not initialized'));
      return;
    }

    clientSocket.on(GameEvent.PLAYERS_LIST, (players: GameEventPayloads[typeof GameEvent.PLAYERS_LIST]) => {
      try {
        expect(players).toBeDefined();
        expect(players.length).toBe(1);
        expect(players[0].id).toBe(clientSocket!.id);
        done();
      } catch (error) {
        done(error);
      }
    });

    clientSocket.emit(GameEvent.PLAYER_JOIN, { position: { x: 0, y: 0, z: 0 } });
  });

  test('should connect to the server', (done) => {
    if (!clientSocket) {
      done(new Error('Client socket not initialized'));
      return;
    }

    expect(clientSocket.connected).toBe(true);
    done();
  });

  test('should handle player list updates', (done) => {
    if (!clientSocket) {
      done(new Error('Client socket not initialized'));
      return;
    }

    clientSocket.on(GameEvent.PLAYERS_LIST, (players: GameEventPayloads[typeof GameEvent.PLAYERS_LIST]) => {
      try {
        expect(players).toBeDefined();
        expect(Array.isArray(players)).toBe(true);
        done();
      } catch (error) {
        done(error);
      }
    });

    clientSocket.emit(GameEvent.PLAYER_JOIN, { position: { x: 0, y: 0, z: 0 } });
  });

  test('should handle players list', (done) => {
    if (!clientSocket) {
      done(new Error('Client socket not initialized'));
      return;
    }

    const positions = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1 }
    ];

    clientSocket.on(GameEvent.PLAYERS_LIST, (players: GameEventPayloads[typeof GameEvent.PLAYERS_LIST]) => {
      try {
        expect(players).toBeDefined();
        expect(players.length).toBe(1);
        done();
      } catch (error) {
        done(error);
      }
    });

    clientSocket.emit(GameEvent.PLAYER_JOIN, { position: positions[0] });
  });

  test('handles player joining', (done) => {
    expect(clientSocket).toBeDefined();
    if (!clientSocket) {
      done(new Error('Client socket not initialized'));
      return;
    }

    clientSocket.on(GameEvent.PLAYER_JOINED, (player: Player) => {
      expect(player.id).toBeDefined();
      expect(player.position).toBeDefined();
      expect(player.color).toBeDefined();
      done();
    });

    // Connect to server
    clientSocket.on('connect', () => {
      // Join the game
      clientSocket!.emit(GameEvent.PLAYER_JOIN, { position: { x: 0, y: 0, z: 0 } });
    });
  }, TEST_TIMEOUT);

  test('handles player movement', (done) => {
    expect(clientSocket).toBeDefined();
    if (!clientSocket) {
      done(new Error('Client socket not initialized'));
      return;
    }

    clientSocket.on(GameEvent.PLAYER_MOVED, (data: { id: string; position: Position; rotation: Rotation }) => {
      expect(data.id).toBeDefined();
      expect(data.position).toBeDefined();
      expect(data.rotation).toBeDefined();
      done();
    });

    // Connect and join
    clientSocket.on('connect', () => {
      clientSocket!.emit(GameEvent.PLAYER_JOIN, { position: { x: 0, y: 0, z: 0 } });
      
      // Update position after a short delay
      setTimeout(() => {
        clientSocket!.emit(GameEvent.POSITION_UPDATE, {
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

    let playersListReceived = false;
    let playerJoinedReceived = false;

    const checkCompletion = () => {
      if (playersListReceived && playerJoinedReceived) {
        done();
      }
    };

    clientSocket.on(GameEvent.PLAYERS_LIST, (players: Player[]) => {
      expect(Array.isArray(players)).toBe(true);
      playersListReceived = true;
      checkCompletion();
    });

    clientSocket.on(GameEvent.PLAYER_JOINED, (player: Player) => {
      expect(player.id).toBeDefined();
      expect(player.position).toBeDefined();
      expect(player.color).toBeDefined();
      playerJoinedReceived = true;
      checkCompletion();
    });

    // Connect and join
    clientSocket.on('connect', () => {
      clientSocket!.emit(GameEvent.PLAYER_JOIN, { position: { x: 0, y: 0, z: 0 } });
    });
  }, TEST_TIMEOUT);
}); 