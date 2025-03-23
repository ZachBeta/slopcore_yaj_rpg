import { GameServer } from './game-server';
import { Player, Color } from '../src/types';
import { GameEvent } from '../src/constants';
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

describe('Socket.IO Server Integration Tests', () => {
  let testEnv: Awaited<ReturnType<typeof createSocketTestEnvironment<TestGameServer>>>;
  let gameServer: TestGameServer;
  const TEST_TIMEOUT = 30000;

  beforeAll(async () => {
    // Keep console logs but add timestamp
    const originalConsoleLog = console.log;
    jest.spyOn(console, 'log').mockImplementation((...args) => {
      originalConsoleLog(`[${new Date().toISOString()}]`, ...args);
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
    console.log('Setting up test');
    
    // Reset game server state
    gameServer.clearPlayers();
    gameServer.clearLockedColors();
    gameServer.clearUsedRandomColors();
    
    // Reset available colors to full pool
    gameServer.setAvailableColors([...gameServer.getColorPool()]);
  });

  test('handles player joining', async () => {
    console.log('Starting player joining test');
    
    // Create a client
    const client = testEnv.createClient();
    
    try {
      // Connect and join
      const { player } = await testEnv.connectAndJoin(client);
      
      // Verify player joined correctly
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
    } finally {
      // Clean up
      if (client.connected) {
        client.disconnect();
      }
    }
  }, TEST_TIMEOUT);

  test('handles player movement', async () => {
    console.log('Starting player movement test');
    
    // Create a client
    const client = testEnv.createClient();
    
    try {
      // Connect and join
      const { player } = await testEnv.connectAndJoin(client);
      
      // Set up a promise to wait for player moved event
      const movedPromise = new Promise<{
        id: string;
        position: { x: number; y: number; z: number };
        rotation: { x: number; y: number; z: number };
      }>((resolve) => {
        // Create a second client to receive the movement
        const client2 = testEnv.createClient();
        
        client2.on('connect', () => {
          // Once connected, listen for player_moved events
          client2.on(GameEvent.PLAYER_MOVED, (data) => {
            // Clean up
            client2.disconnect();
            resolve(data);
          });
          
          // Send player_join to get notifications
          client2.emit(GameEvent.PLAYER_JOIN, {
            position: { x: 0, y: 1, z: 0 }
          });
        });
        
        client2.connect();
      });
      
      // Now update position
      client.emit(GameEvent.POSITION_UPDATE, {
        position: { x: 1, y: 0, z: 1 },
        rotation: { x: 0, y: 0, z: 0 }
      });
      
      // Wait for the moved event
      const moveData = await movedPromise;
      
      // Verify the movement data
      expect(moveData.id).toBeDefined();
      expect(moveData.position).toBeDefined();
      expect(moveData.position.x).toBe(1);
      expect(moveData.position.y).toBe(0);
      expect(moveData.position.z).toBe(1);
      
      // Verify server state
      const serverPlayer = gameServer.getPlayers().get(player.id);
      expect(serverPlayer).toBeDefined();
      expect(serverPlayer?.position.x).toBe(1);
      expect(serverPlayer?.position.y).toBe(0);
      expect(serverPlayer?.position.z).toBe(1);
    } finally {
      // Clean up
      if (client.connected) {
        client.disconnect();
      }
    }
  }, TEST_TIMEOUT);

  test('handles multiple players', async () => {
    console.log('Starting multiple players test');
    
    const client1 = testEnv.createClient();
    const client2 = testEnv.createClient();
    
    try {
      // Connect first client
      const { player: player1 } = await testEnv.connectAndJoin(client1);
      
      // Set up a promise to detect new player joining
      const playerJoinedPromise = new Promise<Player>((resolve) => {
        client1.on(GameEvent.PLAYER_JOINED, (player) => {
          resolve(player);
        });
      });
      
      // Connect second client
      const { player: player2 } = await testEnv.connectAndJoin(client2);
      
      // Wait for the first client to receive notification about second player
      const joinedPlayer = await playerJoinedPromise;
      
      // Verify second player joined
      expect(joinedPlayer.id).toBe(player2.id);
      
      // Verify server state
      const players = gameServer.getPlayers();
      expect(players.size).toBe(2);
      expect(players.has(player1.id)).toBe(true);
      expect(players.has(player2.id)).toBe(true);
    } finally {
      // Clean up
      if (client1.connected) {
        client1.disconnect();
      }
      if (client2.connected) {
        client2.disconnect();
      }
    }
  }, TEST_TIMEOUT);
}); 