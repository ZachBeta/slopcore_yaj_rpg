import express from 'express';
import http from 'http';
import { io as Client } from 'socket.io-client';
import { GameServer } from './game-server';

// Set environment to test mode
process.env.NODE_ENV = 'test';

const testPort = 3001;

// Define types for our test data
interface PlayerColor {
  r: number;
  g: number;
  b: number;
}

interface PlayerPosition {
  x: number;
  y: number;
  z: number;
}

interface PlayerRotation {
  x: number;
  y: number;
  z: number;
}

interface Player {
  id: string;
  position: PlayerPosition;
  rotation: PlayerRotation;
  color: PlayerColor;
}

describe('Socket.IO Server Integration Tests', () => {
  let app: express.Application;
  let server: http.Server;
  let gameServer: GameServer;
  let clientSocket: ReturnType<typeof Client>;

  // Expected test values
  const expectedColors = [
    { r: 1, g: 0, b: 0 },  // Red
    { r: 0, g: 1, b: 0 },  // Green
    { r: 0, g: 0, b: 1 }   // Blue
  ];

  const testPosition = { x: 1, y: 1, z: 1 };

  beforeAll((done) => {
    // Kill any existing process on port 3001
    try {
      require('child_process').execSync('lsof -ti:3001 | xargs kill -9 2>/dev/null || true');
    } catch (error) {
      console.log('No process was running on port 3001');
    }

    // Set up server
    app = express();
    server = http.createServer(app);
    gameServer = new GameServer(server, testPort);
    done();
  }, 3000);

  beforeEach((done) => {
    clientSocket = Client(`http://localhost:${testPort}`);
    clientSocket.on('connect', done);
  }, 2000);

  afterEach((done) => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    // Ensure all sockets are disconnected
    const io = gameServer.getIO();
    io.sockets.sockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect(true);
      }
    });
    done();
  });

  afterAll((done) => {
    // Close all remaining connections
    const io = gameServer.getIO();
    io.sockets.sockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect(true);
      }
    });
    
    // Close the server
    gameServer.close();
    server.close(() => {
      // Kill any remaining process on the test port
      try {
        require('child_process').execSync(`lsof -ti:${testPort} | xargs kill -9 2>/dev/null || true`);
      } catch (error) {
        console.log(`No process was running on port ${testPort}`);
      }
      done();
    });
  }, 3000);

  test('should handle player join with unique colors', (done) => {
    const secondClient = Client(`http://localhost:${testPort}`);
    const thirdClient = Client(`http://localhost:${testPort}`);
    
    // Track players and their data
    const players = new Map<string, Player>();
    let clientsConnected = 0;
    let testCompleted = false;
    let lastPlayerListSize = 0;

    const cleanup = () => {
      if (secondClient.connected) secondClient.disconnect();
      if (thirdClient.connected) thirdClient.disconnect();
      if (clientSocket.connected) clientSocket.disconnect();
    };

    const checkColors = function(this: ReturnType<typeof Client>, playersList: Player[]) {
      const clientId = this?.id || 'unknown';
      console.log(`[Client ${clientId}] Received players_list with ${playersList.length} players`);
      
      // Verify the list only grows (no players should disappear)
      expect(playersList.length).toBeGreaterThanOrEqual(lastPlayerListSize);
      lastPlayerListSize = playersList.length;
      
      // Update our player tracking
      playersList.forEach(player => {
        players.set(player.id, player);
      });

      // Only check final state when we have all three clients
      if (players.size === 3 && !testCompleted) {
        console.log('[FINAL] All players received, checking final state');
        
        try {
          const playerArray = Array.from(players.values());

          // Test 1: Verify we have exactly 3 players
          expect(players.size).toBe(3);

          // Test 2: Verify each player has the expected properties
          playerArray.forEach(player => {
            expect(player).toEqual(expect.objectContaining({
              id: expect.any(String),
              position: expect.objectContaining({
                x: testPosition.x,
                y: testPosition.y,
                z: testPosition.z
              }),
              rotation: expect.objectContaining({
                x: expect.any(Number),
                y: expect.any(Number),
                z: expect.any(Number)
              }),
              color: expect.objectContaining({
                r: expect.any(Number),
                g: expect.any(Number),
                b: expect.any(Number)
              })
            }));
          });

          // Test 3: Verify colors are unique and match expected values
          const colors = playerArray.map(p => p.color);
          const uniqueColors = new Set(colors.map(c => `${c.r},${c.g},${c.b}`));
          expect(uniqueColors.size).toBe(3);

          // Test 4: Verify each color matches one of our expected colors
          colors.forEach(color => {
            const matchesExpected = expectedColors.some(expected => 
              Math.abs(color.r - expected.r) < 0.01 &&
              Math.abs(color.g - expected.g) < 0.01 &&
              Math.abs(color.b - expected.b) < 0.01
            );
            expect(matchesExpected).toBe(true);
          });

          // Test 5: Verify positions are correct
          playerArray.forEach(player => {
            expect(player.position).toEqual(testPosition);
          });

          testCompleted = true;
          cleanup();
          done();
        } catch (error) {
          console.error('[ERROR] Final state check failed:', error instanceof Error ? error.message : String(error));
          testCompleted = true;
          cleanup();
          done(error);
        }
      }
    };

    // Set up connection tracking
    const onConnect = () => {
      clientsConnected++;
      console.log(`[Connection] Client connected (${clientsConnected}/3)`);
    };

    const onError = (error: Error) => {
      console.error('[ERROR] Socket error:', error);
      if (!testCompleted) {
        testCompleted = true;
        cleanup();
        done(error);
      }
    };

    const onDisconnect = () => {
      console.log('[Disconnect] Client disconnected');
      // Only fail on disconnect if it's unexpected (test not completed and not during cleanup)
      if (!testCompleted) {
        console.log('[WARNING] Unexpected client disconnect');
      }
    };

    // Set up event handlers
    [clientSocket, secondClient, thirdClient].forEach(client => {
      client.on('connect', onConnect);
      client.on('error', onError);
      client.on('disconnect', onDisconnect);
      client.on('players_list', checkColors);
    });

    // Connect clients with proper error handling
    console.log('[Start] Beginning client connections');
    
    const connectWithRetry = (client: ReturnType<typeof Client>, delay: number, index: number) => {
      setTimeout(() => {
        if (!testCompleted) {
          console.log(`[Connect] Sending player_join for client ${index}`);
          client.emit('player_join', { position: testPosition });
        }
      }, delay);
    };

    // Connect clients with minimal delays to ensure order
    connectWithRetry(clientSocket, 0, 1);
    connectWithRetry(secondClient, 20, 2);
    connectWithRetry(thirdClient, 40, 3);

    // Set a timeout to fail the test if it takes too long
    setTimeout(() => {
      if (!testCompleted) {
        console.error('[TIMEOUT] Test took too long to complete');
        console.error('Current state:', {
          playersSize: players.size,
          clientsConnected,
          lastPlayerListSize,
          players: Array.from(players.entries())
        });
        testCompleted = true;
        cleanup();
        done(new Error('Test timeout - see console for state dump'));
      }
    }, 2000);
  }, 3000);

  test('should handle position updates', (done) => {
    const testPosition = { x: 2, y: 1, z: 2 };
    let testCompleted = false;
    
    const secondClient = Client(`http://localhost:${testPort}`);
    
    const cleanup = () => {
      if (secondClient.connected) secondClient.disconnect();
      if (clientSocket.connected) clientSocket.disconnect();
    };

    secondClient.on('connect', () => {
      // First join as a player
      secondClient.emit('player_join', { position: testPosition });
      
      // Then after a short delay, send the position update
      setTimeout(() => {
        if (!testCompleted) {
          clientSocket.emit('position_update', { position: testPosition });
        }
      }, 100);
    });

    secondClient.on('player_moved', (data) => {
      try {
        expect(data.position).toEqual(testPosition);
        testCompleted = true;
        cleanup();
        done();
      } catch (error) {
        testCompleted = true;
        cleanup();
        done(error);
      }
    });

    // Set a timeout to fail the test
    setTimeout(() => {
      if (!testCompleted) {
        console.error('[TIMEOUT] Position update test took too long');
        testCompleted = true;
        cleanup();
        done(new Error('Position update test timeout'));
      }
    }, 2000);
  }, 3000);

  test('should handle player disconnect', (done) => {
    const secondClient = Client(`http://localhost:${testPort}`);
    let testCompleted = false;
    
    const cleanup = () => {
      if (secondClient.connected) secondClient.disconnect();
      if (clientSocket.connected) clientSocket.disconnect();
    };

    secondClient.on('connect', () => {
      // First join as a player
      secondClient.emit('player_join', { position: testPosition });
      
      // Then after a short delay, disconnect
      setTimeout(() => {
        if (!testCompleted) {
          const disconnectingClientId = secondClient.id;
          secondClient.disconnect();
          
          clientSocket.on('player_left', (playerId) => {
            try {
              expect(playerId).toBe(disconnectingClientId);
              testCompleted = true;
              cleanup();
              done();
            } catch (error) {
              testCompleted = true;
              cleanup();
              done(error);
            }
          });
        }
      }, 100);
    });

    // Set a timeout to fail the test
    setTimeout(() => {
      if (!testCompleted) {
        console.error('[TIMEOUT] Disconnect test took too long');
        testCompleted = true;
        cleanup();
        done(new Error('Disconnect test timeout'));
      }
    }, 2000);
  }, 3000);
}); 