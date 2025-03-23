import express, { Express } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { io as Client, Socket } from 'socket.io-client';
import { GameServer } from './game-server';
import { execSync } from 'child_process';

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

describe('Socket.IO Server Integration Tests', () => {
  let app: Express;
  let server: HttpServer;
  let gameServer: GameServer;
  let clientSocket: Socket;

  beforeAll((done) => {
    // Kill any existing process on port 3001
    try {
      execSync('lsof -ti:3001 | xargs kill -9 2>/dev/null || true');
    } catch (error) {
      console.log('No process was running on port 3001');
    }

    // Set up server
    app = express();
    server = createServer(app);
    
    // Start server first
    server.listen(testPort, () => {
      console.log(`Test server listening on port ${testPort}`);
      // Then initialize game server
      gameServer = new GameServer(server, testPort);
      done();
    });
  }, 5000);

  beforeEach((done) => {
    console.log('Attempting to connect client socket...');
    clientSocket = Client(`http://localhost:${testPort}`, {
      reconnectionDelay: 0,
      forceNew: true,
      transports: ['websocket']
    });
    
    clientSocket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });
    
    clientSocket.on('connect', () => {
      console.log('Client socket connected successfully');
      done();
    });

    // Add timeout for connection attempt
    setTimeout(() => {
      if (!clientSocket.connected) {
        console.error('Socket connection timeout');
        done(new Error('Socket connection timeout'));
      }
    }, 2000);
  }, 5000);

  afterEach((done) => {
    if (clientSocket) {
      if (clientSocket.connected) {
        clientSocket.disconnect();
      }
      clientSocket.removeAllListeners();
      clientSocket = null;
    }
    
    // Clean up any remaining sockets
    if (gameServer && gameServer.getIO()) {
      const io = gameServer.getIO();
      io.sockets.sockets.forEach(socket => {
        if (socket.connected) {
          socket.disconnect(true);
        }
      });
    }
    done();
  });

  afterAll((done) => {
    const cleanup = async () => {
      // First disconnect all sockets
      if (gameServer && gameServer.getIO()) {
        const io = gameServer.getIO();
        const sockets = Array.from(io.sockets.sockets.values());
        for (const socket of sockets) {
          if (socket.connected) {
            socket.disconnect(true);
          }
        }
      }

      // Close the game server
      if (gameServer) {
        gameServer.close();
      }

      // Close the HTTP server
      if (server) {
        await new Promise<void>((resolve) => server.close(resolve));
      }

      // Kill any remaining process on the test port
      try {
        execSync(`lsof -ti:${testPort} | xargs kill -9 2>/dev/null || true`);
      } catch (error) {
        console.log(`No process was running on port ${testPort}`);
      }

      done();
    };

    cleanup().catch((error) => {
      console.error('Error during cleanup:', error);
      done(error);
    });
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
      const clientId = this?.id || 'unknown';
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
    clientSocket.on('players_list', checkPlayersState);
    secondClient.on('players_list', checkPlayersState);
    thirdClient.on('players_list', checkPlayersState);

    clientSocket.on('player_joined', onPlayerJoined);
    secondClient.on('player_joined', onPlayerJoined);
    thirdClient.on('player_joined', onPlayerJoined);

    // Use different positions for each client
    const positions = [
      { x: 0, y: 1, z: 0 },
      { x: 5, y: 1, z: 5 },
      { x: -5, y: 1, z: -5 }
    ];
    
    // Connect clients in sequence with longer delays
    console.log('Connecting first client...');
    clientSocket.emit('player_join', { position: positions[0] });
    
    setTimeout(() => {
      if (!testCompleted) {
        console.log('Connecting second client...');
        secondClient.emit('player_join', { position: positions[1] });
      }
    }, 500);

    setTimeout(() => {
      if (!testCompleted) {
        console.log('Connecting third client...');
        thirdClient.emit('player_join', { position: positions[2] });
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
    let positionUpdateReceived = false;

    clientSocket.on('player_moved', (data: { id: string; position: Player['position']; rotation: Player['rotation'] }) => {
      expect(data.id).toBeDefined();
      expect(data.position).toBeDefined();
      expect(data.position.x).toBeDefined();
      expect(data.position.y).toBeDefined();
      expect(data.position.z).toBeDefined();
      expect(data.rotation).toBeDefined();
      expect(data.rotation.x).toBeDefined();
      expect(data.rotation.y).toBeDefined();
      expect(data.rotation.z).toBeDefined();
      positionUpdateReceived = true;
      done();
    });

    // Emit a position update
    clientSocket.emit('position_update', {
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 0, y: 0, z: 0 }
    });

    // Add timeout for the test
    setTimeout(() => {
      if (!positionUpdateReceived) {
        done(new Error('Position update not received'));
      }
    }, 2000);
  }, 5000);

  test('should handle chat messages', (done) => {
    let chatMessageReceived = false;

    clientSocket.on('chat_message', (data: { id: string; message: string }) => {
      expect(data.id).toBeDefined();
      expect(data.message).toBeDefined();
      expect(data.message).toBe('Hello, World!');
      chatMessageReceived = true;
      done();
    });

    // Emit a chat message
    clientSocket.emit('chat_message', 'Hello, World!');

    // Add timeout for the test
    setTimeout(() => {
      if (!chatMessageReceived) {
        done(new Error('Chat message not received'));
      }
    }, 2000);
  }, 5000);
}); 