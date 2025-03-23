import { GameServer } from './game-server';
import { createServer, Server as HttpServer } from 'http';
import { io as Client, Socket } from 'socket.io-client';

interface Color {
  r: number;
  g: number;
  b: number;
}

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
  color: Color;
}

describe('Color Management', () => {
  let httpServer: HttpServer;
  let gameServer: GameServer;
  let clientSockets: Socket[] = [];
  const PORT = 3002;
  const WAIT_TIME = 50;
  const TEST_TIMEOUT = 15000;

  beforeAll((done) => {
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    httpServer = createServer();
    gameServer = new GameServer(httpServer, PORT, { isTestMode: true });
    expect(gameServer.colorPool.length).toBe(18); // Verify initial pool size
    expect(gameServer.availableColors.length).toBe(18); // Verify available colors
    httpServer.listen(PORT, done);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    
    // Clean up all client sockets first
    await Promise.all(
      clientSockets.map(socket => 
        new Promise<void>(resolve => {
          if (socket.connected) {
            socket.disconnect();
          }
          socket.close();
          resolve();
        })
      )
    );

    // Then close servers
    return new Promise<void>(resolve => {
      gameServer.close();
      httpServer.close(() => {
        resolve();
      });
    });
  });

  beforeEach(() => {
    clientSockets = [];
    // Reset the game server's color state
    gameServer.availableColors = [...gameServer.colorPool];
    gameServer.lockedColors.clear();
    gameServer.usedRandomColors.clear();
    gameServer.players.clear();
    
    // Verify clean state
    expect(gameServer.availableColors.length).toBe(18);
    expect(gameServer.lockedColors.size).toBe(0);
    expect(gameServer.usedRandomColors.size).toBe(0);
    expect(gameServer.players.size).toBe(0);
  });

  afterEach(async () => {
    // Properly disconnect and clean up each socket
    await Promise.all(
      clientSockets.map(socket => 
        new Promise<void>(resolve => {
          if (socket.connected) {
            socket.disconnect();
            // Wait for disconnect event to complete
            socket.on('disconnect', () => {
              socket.close();
              resolve();
            });
            // Timeout after 1 second
            setTimeout(() => resolve(), 1000);
          } else {
            socket.close();
            resolve();
          }
        })
      )
    );

    // Wait for server to process all disconnections
    await new Promise<void>(resolve => setTimeout(resolve, WAIT_TIME * 2));

    clientSockets = [];

    // Reset server state
    gameServer.availableColors = [...gameServer.colorPool];
    gameServer.lockedColors.clear();
    gameServer.usedRandomColors.clear();
    gameServer.players.clear();

    // Verify cleanup
    expect(gameServer.lockedColors.size).toBe(0);
    expect(gameServer.players.size).toBe(0);
    expect(gameServer.availableColors.length).toBe(18);
  });

  const createClient = (): Socket => {
    const socket = Client(`http://localhost:${PORT}`, {
      forceNew: true,
      transports: ['websocket']
    });
    clientSockets.push(socket);
    return socket;
  };

  const getColorDistance = (c1: Color, c2: Color): number => {
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
    );
  };

  const connectAndJoin = (socket: Socket): Promise<Player> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        socket.emit('player_join', {});
      });

      socket.on('player_joined', (player: Player) => {
        clearTimeout(timeout);
        resolve(player);
      });

      socket.on('error', (error: Error) => {
        clearTimeout(timeout);
        reject(new Error(error.message || 'Failed to join game'));
      });

      socket.on('connect_error', (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });

      socket.on('disconnect', (reason: string) => {
        clearTimeout(timeout);
        reject(new Error(`Socket disconnected: ${reason}`));
      });
    });
  };

  const areColorsEqual = (c1: Color, c2: Color): boolean => {
    return Math.abs(c1.r - c2.r) < 0.01 &&
           Math.abs(c1.g - c2.g) < 0.01 &&
           Math.abs(c1.b - c2.b) < 0.01;
  };

  const isColorFromPool = (color: Color): boolean => {
    // More precise color matching with exact equality
    return gameServer.colorPool.some(poolColor => 
      Math.abs(color.r - poolColor.r) < 0.001 &&
      Math.abs(color.g - poolColor.g) < 0.001 &&
      Math.abs(color.b - poolColor.b) < 0.001
    );
  };

  test('assigns unique colors from predefined pool', async () => {
    const numClients = 5;
    const players: Player[] = [];
    const initialAvailableCount = gameServer.availableColors.length;
    
    // Connect clients sequentially with delay
    for (let i = 0; i < numClients; i++) {
      const socket = createClient();
      const player = await connectAndJoin(socket);
      players.push(player);

      // Verify state after each connection
      expect(gameServer.availableColors.length).toBe(initialAvailableCount - (i + 1));
      expect(gameServer.lockedColors.size).toBe(i + 1);
      expect(gameServer.lockedColors.has(socket.id)).toBe(true);
      expect(gameServer.players.size).toBe(i + 1);

      await new Promise<void>(resolve => setTimeout(resolve, WAIT_TIME));
    }

    // Verify all colors are from pool and unique
    const usedColors = new Set<string>();
    players.forEach(player => {
      expect(isColorFromPool(player.color)).toBe(true);
      expect(player.color).toBeDefined();
      expect(typeof player.color.r).toBe('number');
      expect(typeof player.color.g).toBe('number');
      expect(typeof player.color.b).toBe('number');
      
      const colorKey = `${player.color.r.toFixed(6)},${player.color.g.toFixed(6)},${player.color.b.toFixed(6)}`;
      expect(usedColors.has(colorKey)).toBe(false);
      usedColors.add(colorKey);
    });

    // Verify colors are sufficiently different
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const distance = getColorDistance(players[i].color, players[j].color);
        expect(distance).toBeGreaterThan(0.3);
      }
    }
  }, TEST_TIMEOUT);

  test('recycles colors when players disconnect', async () => {
    // Connect first client and get their color
    const socket1 = createClient();
    const player1 = await connectAndJoin(socket1);
    const firstColor = player1.color;

    // Verify initial state
    expect(isColorFromPool(firstColor)).toBe(true);
    expect(gameServer.lockedColors.size).toBe(1);
    expect(gameServer.lockedColors.has(socket1.id)).toBe(true);
    expect(gameServer.players.size).toBe(1);
    
    const initialAvailableCount = gameServer.availableColors.length;

    // Disconnect first client
    socket1.disconnect();
    await new Promise<void>(resolve => setTimeout(resolve, WAIT_TIME * 2));

    // Verify cleanup and color recycling
    expect(gameServer.availableColors.length).toBe(initialAvailableCount + 1);
    expect(gameServer.lockedColors.size).toBe(0);
    expect(gameServer.players.size).toBe(0);
    expect(gameServer.availableColors.some(color => areColorsEqual(color, firstColor))).toBe(true);

    // Connect second client
    const socket2 = createClient();
    const player2 = await connectAndJoin(socket2);
    
    // Verify second client state
    expect(isColorFromPool(player2.color)).toBe(true);
    expect(gameServer.lockedColors.size).toBe(1);
    expect(gameServer.lockedColors.has(socket2.id)).toBe(true);
    expect(gameServer.players.size).toBe(1);
  }, TEST_TIMEOUT);

  test('generates unique random colors when pool is exhausted', async () => {
    const numClients = 20;
    const players: Player[] = [];
    const connectPromises: Promise<Player>[] = [];
    
    // Connect clients in parallel to speed up test
    for (let i = 0; i < numClients; i++) {
      const socket = createClient();
      connectPromises.push(connectAndJoin(socket));
    }

    // Wait for all clients to connect
    const connectedPlayers = await Promise.all(connectPromises);
    players.push(...connectedPlayers);

    // Verify we have more players than colors in the pool
    expect(players.length).toBeGreaterThan(gameServer.colorPool.length);

    // Verify all colors are unique
    const usedColors = new Set<string>();
    players.forEach(player => {
      const colorKey = `${player.color.r.toFixed(6)},${player.color.g.toFixed(6)},${player.color.b.toFixed(6)}`;
      expect(usedColors.has(colorKey)).toBe(false);
      usedColors.add(colorKey);
    });

    // Verify colors are sufficiently different
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const distance = getColorDistance(players[i].color, players[j].color);
        expect(distance).toBeGreaterThan(0.3);
      }
    }
  }, TEST_TIMEOUT);

  test('handles rapid connect/disconnect cycles', async () => {
    const numCycles = 5;
    const colors = new Set<string>();

    for (let i = 0; i < numCycles; i++) {
      // Connect client
      const socket = createClient();
      const player = await connectAndJoin(socket);
      
      // Store color
      const colorKey = `${player.color.r.toFixed(6)},${player.color.g.toFixed(6)},${player.color.b.toFixed(6)}`;
      colors.add(colorKey);

      // Disconnect client
      socket.disconnect();
      await new Promise<void>(resolve => setTimeout(resolve, WAIT_TIME * 2));
    }

    // Verify all colors were unique
    expect(colors.size).toBe(numCycles);
  }, TEST_TIMEOUT);

  test('maintains color uniqueness during concurrent connections', async () => {
    const numClients = 10;
    const connectPromises: Promise<Player>[] = [];

    // Connect all clients simultaneously
    for (let i = 0; i < numClients; i++) {
      const socket = createClient();
      connectPromises.push(connectAndJoin(socket));
    }

    // Wait for all connections
    const players = await Promise.all(connectPromises);

    // Verify all colors are unique
    const usedColors = new Set<string>();
    players.forEach(player => {
      const colorKey = `${player.color.r.toFixed(6)},${player.color.g.toFixed(6)},${player.color.b.toFixed(6)}`;
      expect(usedColors.has(colorKey)).toBe(false);
      usedColors.add(colorKey);
    });

    // Verify colors are sufficiently different
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const distance = getColorDistance(players[i].color, players[j].color);
        expect(distance).toBeGreaterThan(0.3);
      }
    }
  }, TEST_TIMEOUT);
}); 