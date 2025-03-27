import { GameServer } from './game-server';
import { Player, Color } from '../src/types';
import { GameEvent } from '../src/constants';
import { createSocketTestEnvironment, setupTestServer, connectAndJoinGame, setupTestConsole, wait, SOCKET_EVENTS, disconnectAll } from './test-helpers';
import type { Socket } from 'socket.io-client';
import type { TestServerSetup } from './test-helpers';
import type { ConsoleSilencer } from '../src/test/test-utils';

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

// Interface for player data received from server
interface PlayerData {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  color: { r: number; g: number; b: number };
}

// Define position type for tests
interface Position {
  x: number;
  y: number;
  z: number;
}

describe('Game Server Integration Tests', () => {
  let testSetup: TestServerSetup;
  let consoleControl: ConsoleSilencer;
  
  beforeAll(async () => {
    // Silence console output
    consoleControl = setupTestConsole();
    
    // Setup test server
    testSetup = await setupTestServer();
  });
  
  afterEach(async () => {
    // Ensure all socket clients are disconnected after each test
    await disconnectAll();
  });
  
  afterAll(async () => {
    consoleControl.restore();
    
    // Clean up test server
    await testSetup.cleanup();
  }, 5000);
  
  // Skip these tests in CI environment or when socket testing is disabled
  const shouldSkipTest = (): boolean => {
    return process.env.CI === 'true' || process.env.SKIP_SOCKET_TESTS === 'true';
  };
  
  it('should allow players to join', async () => {
    // Skip in CI environment
    if (shouldSkipTest()) {
      return;
    }
    
    let socketClient: Socket | null = null;
    
    try {
      // Connect client and join game
      const result = await connectAndJoinGame(testSetup.clientUrl, 'TestPlayer');
      socketClient = result.client;
      
      // Verify player data received
      expect(result.player).toBeDefined();
      expect(result.player.id).toBeDefined();
      expect(result.player.color).toBeDefined();
      expect(result.player.position).toBeDefined();
      
      // Cleanup
      socketClient.disconnect();
    } catch (err) {
      // Even if the test fails, make sure we clean up
      if (socketClient) socketClient.disconnect();
      throw err;
    }
  });
  
  it('should handle player movement events', async () => {
    // Skip in CI environment
    if (shouldSkipTest()) {
      return;
    }
    
    let socketClient: Socket | null = null;
    
    try {
      // Connect client and join game
      const result = await connectAndJoinGame(testSetup.clientUrl, 'TestPlayer');
      socketClient = result.client;
      
      // New position to send
      const newPosition: Position = { x: 10, y: 1, z: 10 };
      const newRotation = { x: 0, y: 1, z: 0 };
      
      // Track movement updates received
      let movementUpdated = false;
      
      // Listen for movement updates from server
      socketClient.once('player_moved', (data) => {
        movementUpdated = true;
        expect(data.position).toEqual(newPosition);
        expect(data.rotation).toEqual(newRotation);
      });
      
      // Send position update
      socketClient.emit('position_update', {
        position: newPosition,
        rotation: newRotation
      });
      
      // Wait for server to process movement
      await wait(50);
      
      // Verify movement update received
      expect(movementUpdated).toBe(true);
      
      // Cleanup
      socketClient.disconnect();
    } catch (err) {
      // Even if the test fails, make sure we clean up
      if (socketClient) socketClient.disconnect();
      throw err;
    }
  });
  
  it('should handle multiple players', async () => {
    // Skip in CI environment
    if (shouldSkipTest()) {
      return;
    }
    
    let socketClient1: Socket | null = null;
    let socketClient2: Socket | null = null;
    
    try {
      // Connect first client
      const result1 = await connectAndJoinGame(testSetup.clientUrl, 'Player1');
      socketClient1 = result1.client;
      
      // First player ID
      const player1Id = result1.player.id;
      
      // Setup second client to receive player_joined events
      let player2JoinedReceived = false;
      
      socketClient1.once('player_joined', (playerData) => {
        player2JoinedReceived = true;
        expect(playerData.id).not.toBe(player1Id);
      });
      
      // Connect second client
      const result2 = await connectAndJoinGame(testSetup.clientUrl, 'Player2');
      socketClient2 = result2.client;
      
      // Wait for events to propagate
      await wait(50);
      
      // Verify events received
      expect(player2JoinedReceived).toBe(true);
      
      // Cleanup
      if (socketClient1) socketClient1.disconnect();
      if (socketClient2) socketClient2.disconnect();
    } catch (err) {
      // Even if the test fails, make sure we clean up
      if (socketClient1) socketClient1.disconnect();
      if (socketClient2) socketClient2.disconnect();
      throw err;
    }
  });
}); 