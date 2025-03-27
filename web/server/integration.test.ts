import { GameServer as _GameServer } from './game-server';
import { Player as _Player, Color, Position, Rotation } from '../src/types';
import { GameEvent } from '../src/constants';
import { setupTestServer, connectAndJoinGame, setupTestConsole, wait, SOCKET_EVENTS, disconnectAll, CONNECTION_TIMEOUT } from './test-helpers';
import type { Socket } from 'socket.io-client';
import type { TestServerSetup } from './test-helpers';
import type { ConsoleSilencer } from '../src/test/test-utils';
import { io as ioc } from 'socket.io-client';
import process from 'node:process';

// NOTE: TestGameServer is kept for future tests that need to access protected properties
// but is currently unused - uncomment and use when needed
/*
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
*/

// Define player data interface for tests
interface PlayerData {
  id: string;
  position: Position;
  rotation: Rotation;
  color: Color;
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
      
      // Verify GameEvent constant matches actual socket event name
      expect(GameEvent.PLAYER_MOVED).toBe('player_moved');
      expect(GameEvent.POSITION_UPDATE).toBe('position_update');
      
      // Listen for movement updates from server
      socketClient.once(GameEvent.PLAYER_MOVED, (data) => {
        movementUpdated = true;
        expect(data.position).toEqual(newPosition);
        expect(data.rotation).toEqual(newRotation);
      });
      
