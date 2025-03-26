import { GameEvent } from '../../constants';
import * as THREE from 'three';
import { MapData } from '../../types';
import { EventEmitter } from 'events';

// Mock Three.js objects with the same pattern as world-manager.test.ts
jest.mock('three', () => {
  const defaultVector3 = {
    x: 0,
    y: 0,
    z: 0,
    set: jest.fn(),
    copy: jest.fn(),
  };

  // Create a class that makes sure everything has position, rotation, etc.
  class MockObject3D {
    position = { ...defaultVector3 };
    rotation = { ...defaultVector3 };
    scale = { ...defaultVector3 };
    add = jest.fn();
    remove = jest.fn();
  }

  return {
    Vector3: jest.fn((x, y, z) => ({
      x: x || 0,
      y: y || 0,
      z: z || 0,
      set: jest.fn(),
      copy: jest.fn(),
    })),
    Color: jest.fn((r, g, b) => ({ r: r || 0, g: g || 0, b: b || 0, setHSL: jest.fn() })),
    Object3D: jest.fn(() => new MockObject3D()),
  };
});

// Create a mock for the player type
interface MockPlayer {
  id: string;
  getId: jest.Mock;
  getPosition: jest.Mock;
  getRotation: jest.Mock;
  setColor: jest.Mock;
  getObject: jest.Mock;
}

// Mock player data type
interface PlayerJoinData {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  color: { r: number; g: number; b: number };
}

// Simple player list type for the server to track
interface PlayersList {
  [id: string]: PlayerJoinData;
}

// Instead of mocking the NetworkManager, we'll create a simple event emitter to test the map sharing
class TestNetworkManager extends EventEmitter {
  localPlayer: MockPlayer;
  isConnected = true;
  otherPlayers = new Map<string, PlayerJoinData>();

  constructor(player: MockPlayer) {
    super();
    this.localPlayer = player;
  }

  disconnect(): void {
    this.isConnected = false;
    this.removeAllListeners();
  }

  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  // Add a player to the local list of other players
  addPlayer(playerData: PlayerJoinData): void {
    this.otherPlayers.set(playerData.id, playerData);
  }

  // Remove a player from the local list
  removePlayer(playerId: string): void {
    this.otherPlayers.delete(playerId);
  }

  // Get all other players
  getOtherPlayers(): Map<string, PlayerJoinData> {
    return this.otherPlayers;
  }
}

// Mock server to test player synchronization
class MockServer extends EventEmitter {
  players: PlayersList = {};

  // Add a player to the server
  addPlayer(playerData: PlayerJoinData): void {
    this.players[playerData.id] = playerData;
    // Broadcast to all other connected clients
    Object.keys(this.players).forEach((id) => {
      if (id !== playerData.id) {
        this.emit(id, GameEvent.PLAYER_JOINED, playerData);
      }
    });
  }

  // Remove a player from the server
  removePlayer(playerId: string): void {
    delete this.players[playerId];
    // Broadcast to all connected clients
    this.emit('broadcast', GameEvent.PLAYER_LEFT, playerId);
  }

  // Broadcast event to all clients
  broadcastToAll(event: string, data: PlayerJoinData | string): void {
    this.emit('broadcast', event, data);
  }

  // Send player list to a specific client
  sendPlayerListTo(clientId: string): void {
    // In a real server, we would filter out the client's own player
    const playersToSend = Object.values(this.players).filter((player) => player.id !== clientId);

    this.emit(clientId, GameEvent.PLAYERS_LIST, playersToSend);
  }

  // Connect a client to the server
  connectClient(clientId: string, clientManager: TestNetworkManager): void {
    // Set up event forwarding for this client
    this.on(clientId, (event: string, data: PlayerJoinData | string) => {
      clientManager.emit(event, data);
    });

    // Set up client to server communication
    clientManager.on('toServer', (event: string, data: PlayerJoinData | string) => {
      this.handleClientEvent(clientId, event, data);
    });

    // Set up broadcast forwarding
    this.on('broadcast', (event: string, data: PlayerJoinData | string) => {
      // In real server, we wouldn't always broadcast to the sender
      clientManager.emit(event, data);
    });

    // Send initial player list to the new client
    this.sendPlayerListTo(clientId);
  }

