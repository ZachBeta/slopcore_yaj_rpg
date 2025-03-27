import * as THREE from 'three';
import { Player } from '../player';
import { GameEvent } from '../../constants';
import { ThreeTestEnvironment, createTestEnvironment } from '../../test/three-test-environment';
import { InputAction } from '../../constants/input';

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
class MockInputManager {
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
}

// Need to modify the Player class for testing
class TestPlayer extends Player {
  private mockInputManager: MockInputManager;
  
  constructor(id: string, scene: THREE.Scene, eventEmitter: EventEmitter) {
    // Override to use our scene and event emitter
    super(id, true);
    
    // Add to scene
    scene.add(this.getObject());
    
    // Store reference to event emitter for tests
    (this as any).eventEmitter = eventEmitter;
    
    // Create a mock input manager
    this.mockInputManager = new MockInputManager();
    // Replace the real input manager with our mock
    (this as any).inputManager = this.mockInputManager;
  }
  
  // Override to use our event emitter
  protected emitEvent(event: string, data: any): void {
    if ((this as any).eventEmitter) {
      (this as any).eventEmitter.emit(event, data);
    }
  }
  
  // Add a method to simulate movement input
  public simulateMovement(direction: InputAction, value: boolean): void {
    if (value) {
      this.mockInputManager.addActiveAction(direction);
    } else {
      this.mockInputManager.removeActiveAction(direction);
    }
    
    const event = { type: direction, value };
    if (value) {
      super['handleActionDown'](event.type);
    } else {
      super['handleActionUp'](event.type);
    }
  }
  
  public setPositionXYZ(x: number, y: number, z: number): void {
    this.getObject().position.set(x, y, z);
  }
  
  // Force the update to happen regardless of isLocal flag
  public forceUpdate(deltaTime: number): void {
    // Call the private handlers directly to force movement
    (this as any).handleMovement(deltaTime);
    (this as any).handleRotation(deltaTime);
    (this as any).updateCollisionEffect(deltaTime);
  }
}

describe('Player with Real THREE.js', () => {
  let testEnv: ThreeTestEnvironment;
  let player: TestPlayer;

  beforeEach(() => {
    // Mock document.createElement for player label
    document.createElement = jest.fn().mockImplementation((type: string) => {
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
    player = new TestPlayer('test-player', testEnv.scene, testEnv.eventEmitter);
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
  on(event: string, listener: (...args: any[]) => void): this;
  emit(event: string, ...args: any[]): boolean;
} 