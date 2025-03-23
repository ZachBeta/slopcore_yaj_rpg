import { NetworkManager } from './network-manager';
import { GameEvent, GameEventPayloads, ConnectionStatus } from '../constants';
import * as THREE from 'three';

describe('NetworkManager', () => {
  let networkManager: NetworkManager;
  let mockPlayer: any;
  let mockCallbacks: {
    onPlayerJoin: jest.Mock;
    onPlayerLeave: jest.Mock;
    onPlayerPositionUpdate: jest.Mock;
    onConnectionStatus: jest.Mock;
  };

  beforeEach(() => {
    // Create mock player
    mockPlayer = {
      getId: jest.fn().mockReturnValue('test-player'),
      getPosition: jest.fn().mockReturnValue(new THREE.Vector3(0, 0, 0)),
      getRotation: jest.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
      setColor: jest.fn(),
      getObject: jest.fn().mockReturnValue(new THREE.Object3D())
    };

    // Create mock callbacks
    mockCallbacks = {
      onPlayerJoin: jest.fn(),
      onPlayerLeave: jest.fn(),
      onPlayerPositionUpdate: jest.fn(),
      onConnectionStatus: jest.fn()
    };

    // Create NetworkManager instance
    networkManager = new NetworkManager(
      mockPlayer,
      mockCallbacks.onPlayerJoin,
      mockCallbacks.onPlayerLeave,
      mockCallbacks.onPlayerPositionUpdate,
      mockCallbacks.onConnectionStatus
    );
  });

  afterEach(() => {
    networkManager.disconnect();
  });

  describe('Event Handling', () => {
    it('should handle player join events with correct types', () => {
      const playerData: GameEventPayloads[typeof GameEvent.PLAYER_JOINED] = {
        id: 'test-player',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        color: { r: 1, g: 0, b: 0 }
      };

      networkManager.on(GameEvent.PLAYER_JOINED, (player) => {
        expect(player).toEqual(playerData);
      });

      networkManager.emit(GameEvent.PLAYER_JOINED, playerData);
    });

    it('should handle player left events with correct types', () => {
      const playerId: GameEventPayloads[typeof GameEvent.PLAYER_LEFT] = 'test-player';

      networkManager.on(GameEvent.PLAYER_LEFT, (id) => {
        expect(id).toBe(playerId);
      });

      networkManager.emit(GameEvent.PLAYER_LEFT, playerId);
    });

    it('should handle player moved events with correct types', () => {
      const moveData: GameEventPayloads[typeof GameEvent.PLAYER_MOVED] = {
        id: 'test-player',
        position: { x: 1, y: 2, z: 3 },
        rotation: { x: 0, y: 0, z: 0 }
      };

      networkManager.on(GameEvent.PLAYER_MOVED, (data) => {
        expect(data).toEqual(moveData);
      });

      networkManager.emit(GameEvent.PLAYER_MOVED, moveData);
    });

    it('should handle chat messages with correct types', () => {
      const chatData: GameEventPayloads[typeof GameEvent.CHAT_MESSAGE] = {
        id: 'test-player',
        message: 'Hello, World!'
      };

      networkManager.on(GameEvent.CHAT_MESSAGE, (data) => {
        expect(data).toEqual(chatData);
      });

      networkManager.emit(GameEvent.CHAT_MESSAGE, chatData);
    });

    it('should handle server diagnostics with correct types', () => {
      const diagnostics: GameEventPayloads[typeof GameEvent.SERVER_DIAGNOSTICS] = {
        uptime: 100,
        fps: 60,
        playerCount: 5,
        colorPoolSize: 18,
        availableColors: 10,
        lockedColors: 5,
        randomColors: 3,
        connections: 5
      };

      networkManager.on(GameEvent.SERVER_DIAGNOSTICS, (data) => {
        expect(data).toEqual(diagnostics);
      });

      networkManager.emit(GameEvent.SERVER_DIAGNOSTICS, diagnostics);
    });
  });

  describe('Connection Management', () => {
    it('should handle connection status changes', () => {
      const status: GameEventPayloads[typeof GameEvent.CONNECTION_STATUS] = ConnectionStatus.CONNECTED;

      networkManager.on(GameEvent.CONNECTION_STATUS, (newStatus) => {
        expect(newStatus).toBe(status);
      });

      networkManager.emit(GameEvent.CONNECTION_STATUS, status);
    });

    it('should handle connection errors', () => {
      const error: GameEventPayloads[typeof GameEvent.CONNECTION_ERROR] = {
        message: 'Connection failed',
        code: 'ECONNREFUSED'
      };

      networkManager.on(GameEvent.CONNECTION_ERROR, (err) => {
        expect(err).toEqual(error);
      });

      networkManager.emit(GameEvent.CONNECTION_ERROR, error);
    });
  });
}); 