      // Send position update using GameEvent constants to ensure consistency
      socketClient.emit(GameEvent.POSITION_UPDATE, {
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
      
      // Verify GameEvent constant matches actual socket event name
      expect(GameEvent.PLAYER_JOINED).toBe('player_joined');
      expect(GameEvent.PLAYER_JOIN).toBe('player_join');
      
      // Setup second client to receive player_joined events
      let player2JoinedReceived = false;
      
      socketClient1.once(GameEvent.PLAYER_JOINED, (playerData) => {
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
  
  it('should verify all event constants match socket events', () => {
    // Skip in CI environment
    if (shouldSkipTest()) {
      return;
    }
    
    // Verify that important events defined in GameEvent enum match the actual socket event names
    expect(GameEvent.PLAYER_JOIN).toBe('player_join');
    expect(GameEvent.PLAYER_JOINED).toBe('player_joined');
    expect(GameEvent.PLAYER_LEFT).toBe('player_left');
    expect(GameEvent.PLAYER_MOVED).toBe('player_moved');
    expect(GameEvent.POSITION_UPDATE).toBe('position_update');
    expect(GameEvent.PLAYERS_LIST).toBe('players_list');
    expect(GameEvent.MAP_DATA).toBe('map_data');
    expect(GameEvent.SERVER_DIAGNOSTICS).toBe('server_diagnostics');
    expect(GameEvent.PING).toBe('ping');
    expect(GameEvent.PONG).toBe('pong');
    
    // Ensure the helpers are using the same event names
    expect(SOCKET_EVENTS.PLAYER_JOIN).toBe(GameEvent.PLAYER_JOIN);
    expect(SOCKET_EVENTS.PLAYER_JOINED).toBe(GameEvent.PLAYER_JOINED);
  });
  
  it('should handle player disconnect event', async () => {
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
      
      // Connect second client
      const result2 = await connectAndJoinGame(testSetup.clientUrl, 'Player2');
      socketClient2 = result2.client;
      
      // Wait for connections to be fully established
      await wait(50);
      
      // Second player ID
      const _player2Id = result2.player.id;
      
      // Verify GameEvent constants
      expect(GameEvent.PLAYER_LEFT).toBe('player_left');
      
      // Listen for player_left event on first client
      let playerLeftReceived = false;
      let disconnectedPlayerId = '';
      
      socketClient1.once(GameEvent.PLAYER_LEFT, (playerId) => {
        playerLeftReceived = true;
        disconnectedPlayerId = playerId;
      });
      
      // Disconnect second client
      socketClient2.disconnect();
      socketClient2 = null;
      
      // Wait for events to propagate
      await wait(100);
      
      // Verify events received
      expect(playerLeftReceived).toBe(true);
      expect(disconnectedPlayerId).toBe(_player2Id);
      
      // Cleanup
      if (socketClient1) socketClient1.disconnect();
    } catch (err) {
      // Even if the test fails, make sure we clean up
      if (socketClient1) socketClient1.disconnect();
      if (socketClient2) socketClient2.disconnect();
      throw err;
    }
  });
  
  it('should send and receive player information correctly', async () => {
    // Skip in CI environment
    if (shouldSkipTest()) {
      return;
    }
    
    let socketClient: Socket | null = null;
    
    try {
      // Connect client and join game
      const result = await connectAndJoinGame(testSetup.clientUrl, 'TestPlayer');
      socketClient = result.client;
      
      // Verify that player information conforms to expected structure
      const player = result.player;
      expect(player).toHaveProperty('id');
      expect(player).toHaveProperty('position');
      expect(player).toHaveProperty('rotation');
      expect(player).toHaveProperty('color');
      
      expect(player.position).toHaveProperty('x');
      expect(player.position).toHaveProperty('y');
      expect(player.position).toHaveProperty('z');
      
      expect(player.rotation).toHaveProperty('x');
      expect(player.rotation).toHaveProperty('y');
      expect(player.rotation).toHaveProperty('z');
      
      expect(player.color).toHaveProperty('r');
      expect(player.color).toHaveProperty('g');
      expect(player.color).toHaveProperty('b');
      
      // Verify color values are in correct range (0-1)
      expect(player.color.r).toBeGreaterThanOrEqual(0);
      expect(player.color.r).toBeLessThanOrEqual(1);
      expect(player.color.g).toBeGreaterThanOrEqual(0);
      expect(player.color.g).toBeLessThanOrEqual(1);
      expect(player.color.b).toBeGreaterThanOrEqual(0);
      expect(player.color.b).toBeLessThanOrEqual(1);
      
      // Cleanup
      socketClient.disconnect();
    } catch (err) {
      // Even if the test fails, make sure we clean up
      if (socketClient) socketClient.disconnect();
      throw err;
    }
  });
  
  it('should send position updates between players', async () => {
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
      const player1Id = result1.player.id;
      
      // Connect second client
      const result2 = await connectAndJoinGame(testSetup.clientUrl, 'Player2');
      socketClient2 = result2.client;
      const _player2Id = result2.player.id;
      
      // Wait for connections to be established
      await wait(50);
      
      // New position for player 1
      const newPosition: Position = { x: 25, y: 5, z: 25 };
      const newRotation = { x: 0, y: Math.PI, z: 0 };
      
      // Set up listener for player2 to receive player1's movement
      let movementUpdateReceived = false;
      let receivedPosition: Position | null = null;
      let receivedPlayerId: string | null = null;
      
      socketClient2.on(GameEvent.PLAYER_MOVED, (data) => {
        if (data.id === player1Id) {
          movementUpdateReceived = true;
          receivedPosition = data.position;
          receivedPlayerId = data.id;
        }
      });
      
      // Send position update from player1
      socketClient1.emit(GameEvent.POSITION_UPDATE, {
        position: newPosition,
        rotation: newRotation
      });
      
      // Wait for position update to propagate
      await wait(100);
      
      // Verify player2 received the position update from player1
      expect(movementUpdateReceived).toBe(true);
      expect(receivedPlayerId).toBe(player1Id);
      expect(receivedPosition).toEqual(newPosition);
      
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
  
  it('should send correct positions to new players joining', async () => {
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
      const player1Id = result1.player.id;
      
      // Move player1 to a specific position
      const player1Position: Position = { x: 15, y: 3, z: 30 };
      const player1Rotation: Rotation = { x: 0, y: Math.PI / 2, z: 0 };
      
      // Send position update from player1
      socketClient1.emit(GameEvent.POSITION_UPDATE, {
        position: player1Position,
        rotation: player1Rotation
      });
      
      // Wait for position update to be processed by server
      await wait(50);
      
      // Now connect second player and track the PLAYERS_LIST event
      let playersListReceived = false;
      let player1DataInList: PlayerData | undefined = undefined;
      
      // Create a promise to track when player2 receives the players list
      const playersListPromise = new Promise<void>(resolve => {
        const client = ioc(testSetup.clientUrl, {
          autoConnect: false,
          reconnection: false,
          timeout: CONNECTION_TIMEOUT,
        });
        
        // Store the client for cleanup
        socketClient2 = client;
        
        // Listen for the PLAYERS_LIST event
        client.once(GameEvent.PLAYERS_LIST, (playersList: PlayerData[]) => {
          playersListReceived = true;
          
          // Find player1 in the list
          player1DataInList = playersList.find((p) => p.id === player1Id);
          resolve();
        });
        
        // Connect the client
        client.connect();
        
        // Join the game once connected
        client.once(SOCKET_EVENTS.CONNECT, () => {
          client.emit(SOCKET_EVENTS.PLAYER_JOIN, { playerName: 'Player2' });
        });
      });
      
      // Wait for the player list with timeout
      const timeoutPromise = wait(500).then(() => {
        throw new Error('Timeout waiting for PLAYERS_LIST event');
      });
      
      await Promise.race([playersListPromise, timeoutPromise]);
      
      // Verify that player2 received the correct position for player1
      expect(playersListReceived).toBe(true);
      expect(player1DataInList).not.toBeUndefined();
      expect(player1DataInList?.position).toEqual(player1Position);
      expect(player1DataInList?.rotation).toEqual(player1Rotation);
      
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
  
  it('should synchronize multiple position updates between clients', async () => {
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
      const player1Id = result1.player.id;
      
      // Connect second client
      const result2 = await connectAndJoinGame(testSetup.clientUrl, 'Player2');
      socketClient2 = result2.client;
      const _player2Id = result2.player.id;
      
      // Wait for connections to be established
      await wait(50);
      
      // Track position updates received by each client
      const player1ReceivedUpdates: Position[] = [];
      const player2ReceivedUpdates: Position[] = [];
      
      // Client 1 listens for client 2's movements
      socketClient1.on(GameEvent.PLAYER_MOVED, (data) => {
        if (data.id === _player2Id) {
          player1ReceivedUpdates.push({...data.position});
        }
      });
      
      // Client 2 listens for client 1's movements
      socketClient2.on(GameEvent.PLAYER_MOVED, (data) => {
        if (data.id === player1Id) {
          player2ReceivedUpdates.push({...data.position});
        }
      });
      
      // Define a series of positions for client 1
      const client1Positions = [
        { x: 5, y: 1, z: 5 },
        { x: 10, y: 1, z: 10 },
        { x: 15, y: 1, z: 15 }
      ];
      
      // Define a series of positions for client 2
      const client2Positions = [
        { x: -5, y: 1, z: -5 },
        { x: -10, y: 1, z: -10 },
        { x: -15, y: 1, z: -15 }
      ];
      
      // Send position updates from client 1
      for (const position of client1Positions) {
        socketClient1.emit(GameEvent.POSITION_UPDATE, {
          position,
          rotation: { x: 0, y: 0, z: 0 }
        });
        // Wait a bit for propagation
        await wait(30);
      }
      
      // Send position updates from client 2
      for (const position of client2Positions) {
        socketClient2.emit(GameEvent.POSITION_UPDATE, {
          position,
          rotation: { x: 0, y: 0, z: 0 }
        });
        // Wait a bit for propagation
        await wait(30);
      }
      
      // Wait for all updates to be processed
      await wait(100);
      
      // Verify client 1 received all of client 2's positions
      expect(player1ReceivedUpdates.length).toBe(client2Positions.length);
      client2Positions.forEach((pos, index) => {
        expect(player1ReceivedUpdates[index]).toEqual(pos);
      });
      
      // Verify client 2 received all of client 1's positions
      expect(player2ReceivedUpdates.length).toBe(client1Positions.length);
      client1Positions.forEach((pos, index) => {
        expect(player2ReceivedUpdates[index]).toEqual(pos);
      });
      
      // Additional test: Latest position should be correctly stored on server
      // Request the current players list
      let finalPlayersList: PlayerData[] = [];
      
      await new Promise<void>(resolve => {
        socketClient1.once(GameEvent.PLAYERS_LIST, (playersList: PlayerData[]) => {
          finalPlayersList = playersList;
          resolve();
        });
        
        // Rejoin to get the latest player list
        socketClient1.emit(GameEvent.PLAYER_JOIN, { playerName: 'Player1-Rejoin' });
      });
      
      // Find player 2 in the list
      const player2InList = finalPlayersList.find(p => p.id === _player2Id);
      expect(player2InList).toBeDefined();
      expect(player2InList?.position).toEqual(client2Positions[client2Positions.length - 1]);
      
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
  
  it('should synchronize position and rotation updates between clients', async () => {
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
      const player1Id = result1.player.id;
      
      // Connect second client
      const result2 = await connectAndJoinGame(testSetup.clientUrl, 'Player2');
      socketClient2 = result2.client;
      const player2Id = result2.player.id;
      
      // Wait for connections to be established
      await wait(50);
      
      // Track updates received by each client
      interface MovementUpdate {
        position: Position;
        rotation: Rotation;
      }
      
      const player1ReceivedUpdates: MovementUpdate[] = [];
      const player2ReceivedUpdates: MovementUpdate[] = [];
      
      // Client 1 listens for client 2's movements
      socketClient1.on(GameEvent.PLAYER_MOVED, (data) => {
        if (data.id === player2Id) {
          player1ReceivedUpdates.push({
            position: {...data.position},
            rotation: {...data.rotation}
          });
        }
      });
      
      // Client 2 listens for client 1's movements
      socketClient2.on(GameEvent.PLAYER_MOVED, (data) => {
        if (data.id === player1Id) {
          player2ReceivedUpdates.push({
            position: {...data.position},
            rotation: {...data.rotation}
          });
        }
      });
      
      // Define a series of movements for client 1
      const client1Updates = [
        {
          position: { x: 5, y: 1, z: 5 },
          rotation: { x: 0, y: Math.PI / 4, z: 0 }
        },
        {
          position: { x: 10, y: 2, z: 10 },
          rotation: { x: Math.PI / 8, y: Math.PI / 2, z: 0 }
        },
        {
          position: { x: 15, y: 3, z: 15 },
          rotation: { x: 0, y: Math.PI, z: Math.PI / 4 }
        }
      ];
      
      // Define a series of movements for client 2
      const client2Updates = [
        {
          position: { x: -5, y: 1, z: -5 },
          rotation: { x: 0, y: -Math.PI / 4, z: 0 }
        },
        {
          position: { x: -10, y: 2, z: -10 },
          rotation: { x: -Math.PI / 8, y: -Math.PI / 2, z: 0 }
        },
        {
          position: { x: -15, y: 3, z: -15 },
          rotation: { x: 0, y: -Math.PI, z: -Math.PI / 4 }
        }
      ];
      
      // Send updates from client 1
      for (const update of client1Updates) {
        socketClient1.emit(GameEvent.POSITION_UPDATE, update);
        await wait(20);
      }
      
      // Send updates from client 2
      for (const update of client2Updates) {
        socketClient2.emit(GameEvent.POSITION_UPDATE, update);
        await wait(20);
      }
      
      // Wait for all updates to be processed
      await wait(50);
      
      // Verify client 1 received all of client 2's updates
      expect(player1ReceivedUpdates.length).toBe(client2Updates.length);
      client2Updates.forEach((update, index) => {
        expect(player1ReceivedUpdates[index].position).toEqual(update.position);
        expect(player1ReceivedUpdates[index].rotation).toEqual(update.rotation);
      });
      
      // Verify client 2 received all of client 1's updates
      expect(player2ReceivedUpdates.length).toBe(client1Updates.length);
      client1Updates.forEach((update, index) => {
        expect(player2ReceivedUpdates[index].position).toEqual(update.position);
        expect(player2ReceivedUpdates[index].rotation).toEqual(update.rotation);
      });
      
      // Additional test: Latest state should be correctly stored on server
      // Request the current players list
      let finalPlayersList: PlayerData[] = [];
      
      // Create a new connection to get the latest state
      const result3 = await connectAndJoinGame(testSetup.clientUrl, 'Player3');
      const socketClient3 = result3.client;
      
      try {
        await new Promise<void>(resolve => {
          socketClient3.once(GameEvent.PLAYERS_LIST, (playersList: PlayerData[]) => {
            finalPlayersList = playersList;
            resolve();
          });
        });
        
        // Find both players in the list and verify their final states
        const player1InList = finalPlayersList.find(p => p.id === player1Id);
        const player2InList = finalPlayersList.find(p => p.id === player2Id);
        
        expect(player1InList).toBeDefined();
        expect(player2InList).toBeDefined();
        
        // Verify final positions and rotations
        expect(player1InList?.position).toEqual(client1Updates[client1Updates.length - 1].position);
        expect(player1InList?.rotation).toEqual(client1Updates[client1Updates.length - 1].rotation);
        expect(player2InList?.position).toEqual(client2Updates[client2Updates.length - 1].position);
        expect(player2InList?.rotation).toEqual(client2Updates[client2Updates.length - 1].rotation);
        
        // Cleanup the third client
        socketClient3.disconnect();
      } catch (err) {
        if (socketClient3) socketClient3.disconnect();
        throw err;
      }
      
      // Cleanup original clients
      if (socketClient1) socketClient1.disconnect();
      if (socketClient2) socketClient2.disconnect();
    } catch (err) {
      // Even if the test fails, make sure we clean up
      if (socketClient1) socketClient1.disconnect();
      if (socketClient2) socketClient2.disconnect();
      throw err;
    }
  }, 10000); // Increase timeout to 10 seconds
  
  it('should handle comprehensive position and rotation synchronization scenarios', async () => {
    // Skip in CI environment
    if (shouldSkipTest()) return;

    let socketClient1: Socket | null = null;
    let socketClient2: Socket | null = null;

    try {
      // Connect first client
      const result1 = await connectAndJoinGame(testSetup.clientUrl, 'Player1');
      socketClient1 = result1.client;
      const player1Id = result1.player.id;

      // Connect second client
      const result2 = await connectAndJoinGame(testSetup.clientUrl, 'Player2');
      socketClient2 = result2.client;

      // Wait for connections to be established
      await wait(50);

      // Track updates received by each client
      interface MovementUpdate {
        position: Position;
        rotation: Rotation;
      }

      const receivedUpdates: MovementUpdate[] = [];
      socketClient2.on(GameEvent.PLAYER_MOVED, (data) => {
        if (data.id === player1Id) {
          receivedUpdates.push({
            position: {...data.position},
            rotation: {...data.rotation}
          });
        }
      });

      // Define test scenarios that cover key cases
      const updates = [
        // Precise floating point values
        {
          position: { x: 1.23456789, y: 2.34567891, z: 3.45678912 },
          rotation: { x: 0.12345678, y: 0.23456789, z: 0.34567891 }
        },
        // Mathematical constants
        {
          position: { x: Math.PI, y: Math.E, z: Math.SQRT2 },
          rotation: { x: Math.PI / 6, y: Math.PI / 4, z: Math.PI / 3 }
        },
        // Edge case positions
        {
          position: { x: 1e8, y: 1e8, z: 1e8 },
          rotation: { x: 0, y: Math.PI * 2, z: 0 }
        },
        // Negative values
        {
          position: { x: -1e8, y: -1e8, z: -1e8 },
          rotation: { x: -Math.PI / 2, y: -Math.PI, z: -Math.PI / 4 }
        },
        // Realistic gameplay - looking up while moving forward
        {
          position: { x: 0, y: 1.75, z: -5 },
          rotation: { x: -Math.PI / 4, y: 0, z: 0 }
        },
        // Realistic gameplay - strafing right while looking left
        {
          position: { x: 5, y: 1.75, z: 0 },
          rotation: { x: 0, y: -Math.PI / 2, z: 0 }
        }
      ];

      // Send updates with minimal but realistic delays
      for (const update of updates) {
        socketClient1.emit(GameEvent.POSITION_UPDATE, update);
        await wait(20); // Simulate 50fps
      }

      // Wait for all updates to be processed
      await wait(50);

      // Verify number of updates received
      expect(receivedUpdates.length).toBe(updates.length);

      // Verify each update was received correctly
      receivedUpdates.forEach((received, index) => {
        const expected = updates[index];

        // For precise floating point values, use toBeCloseTo
        ['x', 'y', 'z'].forEach(coord => {
          // Position checks
          expect(received.position[coord as keyof Position]).toBeCloseTo(
            expected.position[coord as keyof Position],
            8
          );
          // Rotation checks
          expect(received.rotation[coord as keyof Rotation]).toBeCloseTo(
            expected.rotation[coord as keyof Rotation],
            8
          );
        });
      });

      // Verify final state on server by having a third client join
      const result3 = await connectAndJoinGame(testSetup.clientUrl, 'Player3');
      const socketClient3 = result3.client;

      try {
        // Wait for players list
        const finalState = await new Promise<PlayerData[]>(resolve => {
          socketClient3.once(GameEvent.PLAYERS_LIST, resolve);
        });

        // Find player1 in the list
        const player1FinalState = finalState.find(p => p.id === player1Id);
        expect(player1FinalState).toBeDefined();

        // Verify final position and rotation match last update
        const lastUpdate = updates[updates.length - 1];
        ['x', 'y', 'z'].forEach(coord => {
          expect(player1FinalState?.position[coord as keyof Position]).toBeCloseTo(
            lastUpdate.position[coord as keyof Position],
            8
          );
          expect(player1FinalState?.rotation[coord as keyof Rotation]).toBeCloseTo(
            lastUpdate.rotation[coord as keyof Rotation],
            8
          );
        });
      } finally {
        socketClient3.disconnect();
      }
    } finally {
      if (socketClient1) socketClient1.disconnect();
      if (socketClient2) socketClient2.disconnect();
    }
  }, 10000); // Increase timeout to 10 seconds just in case

  it('should correctly synchronize rotation updates with proper Euler order', async () => {
    // Skip in CI environment
    if (shouldSkipTest()) return;

    let socketClient1: Socket | null = null;
    let socketClient2: Socket | null = null;

    try {
      // Connect first client
      const result1 = await connectAndJoinGame(testSetup.clientUrl, 'Player1');
      socketClient1 = result1.client;
      const player1Id = result1.player.id;

      // Connect second client
      const result2 = await connectAndJoinGame(testSetup.clientUrl, 'Player2');
      socketClient2 = result2.client;

      // Wait for connections to be established
      await wait(50);

      // Track received rotations with timestamps
      interface RotationUpdate {
        rotation: Rotation;
        timestamp: number;
      }

      const receivedRotations: RotationUpdate[] = [];
      socketClient2.on(GameEvent.PLAYER_MOVED, (data) => {
        if (data.id === player1Id) {
          console.log('Received rotation update:', {
            rotation: data.rotation,
            timestamp: Date.now()
          });
          receivedRotations.push({
            rotation: {...data.rotation},
            timestamp: Date.now()
          });
        }
      });

      // Test specific rotation scenarios
      const rotationTests = [
        // Test 1: Pure yaw (y-axis) rotation
        {
          rotation: { x: 0, y: Math.PI / 2, z: 0 },
          description: 'Pure yaw 90 degrees'
        },
        // Test 2: Pure pitch (x-axis) rotation
        {
          rotation: { x: Math.PI / 4, y: 0, z: 0 },
          description: 'Pure pitch 45 degrees'
        },
        // Test 3: Pure roll (z-axis) rotation
        {
          rotation: { x: 0, y: 0, z: Math.PI / 4 },
          description: 'Pure roll 45 degrees'
        },
        // Test 4: Combined rotation (realistic looking around corner)
        {
          rotation: { x: -Math.PI / 6, y: Math.PI / 2, z: 0 },
          description: 'Looking around corner (yaw + pitch)'
        },
        // Test 5: Full combined rotation
        {
          rotation: { x: Math.PI / 6, y: Math.PI / 3, z: Math.PI / 6 },
          description: 'Combined rotation all axes'
        }
      ];

      console.log('Starting rotation synchronization test');

      // Send each rotation update with a delay
      for (const test of rotationTests) {
        console.log(`Sending rotation: ${test.description}`, test.rotation);
        
        socketClient1.emit(GameEvent.POSITION_UPDATE, {
          position: { x: 0, y: 0, z: 0 },
          rotation: test.rotation
        });
        
        // Wait between updates to ensure proper ordering
        await wait(100);
      }

      // Wait for all updates to be processed
      await wait(200);

      // Verify number of updates received
      expect(receivedRotations.length).toBe(rotationTests.length);
      console.log(`Received ${receivedRotations.length} rotation updates`);

      // Verify each rotation was received correctly
      receivedRotations.forEach((received, index) => {
        const expected = rotationTests[index];
        console.log(`Verifying rotation ${index + 1}: ${expected.description}`);
        console.log('Expected:', expected.rotation);
        console.log('Received:', received.rotation);

        // Check each axis with high precision
        ['x', 'y', 'z'].forEach(axis => {
          const receivedValue = received.rotation[axis as keyof Rotation];
          const expectedValue = expected.rotation[axis as keyof Rotation];
          
          // Use a smaller epsilon for more precise comparison
          expect(receivedValue).toBeCloseTo(expectedValue, 6);
          
          // Log the difference for debugging
          const diff = Math.abs(receivedValue - expectedValue);
          console.log(`${axis}-axis difference: ${diff}`);
        });
      });

      // Verify final state on server
      const result3 = await connectAndJoinGame(testSetup.clientUrl, 'Player3');
      const socketClient3 = result3.client;

      try {
        // Get final state
        const finalState = await new Promise<PlayerData[]>(resolve => {
          socketClient3.once(GameEvent.PLAYERS_LIST, resolve);
        });

        // Find player1 in the list
        const player1FinalState = finalState.find(p => p.id === player1Id);
        expect(player1FinalState).toBeDefined();

        // Verify final rotation matches last update
        const lastRotation = rotationTests[rotationTests.length - 1].rotation;
        console.log('Final server state rotation check:');
        console.log('Expected final rotation:', lastRotation);
        console.log('Server stored rotation:', player1FinalState?.rotation);

        ['x', 'y', 'z'].forEach(axis => {
          const serverValue = player1FinalState?.rotation[axis as keyof Rotation];
          const expectedValue = lastRotation[axis as keyof Rotation];
          expect(serverValue).toBeCloseTo(expectedValue, 6);
          
          // Log the difference
          const diff = Math.abs((serverValue || 0) - expectedValue);
          console.log(`Final ${axis}-axis difference: ${diff}`);
        });

        socketClient3.disconnect();
      } catch (err) {
        if (socketClient3) socketClient3.disconnect();
        throw err;
      }
    } finally {
      if (socketClient1) socketClient1.disconnect();
      if (socketClient2) socketClient2.disconnect();
    }
  }, 10000);
}); 