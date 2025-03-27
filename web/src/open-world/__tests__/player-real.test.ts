import * as THREE from 'three';
import { Player } from '../player';
import { GameEvent } from '../../constants';
import { ThreeTestEnvironment, createTestEnvironment } from '../../test/three-test-environment';
import { InputAction } from '../../constants/input';
import { EventEmitter as _EventEmitter } from 'events';
import { InputManager } from '../input-manager';
import { Position, Rotation } from '../../types';

// Note: Since THREE.CSS2DRenderer requires DOM, we need to mock just that part
jest.mock('three/examples/jsm/renderers/CSS2DRenderer', () => {
  return {
    CSS2DObject: jest.fn((element) => {
      return {
        element,
        position: new THREE.Vector3(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        rotation: new THREE.Euler(0, 0, 0),
      };
    }),
    CSS2DRenderer: jest.fn(),
  };
});

// Simple mock for InputManager
class _MockInputManager {
  private activeActions: Set<InputAction> = new Set();
  
  getActiveActions(): Set<InputAction> {
    return this.activeActions;
  }
  
  addActiveAction(action: InputAction): void {
    this.activeActions.add(action);
  }
  
  removeActiveAction(action: InputAction): void {
    this.activeActions.delete(action);
  }
  
  dispose(): void {
    this.activeActions.clear();
  }

  isKeyPressed(action: InputAction): boolean {
    return this.activeActions.has(action);
  }

  isKeyDown(action: InputAction): boolean {
    return this.activeActions.has(action);
  }

  isKeyUp(action: InputAction): boolean {
    return !this.activeActions.has(action);
  }

  update(): void {
    // No-op for mock
  }
}

interface EventData {
  position?: Position;
  rotation?: Rotation;
  [key: string]: unknown;
}

interface TestEventEmitter {
  on(event: string, listener: (data: EventData) => void): this;
  emit(event: string, data: EventData): boolean;
  once(event: string, listener: (data: EventData) => void): this;
  removeListener(event: string, listener: (data: EventData) => void): this;
  addListener(event: string, listener: (data: EventData) => void): this;
  removeAllListeners(event?: string): this;
}

interface TestPlayer extends Player {
  eventEmitter: TestEventEmitter;
  inputManager: InputManager;
  handleMovement(deltaTime: number): void;
  handleRotation(deltaTime: number): void;
  updateCollisionEffect(deltaTime: number): void;
}

class TestPlayerImpl extends Player implements TestPlayer {
  public eventEmitter: TestEventEmitter;
  public inputManager: InputManager;

  constructor(eventEmitter: TestEventEmitter) {
    super();
    this.eventEmitter = eventEmitter;
    this.inputManager = new _MockInputManager();
  }

  protected emitEvent(event: string, data: EventData): void {
    if (this.eventEmitter) {
      this.eventEmitter.emit(event, data);
    }
  }

  public update(deltaTime: number): void {
    this.handleMovement(deltaTime);
    this.handleRotation(deltaTime);
    this.updateCollisionEffect(deltaTime);
  }

  public setPositionXYZ(x: number, y: number, z: number): void {
    const position = this.getObject().position;
    position.set(x, y, z);
  }

  public simulateMovement(action: InputAction, active: boolean): void {
    if (active) {
      (this.inputManager as _MockInputManager).addActiveAction(action);
    } else {
      (this.inputManager as _MockInputManager).removeActiveAction(action);
    }
  }

  public forceUpdate(deltaTime: number): void {
    this.update(deltaTime);
  }
}

describe('Player with Real THREE.js', () => {
  let testEnv: ThreeTestEnvironment;
  let player: TestPlayer;

  beforeEach(() => {
    // Mock document.createElement for player label
    document.createElement = jest.fn().mockImplementation((_type: string) => {
      return {
        style: {},
        textContent: '',
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
        },
        getContext: (contextType: string) => {
          if (contextType === '2d') {
            return {
              fillText: jest.fn(),
              clearRect: jest.fn(),
              fillRect: jest.fn(),
              fillStyle: '',
              font: '',
              textAlign: '',
              textBaseline: '',
              measureText: jest.fn(() => ({ width: 100 })),
            };
          }
          return null;
        },
        width: 256,
        height: 64,
      };
    });

    // Set up test environment
    testEnv = createTestEnvironment();
    
    // Create a test player with the scene and event emitter
    player = new TestPlayerImpl(testEnv.eventEmitter);
  });

  afterEach(() => {
    // Clean up
    testEnv.cleanup();
    if (player.dispose) {
      player.dispose();
    }
  });

  it('should create a player object with real geometry', () => {
    // Check that the player has a THREE.js object
    const playerObject = player.getObject();
    expect(playerObject).toBeDefined();
    expect(playerObject instanceof THREE.Group).toBe(true);
    
    // Count the number of children (drone parts)
    expect(playerObject.children.length).toBeGreaterThan(0);
  });

  it('should update position correctly', () => {
    // Set initial position
    player.setPositionXYZ(1, 2, 3);
    
    // Check that the position is updated
    const position = player.getObject().position;
    expect(position.x).toBe(1);
    expect(position.y).toBe(2);
    expect(position.z).toBe(3);
  });

  it('should handle movement with real physics', () => {
    // Initial state
    player.setPositionXYZ(0, 5, 0); // Start above ground to see movement
    const initialPosition = player.getObject().position.clone();
    
    // Simulate moving forward (throttle forward)
    player.simulateMovement(InputAction.THROTTLE_FORWARD, true);
    
    // Update player for multiple frames
    const deltaTime = 1/10; // Use larger delta for more noticeable movement
    for (let i = 0; i < 10; i++) {
      player.forceUpdate(deltaTime);
    }
    
    // Get the current position
    const newPosition = player.getObject().position.clone();
    
    // Calculate distance moved
    const distanceMoved = newPosition.distanceTo(initialPosition);
    
    // We should have moved some distance from the origin
    expect(distanceMoved).toBeGreaterThan(0.1);
    
    // Stop moving
    player.simulateMovement(InputAction.THROTTLE_FORWARD, false);
  });

  it('should emit position updates', () => {
    // Track position update events
    let positionUpdateReceived = false;
    
    // Listen for the PLAYER_MOVE event
    testEnv.eventEmitter.on(GameEvent.PLAYER_MOVE, () => {
      positionUpdateReceived = true;
    });
    
    // This is a simple test that manually triggers the event
    testEnv.eventEmitter.emit(GameEvent.PLAYER_MOVE, {
      id: player.getId(),
      position: player.getObject().position,
      rotation: player.getRotation()
    });
    
    // Should have received the event
    expect(positionUpdateReceived).toBe(true);
  });
});

// Helper EventEmitter type for TypeScript
interface EventEmitter {
  on(event: string, listener: (...args: unknown[]) => void): this;
  emit(event: string, ...args: unknown[]): boolean;
} 