const { GameServer } = require('./game-server');
const { createServer } = require('http');
const { io: Client } = require('socket.io-client');

describe('Color Management', () => {
  let httpServer;
  let gameServer;
  let clientSockets = [];
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
        new Promise(resolve => {
          if (socket.connected) {
            socket.disconnect();
          }
          socket.close();
          resolve();
        })
      )
    );

    // Then close servers
    return new Promise(resolve => {
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
        new Promise(resolve => {
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
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME * 2));

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

  const createClient = () => {
    const socket = Client(`http://localhost:${PORT}`, {
      forceNew: true,
      transports: ['websocket']
    });
    clientSockets.push(socket);
    return socket;
  };

  const getColorDistance = (c1, c2) => {
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
    );
  };

  const connectAndJoin = (socket) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        socket.emit('player_join', {});
      });

      socket.on('player_joined', (player) => {
        clearTimeout(timeout);
        resolve(player);
      });

      socket.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(error.message || 'Failed to join game'));
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      socket.on('disconnect', (reason) => {
        clearTimeout(timeout);
        reject(new Error(`Socket disconnected: ${reason}`));
      });
    });
  };

  const areColorsEqual = (c1, c2) => {
    return Math.abs(c1.r - c2.r) < 0.01 &&
           Math.abs(c1.g - c2.g) < 0.01 &&
           Math.abs(c1.b - c2.b) < 0.01;
  };

  const isColorFromPool = (color) => {
    // More precise color matching with exact equality
    return gameServer.colorPool.some(poolColor => 
      Math.abs(color.r - poolColor.r) < 0.001 &&
      Math.abs(color.g - poolColor.g) < 0.001 &&
      Math.abs(color.b - poolColor.b) < 0.001
    );
  };

  test('assigns unique colors from predefined pool', async () => {
    const numClients = 5;
    const players = [];
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

      await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
    }

    // Verify all colors are from pool and unique
    const usedColors = new Set();
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
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME * 2));

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
    const players = [];
    const connectPromises = [];
    
    // Connect clients in parallel to speed up test
    for (let i = 0; i < numClients; i++) {
      const socket = createClient();
      connectPromises.push(connectAndJoin(socket));
    }

    // Wait for all connections
    players.push(...await Promise.all(connectPromises));

    // Wait for server to process all connections
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));

    // Verify server state
    expect(gameServer.availableColors.length).toBe(0);
    expect(gameServer.lockedColors.size).toBe(numClients);
    expect(gameServer.players.size).toBe(numClients);

    // Track which pool colors were used
    const usedPoolColors = new Set();
    const randomColors = [];
    const usedMaxComponents = new Set();

    players.forEach(player => {
      // Verify color validity
      expect(player.color).toBeDefined();
      expect(typeof player.color.r).toBe('number');
      expect(typeof player.color.g).toBe('number');
      expect(typeof player.color.b).toBe('number');
      expect(player.color.r).toBeGreaterThanOrEqual(0);
      expect(player.color.g).toBeGreaterThanOrEqual(0);
      expect(player.color.b).toBeGreaterThanOrEqual(0);
      expect(player.color.r).toBeLessThanOrEqual(1);
      expect(player.color.g).toBeLessThanOrEqual(1);
      expect(player.color.b).toBeLessThanOrEqual(1);

      let isPoolColor = false;
      for (let i = 0; i < gameServer.colorPool.length; i++) {
        if (Math.abs(player.color.r - gameServer.colorPool[i].r) < 0.001 &&
            Math.abs(player.color.g - gameServer.colorPool[i].g) < 0.001 &&
            Math.abs(player.color.b - gameServer.colorPool[i].b) < 0.001) {
          usedPoolColors.add(i);
          isPoolColor = true;
          break;
        }
      }
      if (!isPoolColor) {
        randomColors.push(player.color);
        // Track max component for random colors
        const maxComponent = Math.max(player.color.r, player.color.g, player.color.b);
        expect(maxComponent).toBeGreaterThanOrEqual(0.8); // Ensure vibrancy
        usedMaxComponents.add(maxComponent.toFixed(3));
      }
    });

    // Verify pool usage
    expect(usedPoolColors.size).toBe(gameServer.colorPool.length);
    expect(randomColors.length).toBe(numClients - gameServer.colorPool.length);
    expect(usedMaxComponents.size).toBe(randomColors.length); // Each random color should have a unique max component

    // Verify all colors are unique and sufficiently different
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const distance = getColorDistance(players[i].color, players[j].color);
        expect(distance).toBeGreaterThan(0.3);
      }
    }

    // Verify random colors are tracked
    expect(gameServer.usedRandomColors.size).toBe(randomColors.length);
  }, TEST_TIMEOUT);

  test('handles rapid connections gracefully', async () => {
    const numClients = 5;
    const connectPromises = [];
    const initialAvailableCount = gameServer.availableColors.length;
    
    // Connect multiple clients simultaneously
    for (let i = 0; i < numClients; i++) {
      const socket = createClient();
      connectPromises.push(connectAndJoin(socket));
    }

    // Wait for all connections
    const players = await Promise.all(connectPromises);

    // Wait for server to process all connections
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));

    // Verify server state
    expect(gameServer.availableColors.length).toBe(initialAvailableCount - numClients);
    expect(gameServer.lockedColors.size).toBe(numClients);
    expect(gameServer.players.size).toBe(numClients);

    // Track used colors with high precision
    const usedColors = new Set();
    const usedMaxComponents = new Set();
    players.forEach(player => {
      // Verify color validity
      expect(player.color).toBeDefined();
      expect(typeof player.color.r).toBe('number');
      expect(typeof player.color.g).toBe('number');
      expect(typeof player.color.b).toBe('number');
      expect(player.color.r).toBeGreaterThanOrEqual(0);
      expect(player.color.g).toBeGreaterThanOrEqual(0);
      expect(player.color.b).toBeLessThanOrEqual(1);
      expect(player.color.g).toBeLessThanOrEqual(1);
      expect(player.color.b).toBeLessThanOrEqual(1);

      expect(isColorFromPool(player.color)).toBe(true);
      
      // Verify color uniqueness
      const colorKey = `${player.color.r.toFixed(6)},${player.color.g.toFixed(6)},${player.color.b.toFixed(6)}`;
      expect(usedColors.has(colorKey)).toBe(false);
      usedColors.add(colorKey);

      // Track max component
      const maxComponent = Math.max(player.color.r, player.color.g, player.color.b);
      usedMaxComponents.add(maxComponent.toFixed(3));
    });

    // Verify all colors have different max components
    expect(usedMaxComponents.size).toBe(numClients);

    // Verify colors are sufficiently different
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const distance = getColorDistance(players[i].color, players[j].color);
        expect(distance).toBeGreaterThan(0.3);
      }
    }
  }, TEST_TIMEOUT);

  test('maintains color locks during player lifetime', async () => {
    // Connect first client
    const socket1 = createClient();
    const player1 = await connectAndJoin(socket1);
    const firstColor = player1.color;

    // Verify initial state
    expect(isColorFromPool(firstColor)).toBe(true);
    expect(gameServer.lockedColors.size).toBe(1);
    expect(gameServer.lockedColors.has(socket1.id)).toBe(true);
    expect(areColorsEqual(gameServer.lockedColors.get(socket1.id), firstColor)).toBe(true);
    expect(gameServer.players.size).toBe(1);

    // Connect second client
    const socket2 = createClient();
    const player2 = await connectAndJoin(socket2);

    // Verify second client state
    expect(isColorFromPool(player2.color)).toBe(true);
    expect(gameServer.lockedColors.size).toBe(2);
    expect(gameServer.lockedColors.has(socket2.id)).toBe(true);
    expect(areColorsEqual(player2.color, firstColor)).toBe(false);
    expect(gameServer.players.size).toBe(2);

    // Verify colors are different
    const distance = getColorDistance(player1.color, player2.color);
    expect(distance).toBeGreaterThan(0.3);

    // Disconnect first client
    socket1.disconnect();
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME * 2));

    // Verify cleanup
    expect(gameServer.lockedColors.size).toBe(1);
    expect(gameServer.lockedColors.has(socket1.id)).toBe(false);
    expect(gameServer.players.size).toBe(1);

    // Connect third client
    const socket3 = createClient();
    const player3 = await connectAndJoin(socket3);

    // Verify third client state
    expect(isColorFromPool(player3.color)).toBe(true);
    expect(gameServer.lockedColors.size).toBe(2);
    expect(gameServer.lockedColors.has(socket3.id)).toBe(true);
    expect(gameServer.players.size).toBe(2);

    // Verify all colors are different
    expect(getColorDistance(player2.color, player3.color)).toBeGreaterThan(0.3);
    if (areColorsEqual(player3.color, firstColor)) {
      expect(gameServer.availableColors.some(color => areColorsEqual(color, firstColor))).toBe(false);
    }
  }, TEST_TIMEOUT);
}); 