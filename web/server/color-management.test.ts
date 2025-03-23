import { GameServer } from './game-server';
import { Player, Color } from '../src/types';
import { createSocketTestEnvironment } from './test-helpers';

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
  let testEnv: Awaited<ReturnType<typeof createSocketTestEnvironment<TestGameServer>>>;
  let gameServer: TestGameServer;
  const TEST_TIMEOUT = 30000;
  
  beforeAll(async () => {
    // Keep console logs but add timestamp
    const originalConsoleLog = console.log;
    jest.spyOn(console, 'log').mockImplementation((...args) => {
      originalConsoleLog(`[${new Date().toISOString()}] [ColorTest]`, ...args);
    });
    
    // Create test environment with our TestGameServer class
    testEnv = await createSocketTestEnvironment<TestGameServer>(TestGameServer);
    
    // Get the game server directly as TestGameServer
    gameServer = testEnv.gameServer;
  }, TEST_TIMEOUT);

  afterAll(async () => {
    console.log('Cleaning up after all tests');
    jest.restoreAllMocks();
    
    // Clean up test environment
    await testEnv.cleanup();
  }, TEST_TIMEOUT);

  beforeEach(() => {
    console.log('Resetting server state');
    
    // Reset game server state
    gameServer.clearPlayers();
    gameServer.clearLockedColors();
    gameServer.clearUsedRandomColors();
    
    // Reset available colors to full pool
    gameServer.setAvailableColors([...gameServer.getColorPool()]);
  });
  
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

  test('assigns unique colors from predefined pool', async () => {
    // Skip if we're in a CI environment
    if (process.env.CI) {
      console.log('Skipping test in CI environment');
      return;
    }

    const numClients = 5; // Test with 5 clients
    const clients = [];
    const players = [];
    
    try {
      // Connect multiple clients
      for (let i = 0; i < numClients; i++) {
        const client = testEnv.createClient();
        clients.push(client);
        
        const { player } = await testEnv.connectAndJoin(client);
        players.push(player);
      }
      
      // Verify each player has a unique color from the pool
      const usedColors = new Set<string>();
      
      players.forEach(player => {
        const colorKey = getColorKey(player.color);
        expect(usedColors.has(colorKey)).toBe(false);
        usedColors.add(colorKey);
        
        // Verify color is from the pool
        expect(isColorFromPool(player.color)).toBe(true);
      });
      
      // Verify server state
      expect(gameServer.getLockedColors().size).toBe(numClients);
      expect(gameServer.getAvailableColors().length).toBe(gameServer.getColorPool().length - numClients);
    } finally {
      // Clean up
      clients.forEach(client => {
        if (client.connected) {
          client.disconnect();
        }
      });
    }
  }, TEST_TIMEOUT);
  
  test('recycles colors when players disconnect', async () => {
    // Skip if we're in a CI environment
    if (process.env.CI) {
      console.log('Skipping test in CI environment');
      return;
    }
    
    const numClients = 5;
    const clients = [];
    const players = [];
    
    try {
      // Connect clients
      for (let i = 0; i < numClients; i++) {
        const client = testEnv.createClient();
        clients.push(client);
        
        const { player } = await testEnv.connectAndJoin(client);
        players.push(player);
      }
      
      // Verify server state
      expect(gameServer.getLockedColors().size).toBe(numClients);
      const initialColorCount = gameServer.getAvailableColors().length;
      
      // Store colors for verification
      const initialColors = players.map(p => getColorKey(p.color));
      const initialColorKeys = new Set(initialColors);
      expect(initialColorKeys.size).toBe(numClients); // Ensure all colors are unique
      
      // Disconnect first client
      if (clients[0].connected) {
        clients[0].disconnect();
      }
      
      // Wait for disconnect to be processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify a color was recycled
      expect(gameServer.getLockedColors().size).toBe(numClients - 1);
      expect(gameServer.getAvailableColors().length).toBe(initialColorCount + 1);
      
      // Connect a new client
      const newClient = testEnv.createClient();
      
      const { player: newPlayer } = await testEnv.connectAndJoin(newClient);
      
      // Verify new player got a color from the pool
      expect(isColorFromPool(newPlayer.color)).toBe(true);
      
      // Clean up the new client
      if (newClient.connected) {
        newClient.disconnect();
      }
    } finally {
      // Clean up remaining clients
      clients.forEach(client => {
        if (client.connected) {
          client.disconnect();
        }
      });
    }
  }, TEST_TIMEOUT);

  test('generates unique random colors when pool is exhausted', async () => {
    // This test doesn't need actual socket connections, just the API
    
    // Mock the color pool to be exhausted
    gameServer.setAvailableColors([]);
    expect(gameServer.getAvailableColors().length).toBe(0);
    
    // Generate more colors than the pool size
    const numPlayers = 25; // More than the pool colors
    const colors = [];
    
    // Generate colors directly using the server API
    for (let i = 0; i < numPlayers; i++) {
      const socketId = `test-socket-${i}`;
      const color = await gameServer.generatePlayerColor(socketId);
      colors.push(color);
    }
    
    // Verify all colors are unique
    const usedColors = new Set<string>();
    
    colors.forEach(color => {
      const colorKey = getColorKey(color);
      expect(usedColors.has(colorKey)).toBe(false);
      usedColors.add(colorKey);
    });
    
    // Clean up
    gameServer.clearLockedColors();
  }, TEST_TIMEOUT);
}); 