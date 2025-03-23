import { GameServer } from './game-server';
import { createServer, Server as HttpServer } from 'http';
import { io as Client, Socket } from 'socket.io-client';
import type { Color } from '../src/types';
import { GameEvent } from '../src/constants';

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

describe('Color Management', () => {
  let httpServer: HttpServer;
  let gameServer: TestGameServer;
  let clientSockets: Socket[] = [];
  const PORT = 3002;
  const WAIT_TIME = 100;
  const TEST_TIMEOUT = 30000;
  const CLEANUP_TIMEOUT = 10000;

  beforeAll((done) => {
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    httpServer = createServer();
    gameServer = new TestGameServer(httpServer, PORT, { isTestMode: true });
    expect(gameServer.getColorPool().length).toBe(18); // Verify initial pool size
    expect(gameServer.getAvailableColors().length).toBe(18); // Verify available colors
    
    // Start server and wait for it to be ready
    httpServer.listen(PORT, () => {
      // Give server a moment to fully initialize
      setTimeout(done, 100);
    });

    // Add error handler for the server
    httpServer.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // If port is in use, try to close any existing connections
        httpServer.close(() => {
          // Try to listen again after a short delay
          setTimeout(() => {
            httpServer.listen(PORT, () => {
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
    
    // Clean up all client sockets first
    await Promise.all(
      clientSockets.map(socket => 
        new Promise<void>((resolve) => {
          if (socket.connected) {
            socket.disconnect();
          }
          socket.close();
          resolve();
        })
      )
    );

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
      if (httpServer) {
        try {
          httpServer.close(() => {
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
    clientSockets = [];
    gameServer = null as unknown as TestGameServer;
    httpServer = null as unknown as HttpServer;
  }, TEST_TIMEOUT);

  beforeEach(async () => {
    clientSockets = [];
    // Reset the game server's color state
    gameServer.setAvailableColors([...gameServer.getColorPool()]);
    gameServer.clearLockedColors();
    gameServer.clearUsedRandomColors();
    gameServer.clearPlayers();
    
    // Verify clean state
    expect(gameServer.getAvailableColors().length).toBe(18);
    expect(gameServer.getLockedColors().size).toBe(0);
    expect(gameServer.getUsedRandomColors().size).toBe(0);
    expect(gameServer.getPlayers().size).toBe(0);

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
  }, TEST_TIMEOUT);

  afterEach(async () => {
    // Disconnect all sockets immediately
    clientSockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
      socket.close();
    });

    // Wait for server to process disconnections
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));

    clientSockets = [];

    // Reset server state
    gameServer.setAvailableColors([...gameServer.getColorPool()]);
    gameServer.clearLockedColors();
    gameServer.clearUsedRandomColors();
    gameServer.clearPlayers();

    // Verify cleanup
    expect(gameServer.getLockedColors().size).toBe(0);
    expect(gameServer.getPlayers().size).toBe(0);
    expect(gameServer.getAvailableColors().length).toBe(18);
  }, TEST_TIMEOUT);

  const createClient = (): Socket => {
    const socket = Client(`http://localhost:${PORT}`, {
      forceNew: true,
      transports: ['websocket']
    });
    clientSockets.push(socket);
    return socket;
  };

  const areColorsEqual = (c1: Color, c2: Color): boolean => {
    return Math.abs(c1.r - c2.r) < 0.1 &&
           Math.abs(c1.g - c2.g) < 0.1 &&
           Math.abs(c1.b - c2.b) < 0.1;
  };

  const getColorKey = (color: Color): string => {
    return `${color.r.toFixed(6)},${color.g.toFixed(6)},${color.b.toFixed(6)}`;
  };

  const isColorFromPool = (color: Color): boolean => {
    // More precise color matching with exact equality
    return gameServer.getColorPool().some(poolColor => 
      Math.abs(color.r - poolColor.r) < 0.001 &&
      Math.abs(color.g - poolColor.g) < 0.001 &&
      Math.abs(color.b - poolColor.b) < 0.001
    );
  };

  const connectAndJoin = (socket: Socket): Promise<Player> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (socket.connected) {
          socket.disconnect();
        }
        socket.close();
        reject(new Error('Connection timeout'));
      }, 10000);

      let joined = false;

      socket.on('connect', () => {
        // Add a small delay after connect to ensure socket is ready
        setTimeout(() => {
          if (!joined) {
            socket.emit(GameEvent.PLAYER_JOIN, { position: { x: 0, y: 0, z: 0 } });
          }
        }, 100);
      });

      socket.on(GameEvent.PLAYER_JOINED, (player: Player) => {
        joined = true;
        clearTimeout(timeout);
        resolve(player);
      });

      socket.on('error', (error: Error) => {
        clearTimeout(timeout);
        if (socket.connected) {
          socket.disconnect();
        }
        socket.close();
        reject(error);
      });

      socket.on('connect_error', (error: Error) => {
        clearTimeout(timeout);
        if (socket.connected) {
          socket.disconnect();
        }
        socket.close();
        reject(error);
      });

      socket.on('disconnect', (reason: string) => {
        if (!joined) {
          clearTimeout(timeout);
          socket.close();
          reject(new Error(`Socket disconnected before joining: ${reason}`));
        }
      });

      // Connect to the server
      socket.connect();
    });
  };

  test('assigns unique colors from predefined pool', async () => {
    const numClients = 5;
    const players: Player[] = [];
    const initialAvailableCount = gameServer.getAvailableColors().length;
    
    // Connect clients sequentially with delay
    for (let i = 0; i < numClients; i++) {
      const socket = createClient();
      const player = await connectAndJoin(socket);
      players.push(player);

      // Verify state after each connection
      expect(gameServer.getAvailableColors().length).toBe(initialAvailableCount - (i + 1));
      expect(gameServer.getLockedColors().size).toBe(i + 1);
      expect(gameServer.getLockedColors().has(socket.id!)).toBe(true);
      expect(gameServer.getPlayers().size).toBe(i + 1);

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

    // Verify colors are sufficiently different using the shared method
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const distance = gameServer.getColorDistance(players[i].color, players[j].color);
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
    expect(gameServer.getLockedColors().size).toBe(1);
    expect(gameServer.getLockedColors().has(socket1.id!)).toBe(true);
    expect(gameServer.getPlayers().size).toBe(1);
    
    const initialAvailableCount = gameServer.getAvailableColors().length;

    // Disconnect first client
    socket1.disconnect();
    await new Promise<void>(resolve => setTimeout(resolve, WAIT_TIME * 2));

    // Verify cleanup and color recycling
    expect(gameServer.getAvailableColors().length).toBe(initialAvailableCount + 1);
    expect(gameServer.getLockedColors().size).toBe(0);
    expect(gameServer.getPlayers().size).toBe(0);
    expect(gameServer.getAvailableColors().some(color => areColorsEqual(color, firstColor))).toBe(true);

    // Connect second client
    const socket2 = createClient();
    const player2 = await connectAndJoin(socket2);
    
    // Verify second client state
    expect(isColorFromPool(player2.color)).toBe(true);
    expect(gameServer.getLockedColors().size).toBe(1);
    expect(gameServer.getLockedColors().has(socket2.id!)).toBe(true);
    expect(gameServer.getPlayers().size).toBe(1);
  }, TEST_TIMEOUT);

  test('generates unique random colors when pool is exhausted', async () => {
    const numClients = 20;
    const players: Player[] = [];
    const connectPromises: Promise<Player>[] = [];
    
    // Connect clients in smaller batches to avoid overwhelming the server
    for (let i = 0; i < numClients; i += 5) {
      const batchSize = Math.min(5, numClients - i);
      const batchPromises: Promise<Player>[] = [];
      
      for (let j = 0; j < batchSize; j++) {
        const socket = createClient();
        batchPromises.push(connectAndJoin(socket));
      }

      // Wait for batch to complete before starting next batch
      const batchPlayers = await Promise.all(batchPromises);
      players.push(...batchPlayers);
      
      // Add delay between batches
      await new Promise<void>(resolve => setTimeout(resolve, WAIT_TIME * 2));
    }

    // Verify we have more players than colors in the pool
    expect(players.length).toBeGreaterThan(gameServer.getColorPool().length);

    // Verify all colors are unique
    const usedColors = new Set<string>();
    players.forEach(player => {
      const colorKey = getColorKey(player.color);
      expect(usedColors.has(colorKey)).toBe(false);
      usedColors.add(colorKey);
    });

    // Verify colors are sufficiently different using the shared method
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const distance = gameServer.getColorDistance(players[i].color, players[j].color);
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
    const players: Player[] = [];

    // Connect clients in smaller batches
    for (let i = 0; i < numClients; i += 3) {
      const batchSize = Math.min(3, numClients - i);
      const batchPromises: Promise<Player>[] = [];
      
      for (let j = 0; j < batchSize; j++) {
        const socket = createClient();
        batchPromises.push(connectAndJoin(socket));
      }

      // Wait for batch to complete before starting next batch
      const batchPlayers = await Promise.all(batchPromises);
      players.push(...batchPlayers);
      
      // Add delay between batches
      await new Promise<void>(resolve => setTimeout(resolve, WAIT_TIME * 2));
    }

    // Verify all colors are unique
    const usedColors = new Set<string>();
    players.forEach(player => {
      const colorKey = getColorKey(player.color);
      expect(usedColors.has(colorKey)).toBe(false);
      usedColors.add(colorKey);
    });

    // Verify colors are sufficiently different using the shared method
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const distance = gameServer.getColorDistance(players[i].color, players[j].color);
        expect(distance).toBeGreaterThan(0.3);
      }
    }
  }, TEST_TIMEOUT);
}); 