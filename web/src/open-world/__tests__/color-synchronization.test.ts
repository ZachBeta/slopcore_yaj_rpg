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
}); 