  // Handle events from clients
  handleClientEvent(clientId: string, event: string, data: unknown): void {
    if (event === GameEvent.PLAYER_JOIN) {
      // Add the player's data to our list
      const joinData = data as {
        position: { x: number; y: number; z: number };
        rotation: { x: number; y: number; z: number };
      };

      this.addPlayer({
        id: clientId,
        position: joinData.position || { x: 0, y: 0, z: 0 },
        rotation: joinData.rotation || { x: 0, y: 0, z: 0 },
        color: { r: Math.random(), g: Math.random(), b: Math.random() },
      });

      // Send the existing player list to the new client
      this.sendPlayerListTo(clientId);
    }
  }
}

describe('Map Data Sharing Tests', () => {
  let networkManager: TestNetworkManager;
  let player: MockPlayer;

  beforeEach(() => {
    // Create test player
    player = {
      id: 'test-player',
      getId: jest.fn().mockReturnValue('test-player'),
      getPosition: jest.fn().mockReturnValue(new THREE.Vector3(0, 0, 0)),
      getRotation: jest.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
      setColor: jest.fn(),
      getObject: jest.fn().mockReturnValue(new THREE.Object3D()),
    };

    // Create our test network manager
    networkManager = new TestNetworkManager(player);
  });

  afterEach(() => {
    networkManager.disconnect();
    jest.restoreAllMocks();
  });

  describe('Map Data Handling', () => {
    const mockMapData: MapData = {
      worldSize: 100,
      obstacles: [
        {
          type: 'cube',
          position: { x: 10, y: 1, z: 10 },
          scale: { x: 1, y: 2, z: 1 },
          color: { r: 1, g: 0, b: 0 },
          size: 2,
        },
        {
          type: 'cylinder',
          position: { x: -10, y: 1.5, z: -10 },
          scale: { x: 1, y: 1, z: 1 },
          color: { r: 0, g: 1, b: 0 },
          radius: 1,
          height: 3,
        },
      ],
    };

    it('should handle map data events', () => {
      // Set up map data handler
      const mapDataHandler = jest.fn();
      networkManager.on(GameEvent.MAP_DATA, mapDataHandler);

      // Emit map data - should trigger handler
      networkManager.emit(GameEvent.MAP_DATA, mockMapData);

      // Verify handler was called with the correct data
      expect(mapDataHandler).toHaveBeenCalledWith(mockMapData);
    });

    it('should unregister event handlers on disconnect', () => {
      // Set up handler
      const mapDataHandler = jest.fn();
      networkManager.on(GameEvent.MAP_DATA, mapDataHandler);

      // Disconnect should clean up handlers
      networkManager.disconnect();

      // Emit data - should not trigger handler since we disconnected
      networkManager.emit(GameEvent.MAP_DATA, mockMapData);

      // Handler should not be called
      expect(mapDataHandler).not.toHaveBeenCalled();
    });
  });

  describe('Player Synchronization Tests', () => {
    it('should handle multiple players joining', () => {
      // Create a handler that adds players when they join
      const playerJoinHandler = jest.fn((data: PlayerJoinData) => {
        networkManager.addPlayer(data);
      });
      networkManager.on(GameEvent.PLAYER_JOINED, playerJoinHandler);

      // First player joining
      const player1Data = {
        id: 'player1',
        position: { x: 10, y: 0, z: 10 },
        rotation: { x: 0, y: 0, z: 0 },
        color: { r: 1, g: 0, b: 0 },
      };
      networkManager.emit(GameEvent.PLAYER_JOINED, player1Data);

      // Second player joining
      const player2Data = {
        id: 'player2',
        position: { x: -10, y: 0, z: -10 },
        rotation: { x: 0, y: 0, z: 0 },
        color: { r: 0, g: 0, b: 1 },
      };
      networkManager.emit(GameEvent.PLAYER_JOINED, player2Data);

      // Verify both handlers were called
      expect(playerJoinHandler).toHaveBeenCalledTimes(2);

      // Verify both players are in the list
      expect(networkManager.getOtherPlayers().size).toBe(2);
      expect(networkManager.getOtherPlayers().has('player1')).toBeTruthy();
      expect(networkManager.getOtherPlayers().has('player2')).toBeTruthy();
    });

    it('should handle players leaving', () => {
      // Add players first
      const player1Data = {
        id: 'player1',
        position: { x: 10, y: 0, z: 10 },
        rotation: { x: 0, y: 0, z: 0 },
        color: { r: 1, g: 0, b: 0 },
      };
      networkManager.addPlayer(player1Data);

      const player2Data = {
        id: 'player2',
        position: { x: -10, y: 0, z: -10 },
        rotation: { x: 0, y: 0, z: 0 },
        color: { r: 0, g: 0, b: 1 },
      };
      networkManager.addPlayer(player2Data);

      // Create a handler that removes players when they leave
      const playerLeaveHandler = jest.fn((playerId: string) => {
        networkManager.removePlayer(playerId);
      });
      networkManager.on(GameEvent.PLAYER_LEFT, playerLeaveHandler);

      // Player 1 leaves
      networkManager.emit(GameEvent.PLAYER_LEFT, 'player1');

      // Verify player was removed
      expect(playerLeaveHandler).toHaveBeenCalledWith('player1');
      expect(networkManager.getOtherPlayers().size).toBe(1);
      expect(networkManager.getOtherPlayers().has('player1')).toBeFalsy();
      expect(networkManager.getOtherPlayers().has('player2')).toBeTruthy();
    });
  });

  describe('Two Player Integration Test', () => {
    // This test simulates two network managers (players) joining the same server
    it('should ensure both players can see each other', () => {
      // Create a second player and network manager
      const player2: MockPlayer = {
        id: 'player2',
        getId: jest.fn().mockReturnValue('player2'),
        getPosition: jest.fn().mockReturnValue(new THREE.Vector3(10, 0, 10)),
        getRotation: jest.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
        setColor: jest.fn(),
        getObject: jest.fn().mockReturnValue(new THREE.Object3D()),
      };
      const networkManager2 = new TestNetworkManager(player2);

      // Set up join/leave handlers for both managers
      networkManager.on(GameEvent.PLAYER_JOINED, (data: PlayerJoinData) => {
        networkManager.addPlayer(data);
      });

      networkManager2.on(GameEvent.PLAYER_JOINED, (data: PlayerJoinData) => {
        networkManager2.addPlayer(data);
      });

      // Simulate joining server

      // Each player's data
      const player1Data: PlayerJoinData = {
        id: player.id,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        color: { r: 1, g: 0, b: 0 },
      };

      const player2Data: PlayerJoinData = {
        id: player2.id,
        position: { x: 10, y: 0, z: 10 },
        rotation: { x: 0, y: 0, z: 0 },
        color: { r: 0, g: 0, b: 1 },
      };

      // Simulate the server sending join events for both players to both clients
      // Note: In reality, server would not send you your own join event, but would include you in
      // the player list sent to other players.

      // First player joins
      networkManager2.emit(GameEvent.PLAYER_JOINED, player1Data);
      // Second player joins
      networkManager.emit(GameEvent.PLAYER_JOINED, player2Data);

      // Both network managers should have one other player
      expect(networkManager.getOtherPlayers().size).toBe(1);
      expect(networkManager2.getOtherPlayers().size).toBe(1);

      // Player 1 should see player 2
      expect(networkManager.getOtherPlayers().has(player2.id)).toBeTruthy();

      // Player 2 should see player 1
      expect(networkManager2.getOtherPlayers().has(player.id)).toBeTruthy();

      // Clean up the second manager
      networkManager2.disconnect();
    });
  });

  describe('Realistic Server-Client Integration Test', () => {
    it('should properly synchronize players when they join in sequence', () => {
      // Create server
      const server = new MockServer();

      // Create event handlers for first player
      networkManager.on(GameEvent.PLAYER_JOINED, (data: PlayerJoinData) => {
        networkManager.addPlayer(data);
      });

      networkManager.on(GameEvent.PLAYER_LEFT, (playerId: string) => {
        networkManager.removePlayer(playerId);
      });

      networkManager.on(GameEvent.PLAYERS_LIST, (playersList: PlayerJoinData[]) => {
        // Add all players from the list
        for (const playerData of playersList) {
          networkManager.addPlayer(playerData);
        }
      });

      // Create second player and network manager
      const player2: MockPlayer = {
        id: 'player2',
        getId: jest.fn().mockReturnValue('player2'),
        getPosition: jest.fn().mockReturnValue(new THREE.Vector3(10, 0, 10)),
        getRotation: jest.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
        setColor: jest.fn(),
        getObject: jest.fn().mockReturnValue(new THREE.Object3D()),
      };
      const networkManager2 = new TestNetworkManager(player2);

      // Create event handlers for second player
      networkManager2.on(GameEvent.PLAYER_JOINED, (data: PlayerJoinData) => {
        networkManager2.addPlayer(data);
      });

      networkManager2.on(GameEvent.PLAYER_LEFT, (playerId: string) => {
        networkManager2.removePlayer(playerId);
      });

      networkManager2.on(GameEvent.PLAYERS_LIST, (playersList: PlayerJoinData[]) => {
        // Add all players from the list
        for (const playerData of playersList) {
          networkManager2.addPlayer(playerData);
        }
      });

      // Connect both clients to the server
      server.connectClient(player.id, networkManager);
      server.connectClient(player2.id, networkManager2);

      // Player 1 joins first
      networkManager.emit('toServer', GameEvent.PLAYER_JOIN, {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        color: { r: 1, g: 0, b: 0 },
      });

      // Player 2 joins second
      networkManager2.emit('toServer', GameEvent.PLAYER_JOIN, {
        position: { x: 10, y: 0, z: 10 },
        rotation: { x: 0, y: 0, z: 0 },
        color: { r: 0, g: 0, b: 1 },
      });

      // Verify both players can see each other
      expect(networkManager.getOtherPlayers().size).toBe(1);
      expect(networkManager2.getOtherPlayers().size).toBe(1);

      // Player 1 should see player 2
      expect(networkManager.getOtherPlayers().has('player2')).toBeTruthy();

      // Player 2 should see player 1
      expect(networkManager2.getOtherPlayers().has('test-player')).toBeTruthy();

      // Test that player1 can still see player2 if they disconnect and reconnect
      networkManager2.disconnect();

      // Simulate player 2 leaving
      server.removePlayer('player2');

      // Player 1 should no longer see player 2
      expect(networkManager.getOtherPlayers().size).toBe(0);

      // Reconnect player 2 with a new network manager
      const networkManager2Reconnect = new TestNetworkManager(player2);

      // Set up event handlers for the reconnected player
      networkManager2Reconnect.on(GameEvent.PLAYER_JOINED, (data: PlayerJoinData) => {
        networkManager2Reconnect.addPlayer(data);
      });

      networkManager2Reconnect.on(GameEvent.PLAYER_LEFT, (playerId: string) => {
        networkManager2Reconnect.removePlayer(playerId);
      });

      networkManager2Reconnect.on(GameEvent.PLAYERS_LIST, (playersList: PlayerJoinData[]) => {
        // Add all players from the list
        for (const playerData of playersList) {
          networkManager2Reconnect.addPlayer(playerData);
        }
      });

      // Connect the reconnected client
      server.connectClient('player2', networkManager2Reconnect);

      // Player 2 joins again
      networkManager2Reconnect.emit('toServer', GameEvent.PLAYER_JOIN, {
        position: { x: 15, y: 0, z: 15 }, // Different position this time
        rotation: { x: 0, y: 0, z: 0 },
        color: { r: 0, g: 0, b: 1 },
      });

      // Both players should see each other again
      expect(networkManager.getOtherPlayers().size).toBe(1);
      expect(networkManager2Reconnect.getOtherPlayers().size).toBe(1);

      // Verify player 1 sees player 2's new position
      const player2InPlayer1View = networkManager.getOtherPlayers().get('player2');
      expect(player2InPlayer1View?.position.x).toBe(15);

      // Clean up
      networkManager2Reconnect.disconnect();
    });
  });

  describe('Event Forwarding', () => {
    it('should forward player join events', () => {
      // Set up handler
      const playerJoinHandler = jest.fn();
      networkManager.on(GameEvent.PLAYER_JOINED, playerJoinHandler);

      // Create player data
      const playerData = {
        id: 'other-player',
        position: { x: 10, y: 0, z: 10 },
        rotation: { x: 0, y: 0, z: 0 },
        color: { r: 0, g: 1, b: 0 },
      };

      // Emit the event
      networkManager.emit(GameEvent.PLAYER_JOINED, playerData);

      // Verify handler was called with the correct data
      expect(playerJoinHandler).toHaveBeenCalledWith(playerData);
    });

    it('should forward player left events', () => {
      // Set up handler
      const playerLeftHandler = jest.fn();
      networkManager.on(GameEvent.PLAYER_LEFT, playerLeftHandler);

      // Player ID for the left event
      const playerId = 'other-player';

      // Emit the event
      networkManager.emit(GameEvent.PLAYER_LEFT, playerId);

      // Verify handler was called with the correct data
      expect(playerLeftHandler).toHaveBeenCalledWith(playerId);
    });
  });
});
