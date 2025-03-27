import { GameServer } from './game-server';
import { Player, Color } from '../src/types';
import { GameEvent } from '../src/constants';
import { createSocketTestEnvironment, setupTestServer, connectAndJoinGame, setupTestConsole, wait } from './test-helpers';
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

describe('Game Server Integration Tests', () => {
  let testSetup: TestServerSetup;
  let consoleControl: ConsoleSilencer;
  
  beforeAll(async () => {
    // Silence console output
    consoleControl = setupTestConsole();
    
    // Setup test server
    testSetup = await setupTestServer();
  });
  
  afterAll(async () => {
    consoleControl.restore();
    
    // Clean up test server
    await testSetup.cleanup();
  });
  
  // Skip these tests in CI environment or when socket testing is disabled
  const shouldSkipTest = (): boolean => {
    return process.env.CI === 'true' || process.env.SKIP_SOCKET_TESTS === 'true';
  };
  
  // Increase test timeout for socket operations
  jest.setTimeout(15000);
  
  it('should allow players to join', async () => {
    // Skip in CI environment
    if (shouldSkipTest()) {
      return;
    }
    
    let client: Socket | null = null;
    
    try {
      // Use skipCheck to avoid waiting for player_joined event
      client = await connectAndJoinGame(testSetup.clientUrl, 'TestPlayer', true);
      expect(client.connected).toBe(true);
      
      // Disconnect client when done
      client.disconnect();
      await wait(100);
    } catch (err) {
      // Even if the test fails, make sure we clean up
      if (client) client.disconnect();
      throw err;
    }
  });
  
  it('should handle player movement events', async () => {
    // Skip in CI environment
    if (shouldSkipTest()) {
      return;
    }
    
    let client: Socket | null = null;
    
    try {
      // Connect client with skipCheck
      client = await connectAndJoinGame(testSetup.clientUrl, 'TestPlayer', true);
      expect(client.connected).toBe(true);
      
      // Emit a movement event (without waiting for response)
      client.emit('player_move', {
        position: { x: 1, y: 0, z: 1 },
        rotation: { x: 0, y: 0, z: 0 }
      });
      
      // Wait briefly to allow event to be processed
      await wait(100);
      
      // Disconnect client when done
      client.disconnect();
      await wait(100);
    } catch (err) {
      // Even if the test fails, make sure we clean up
      if (client) client.disconnect();
      throw err;
    }
  });
  
  it('should handle multiple players', async () => {
    // Skip in CI environment
    if (shouldSkipTest()) {
      return;
    }
    
    let client1: Socket | null = null;
    let client2: Socket | null = null;
    
    try {
      // Connect first client
      client1 = await connectAndJoinGame(testSetup.clientUrl, 'Player1', true);
      expect(client1.connected).toBe(true);
      
      // Connect second client
      client2 = await connectAndJoinGame(testSetup.clientUrl, 'Player2', true);
      expect(client2.connected).toBe(true);
      
      // Wait briefly to allow connections to be processed
      await wait(100);
      
      // Clean up
      if (client1) client1.disconnect();
      if (client2) client2.disconnect();
      await wait(100);
    } catch (err) {
      // Even if the test fails, make sure we clean up
      if (client1) client1.disconnect();
      if (client2) client2.disconnect();
      throw err;
    }
  });
}); 