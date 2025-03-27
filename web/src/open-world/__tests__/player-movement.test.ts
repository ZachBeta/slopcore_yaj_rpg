import { Player } from '../player';
import { GROUND_LEVEL } from '../../constants/directions';
import { InputAction } from '../../constants/input';
import * as THREE from 'three';
import { InputManager } from '../input-manager';
import { silenceConsole, type ConsoleSilencer } from '../../test/test-utils';

// Mock document.createElement for canvas and context
const mockCanvasInstance = {
  getContext: jest.fn().mockReturnValue({
    fillStyle: '',
    fillRect: jest.fn(),
    font: '',
    textAlign: '',
    fillText: jest.fn(),
  }),
  width: 256,
  height: 64,
};

// Properly typed mock for document.createElement
const originalCreateElement = document.createElement;
document.createElement = jest.fn().mockImplementation((type: string) => {
  if (type === 'canvas') {
    return mockCanvasInstance as unknown as HTMLCanvasElement;
  }
  // For other elements, create actual DOM elements
  return originalCreateElement.call(document, type);
});

// Mock Three.js components that interact with the DOM
jest.mock('three/examples/jsm/renderers/CSS2DRenderer', () => {
  return {
    CSS2DObject: jest.fn().mockImplementation(() => {
      return {
        position: { set: jest.fn() },
        element: document.createElement('div'),
      };
    }),
    CSS2DRenderer: jest.fn().mockImplementation(() => {
      return {
        setSize: jest.fn(),
        domElement: document.createElement('div'),
        render: jest.fn(),
      };
    }),
  };
});

describe('Player Movement with Orientation', () => {
  let player: Player;
  let consoleControl: ConsoleSilencer;

  beforeEach(() => {
    consoleControl = silenceConsole();
    player = new Player('test-player', true);
    // Start player well above ground to avoid ground collision affecting tests
    player.setPosition(new THREE.Vector3(0, GROUND_LEVEL + 20, 0));
  });

  afterEach(() => {
    consoleControl.restore();
    if (player && player.dispose) {
      player.dispose();
    }
    jest.clearAllMocks();
  });

  describe('Basic Movement Tests', () => {
    it('should handle upward movement', () => {
      const inputManager = player.getInputManager();
      const initialPosition = player.getPosition().clone();
      
      inputManager.handleActionDown(InputAction.MOVE_UP);
      player.update(0.5);
      inputManager.handleActionUp(InputAction.MOVE_UP);
      
      const finalPosition = player.getPosition();
      
      // Position should have changed
      expect(finalPosition).not.toEqual(initialPosition);
    });
    
    it('should handle downward movement', () => {
      const inputManager = player.getInputManager();
      const initialPosition = player.getPosition().clone();
      
      inputManager.handleActionDown(InputAction.MOVE_DOWN);
      player.update(0.5);
      inputManager.handleActionUp(InputAction.MOVE_DOWN);
      
      const finalPosition = player.getPosition();
      
      // Position should have changed
      expect(finalPosition).not.toEqual(initialPosition);
    });
    
    it('should handle forward movement', () => {
      const inputManager = player.getInputManager();
      const initialPosition = player.getPosition().clone();
      
      inputManager.handleActionDown(InputAction.THROTTLE_FORWARD);
      player.update(0.5);
      inputManager.handleActionUp(InputAction.THROTTLE_FORWARD);
      
      const finalPosition = player.getPosition();
      
      // Position should have changed
      expect(finalPosition).not.toEqual(initialPosition);
    });
    
    it('should handle backward movement', () => {
      const inputManager = player.getInputManager();
      const initialPosition = player.getPosition().clone();
      
      inputManager.handleActionDown(InputAction.THROTTLE_BACKWARD);
      player.update(0.5);
      inputManager.handleActionUp(InputAction.THROTTLE_BACKWARD);
      
      const finalPosition = player.getPosition();
      
      // Position should have changed
      expect(finalPosition).not.toEqual(initialPosition);
    });
  });

  describe('Rotation Tests', () => {
    it('should handle yaw rotation', () => {
      const inputManager = player.getInputManager();
      const initialRotation = player.getRotation().clone();
      
      // Test left rotation
      inputManager.handleActionDown(InputAction.ROTATE_LEFT);
      player.update(0.5);
      inputManager.handleActionUp(InputAction.ROTATE_LEFT);
      
      const afterRotation = player.getRotation();
      
      // Rotation should have changed
      expect(afterRotation.y).not.toEqual(initialRotation.y);
    });
    
    it('should handle pitch rotation', () => {
      const inputManager = player.getInputManager();
      const initialRotation = player.getRotation().clone();
      
      // Test pitch
      inputManager.handleActionDown(InputAction.LOOK_UP);
      player.update(0.5);
      inputManager.handleActionUp(InputAction.LOOK_UP);
      
      const afterRotation = player.getRotation();
      
      // Rotation should have changed
      expect(afterRotation.x).not.toEqual(initialRotation.x);
    });
    
    it('should handle roll rotation', () => {
      const inputManager = player.getInputManager();
      const initialRotation = player.getRotation().clone();
      
      // Test roll
      inputManager.handleActionDown(InputAction.ROLL_LEFT);
      player.update(0.5);
      inputManager.handleActionUp(InputAction.ROLL_LEFT);
      
      const afterRotation = player.getRotation();
      
      // Rotation should have changed
      expect(afterRotation.z).not.toEqual(initialRotation.z);
    });
  });

  describe('Combined Movement Tests', () => {
    it('should handle movement sequence', () => {
      const inputManager = player.getInputManager();
      const initialPosition = player.getPosition().clone();
      
      // Apply a sequence of movements
      inputManager.handleActionDown(InputAction.MOVE_UP);
      player.update(0.2);
      inputManager.handleActionUp(InputAction.MOVE_UP);
      
      inputManager.handleActionDown(InputAction.THROTTLE_FORWARD);
      player.update(0.2);
      inputManager.handleActionUp(InputAction.THROTTLE_FORWARD);
      
      inputManager.handleActionDown(InputAction.ROTATE_LEFT);
      player.update(0.2);
      inputManager.handleActionUp(InputAction.ROTATE_LEFT);
      
      inputManager.handleActionDown(InputAction.MOVE_DOWN);
      player.update(0.2);
      inputManager.handleActionUp(InputAction.MOVE_DOWN);
      
      const finalPosition = player.getPosition();
      
      // Position should have changed significantly
      expect(finalPosition).not.toEqual(initialPosition);
    });
  });
});
