const express = require('express');
const http = require('http');
const { io: Client } = require('socket.io-client');
const { GameServer } = require('./game-server');

// Set environment to test mode
process.env.NODE_ENV = 'test';

const testPort = 3001;

describe('Socket.IO Server Integration Tests', () => {
  let app, server, gameServer, clientSocket;

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
    const testPosition = { x: 1, y: 1, z: 1 };
    const secondClient = Client(`http://localhost:${testPort}`);
    const thirdClient = Client(`http://localhost:${testPort}`);
    
    // Track colors by player ID
    const playerColors = new Map();
    let playersReceived = 0;
    let clientsConnected = 0;
    let testCompleted = false;

    const cleanup = () => {
      if (secondClient.connected) secondClient.disconnect();
      if (thirdClient.connected) thirdClient.disconnect();
      if (clientSocket.connected) clientSocket.disconnect();
    };

    const checkColors = (players) => {
      const clientId = this?.id || 'unknown';
      console.log(`[Client ${clientId}] Received players_list with ${players.length} players`);
      
      // Update our color tracking for each player
      players.forEach(player => {
        if (player.color) {
          const colorKey = `${player.color.r},${player.color.g},${player.color.b}`;
          playerColors.set(player.id, colorKey);
        }
      });

      // Check for uniqueness among all current players
      const uniqueColors = new Set(playerColors.values());
      console.log(`[State] Current players and colors:`, Array.from(playerColors.entries()));
      console.log(`[State] Unique colors: ${uniqueColors.size}/${playerColors.size}`);
      
      // Only check final state when we have all three clients connected and have received their data
      if (playerColors.size === 3 && uniqueColors.size === 3 && !testCompleted) {
        console.log('[FINAL] All players received and connected, checking final state');
        console.log('[FINAL] Player colors:', Array.from(playerColors.entries()));
        try {
          expect(playerColors.size).toBe(3);
          expect(uniqueColors.size).toBe(3);
          testCompleted = true;
          cleanup();
          done();
        } catch (error) {
          console.error('[ERROR] Final state check failed:', error.message);
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

    const onError = (error) => {
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

    clientSocket.on('connect', onConnect);
    secondClient.on('connect', onConnect);
    thirdClient.on('connect', onConnect);

    clientSocket.on('error', onError);
    secondClient.on('error', onError);
    thirdClient.on('error', onError);

    clientSocket.on('disconnect', onDisconnect);
    secondClient.on('disconnect', onDisconnect);
    thirdClient.on('disconnect', onDisconnect);

    // Set up players_list handlers
    clientSocket.on('players_list', checkColors);
    secondClient.on('players_list', checkColors);
    thirdClient.on('players_list', checkColors);

    // Connect clients with proper error handling
    console.log('[Start] Beginning client connections');
    
    const connectWithRetry = (client, delay, index) => {
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
        testCompleted = true;
        cleanup();
        done(new Error('Test timeout'));
      }
    }, 500); // Set timeout to 500ms
  }, 1000); // Test timeout of 1 second

  test('should handle position updates', (done) => {
    const testPosition = { x: 2, y: 1, z: 2 };
    
    const secondClient = Client(`http://localhost:${testPort}`);
    secondClient.on('connect', () => {
      clientSocket.emit('position_update', { position: testPosition });
    });

    secondClient.on('player_moved', (data) => {
      expect(data.position).toEqual(testPosition);
      secondClient.disconnect();
      done();
    });
  }, 2000);

  test('should handle player disconnect', (done) => {
    const secondClient = Client(`http://localhost:${testPort}`);
    
    secondClient.on('connect', () => {
      const disconnectingClientId = secondClient.id;
      secondClient.disconnect();
      
      clientSocket.on('player_left', (playerId) => {
        expect(playerId).toBe(disconnectingClientId);
        done();
      });
    });
  }, 2000);
});