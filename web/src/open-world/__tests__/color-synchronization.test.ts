import { silenceConsole } from '../../test/test-utils';
import { createTestEnvironment, ThreeTestEnvironment } from '../../test/three-test-environment';
import { createTestColor, expectColorClose } from '../../test/three-test-utils';
import { GameEvent } from '../../constants';
import { Color } from '../../types';
import { Player } from '../player';
import { NetworkManager } from '../network-manager';
import * as THREE from 'three';

describe('Color Synchronization', () => {
  let player: Player;
  let networkManager: NetworkManager;
  let mockSocket: any;
  let testEnv: ThreeTestEnvironment;
  let consoleControl: { restore: () => void };

  beforeEach(() => {
    // Set up test environment
    testEnv = createTestEnvironment();
    consoleControl = silenceConsole();

    // Create test instances
    player = new Player('test-player');
    testEnv.add(player.object);
    
    // Mock socket.io
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      removeAllListeners: jest.fn()
    };

    // Initialize NetworkManager
    networkManager = new NetworkManager(
      player,
      jest.fn(), // onPlayerJoin
      jest.fn(), // onPlayerLeave
      jest.fn(), // onPositionUpdate
      jest.fn()  // onConnectionStatus
    );

    // @ts-expect-error - Accessing private field for testing
    networkManager.socket = mockSocket;

    // Set up event handlers
    networkManager.setupEventHandlers();
  });

  afterEach(() => {
    testEnv.cleanup();
    consoleControl.restore();
  });

  it('should update local player color on initial connection', () => {
    // Store event handlers
    const eventHandlers: { [key: string]: Function } = {};
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      eventHandlers[event] = handler;
    });

    // Set up event handlers
    networkManager.setupEventHandlers();

    // Verify initial color is gray
    const initialColor = player.getColor();
    expectColorClose(initialColor, new THREE.Color(0xCCCCCC));

    // Simulate server sending initial player data
    const assignedColor = createTestColor(0.8, 0.2, 0.3);
    if (eventHandlers['connect']) {
      // First trigger connect
      eventHandlers['connect']();

      // Then simulate server response with player data
      eventHandlers[GameEvent.PLAYER_JOINED]({
        id: 'test-player',
        position: { x: 0, y: 0, z: 0 },
        color: assignedColor
      });
    }

    // Verify color was updated from gray to assigned color
    const updatedColor = player.getColor();
    expectColorClose(updatedColor, assignedColor);
  });

  it('should maintain consistent color assignment', () => {
    const serverColor = createTestColor(0.6, 0.7, 0.3);

    // Simulate server assigning color
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      if (event === GameEvent.PLAYER_JOINED) {
        handler({
          id: 'test-player',
          position: { x: 0, y: 0, z: 0 },
          color: serverColor
        });
      }
    });

    // Set up event handlers
    networkManager.setupEventHandlers();

    // Verify color was assigned correctly
    const playerColor = player.getColor();
    expectColorClose(playerColor, serverColor);
  });

  it('should handle color corrections from server', () => {
    const initialColor = createTestColor(0.1, 0.2, 0.3);
    const correctedColor = createTestColor(0.5, 0.6, 0.7);

    // Set initial color
    player.setColor(initialColor);

    // Simulate server sending color correction
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      if (event === GameEvent.FORCE_STATE_CORRECTION) {
        handler({
          color: correctedColor,
          position: { x: 0, y: 0, z: 0 }
        });
      }
    });

    // Set up event handlers
    networkManager.setupEventHandlers();

    // Verify color was corrected
    const playerColor = player.getColor();
    expectColorClose(playerColor, correctedColor);
  });

  it('should detect and report color drift', () => {
    const serverColor = createTestColor(0.1, 0.2, 0.3);
    const driftedColor = createTestColor(0.15, 0.25, 0.35); // 0.05 drift in each component

    // Set up initial color
    player.setColor(serverColor);

    // Simulate color drift
    player.setColor(driftedColor);

    // Store event handlers
    const eventHandlers: { [key: string]: Function } = {};
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      eventHandlers[event] = handler;
    });

    // Set up event handlers
    networkManager.setupEventHandlers();

    // Simulate server verification request
    if (eventHandlers['state_verification']) {
      eventHandlers['state_verification']({
        expected: {
          id: 'test-player',
          position: { x: 0, y: 0, z: 0 },
          color: serverColor
        },
        timestamp: Date.now()
      });
    }

    // Verify client sent state response
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'client_state_response',
      expect.objectContaining({
        color: expect.objectContaining({
          r: driftedColor.r,
          g: driftedColor.g,
          b: driftedColor.b
        })
      })
    );
  });

  it('should reset color on disconnect', () => {
    const initialColor = createTestColor(0.1, 0.2, 0.3);

    // Set initial color
    player.setColor(initialColor);

    // Call disconnect directly
    networkManager.disconnect();

    // Verify color was reset to default gray (0xCCCCCC)
    const playerColor = player.getColor();
    const expectedColor = new THREE.Color(0xCCCCCC);
    expectColorClose(playerColor, expectedColor);
  });

  it('should update local player color on initial join', () => {
    // Create a mock socket
    const mockSocket = {
      id: 'test-socket-id',
      on: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn(),
      disconnect: jest.fn(),
      connected: true,
      io: {
        engine: {
          transport: {
            name: 'websocket'
          }
        }
      }
    };

    // Create a mock player
    const mockPlayer = {
      setColor: jest.fn(),
      setPosition: jest.fn(),
      getPosition: () => new THREE.Vector3(),
      getRotation: () => new THREE.Quaternion(),
      getId: () => 'test-socket-id',
    };

    // Create network manager with mocks
    const networkManager = new NetworkManager(
      mockPlayer as any,
      () => {}, // onPlayerJoin
      () => {}, // onPlayerLeave
      () => {}, // onPositionUpdate
      () => {}, // onConnectionStatus
    );

    // Set up the socket and trigger event handlers
    (networkManager as any).socket = mockSocket;
    (networkManager as any).setupEventHandlers();

    // Find the PLAYER_JOINED handler that was registered
    const playerJoinedCalls = mockSocket.on.mock.calls.filter(
      call => call[0] === GameEvent.PLAYER_JOINED
    );
    expect(playerJoinedCalls.length).toBe(1);
    const playerJoinedHandler = playerJoinedCalls[0][1];

    // Simulate receiving our own player data
    const serverColor = { r: 1, g: 0, b: 0 }; // Red
    const serverPosition = { x: 10, y: 20, z: 30 };
    
    // Call the handler with our test data
    playerJoinedHandler({
      id: 'test-socket-id',
      position: serverPosition,
      color: serverColor,
      rotation: { x: 0, y: 0, z: 0 },
    });

    // Verify the local player's color was updated
    expect(mockPlayer.setColor).toHaveBeenCalledWith(
      expect.any(THREE.Color)
    );
    const setColor = mockPlayer.setColor.mock.calls[0][0];
    expectColorClose(setColor, new THREE.Color(
      serverColor.r,
      serverColor.g,
      serverColor.b
    ));

    // Verify position was updated
    expect(mockPlayer.setPosition).toHaveBeenCalledWith(
      expect.any(THREE.Vector3)
    );
    const setPosition = mockPlayer.setPosition.mock.calls[0][0];
    expect(setPosition.x).toBe(serverPosition.x);
    expect(setPosition.y).toBe(serverPosition.y);
    expect(setPosition.z).toBe(serverPosition.z);
  });
}); 