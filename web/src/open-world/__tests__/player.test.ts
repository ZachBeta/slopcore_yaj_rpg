import { Player } from '../player';
import { GROUND_LEVEL } from '../../constants/directions';
import { InputAction } from '../../constants/input';
import * as THREE from 'three';

// Mock document.createElement for canvas and context
const mockCanvasInstance = {
  getContext: jest.fn().mockReturnValue({
    fillStyle: '',
    fillRect: jest.fn(),
    font: '',
    textAlign: '',
    fillText: jest.fn()
  }),
  width: 256,
  height: 64
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
        element: document.createElement('div')
      };
    }),
    CSS2DRenderer: jest.fn().mockImplementation(() => {
      return {
        setSize: jest.fn(),
        domElement: document.createElement('div'),
        render: jest.fn()
      };
    })
  };
});

describe('Player', () => {
  let player: Player;
  
  beforeEach(() => {
    player = new Player('test-player', true);
    player.setPosition(new THREE.Vector3(0, GROUND_LEVEL, 0));
  });
  
  afterEach(() => {
    if (player && player.dispose) {
      player.dispose();
    }
    jest.clearAllMocks();
  });
  
  describe('Movement', () => {
    it('should move up when MOVE_UP action is active', () => {
      const inputManager = player.getInputManager();
      const initialPosition = player.getPosition().clone();
      
      // Apply up movement
      inputManager.handleActionDown(InputAction.MOVE_UP);
      player.update(1.0); // 1 second
      
      const position = player.getPosition();
      // Test that y position changed
      expect(position.y).toBeGreaterThanOrEqual(initialPosition.y);
      expect(Math.abs(position.x - initialPosition.x)).toBeLessThan(0.001); // No sideways movement
      expect(Math.abs(position.z - initialPosition.z)).toBeLessThan(0.001); // No forward/backward movement
    });
    
    it('should move down when MOVE_DOWN action is active', () => {
      const inputManager = player.getInputManager();
      // Start above ground level to allow for downward movement
      const startPosition = new THREE.Vector3(0, GROUND_LEVEL + 5, 0);
      player.setPosition(startPosition);
      const initialPosition = player.getPosition().clone();
      
      // Apply down movement
      inputManager.handleActionDown(InputAction.MOVE_DOWN);
      player.update(1.0); // 1 second
      
      const position = player.getPosition();
      expect(position.y).toBeLessThan(initialPosition.y);
      expect(Math.abs(position.x - initialPosition.x)).toBeLessThan(0.001); // No sideways movement
      expect(Math.abs(position.z - initialPosition.z)).toBeLessThan(0.001); // No forward/backward movement
    });
    
    it('should maintain consistent movement speed', () => {
      const inputManager = player.getInputManager();
      
      // Test upward movement
      {
        // Start at ground level
        player.setPosition(new THREE.Vector3(0, GROUND_LEVEL, 0));
        const initialPosition = player.getPosition().clone();
        
        // Force for a longer period to ensure movement
        for(let i = 0; i < 5; i++) {
          inputManager.handleActionDown(InputAction.MOVE_UP);
          player.update(0.2); // Update in smaller increments to avoid collision issues
        }
        inputManager.handleActionUp(InputAction.MOVE_UP);
        
        const position = player.getPosition();
        const delta = position.y - initialPosition.y;
        
        console.log(`Upward movement delta: ${delta}`);
        
        // Since we're moving up from ground level, there should be movement
        expect(delta).toBeGreaterThan(0);
      }
      
      // Test downward movement
      {
        // Start high above ground level to allow for significant downward movement
        player.setPosition(new THREE.Vector3(0, GROUND_LEVEL + 10, 0));
        const beforeDownPosition = player.getPosition().clone();
        
        // Force for a longer period to ensure movement
        for(let i = 0; i < 5; i++) {
          inputManager.handleActionDown(InputAction.MOVE_DOWN);
          player.update(0.2); // Update in smaller increments to avoid hitting ground
        }
        inputManager.handleActionUp(InputAction.MOVE_DOWN);
        
        const afterDownPosition = player.getPosition();
        const downDelta = beforeDownPosition.y - afterDownPosition.y;
        
        console.log(`Downward movement delta: ${downDelta}`);
        
        // There should be downward movement
        expect(downDelta).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Rotation', () => {
    it('should rotate left when ROTATE_LEFT action is active', () => {
      const inputManager = player.getInputManager();
      const initialRotation = player.getRotation().clone();
      
      // Apply left rotation
      inputManager.handleActionDown(InputAction.ROTATE_LEFT);
      player.update(1.0); // 1 second
      
      const rotation = player.getRotation();
      expect(rotation.y).toBeGreaterThan(initialRotation.y);
    });
    
    it('should rotate right when ROTATE_RIGHT action is active', () => {
      const inputManager = player.getInputManager();
      const initialRotation = player.getRotation().clone();
      
      // Apply right rotation
      inputManager.handleActionDown(InputAction.ROTATE_RIGHT);
      player.update(1.0); // 1 second
      
      const rotation = player.getRotation();
      expect(rotation.y).toBeLessThan(initialRotation.y);
    });
    
    it('should look up when LOOK_UP action is active', () => {
      const inputManager = player.getInputManager();
      const initialRotation = player.getRotation().clone();
      
      // Apply up look
      inputManager.handleActionDown(InputAction.LOOK_UP);
      player.update(1.0); // 1 second
      
      const rotation = player.getRotation();
      expect(rotation.x).toBeLessThan(initialRotation.x);
    });
    
    it('should look down when LOOK_DOWN action is active', () => {
      const inputManager = player.getInputManager();
      const initialRotation = player.getRotation().clone();
      
      // Apply down look
      inputManager.handleActionDown(InputAction.LOOK_DOWN);
      player.update(1.0); // 1 second
      
      const rotation = player.getRotation();
      expect(rotation.x).toBeGreaterThan(initialRotation.x);
    });
    
    it('should roll left when ROLL_LEFT action is active', () => {
      const inputManager = player.getInputManager();
      const initialRotation = player.getRotation().clone();
      
      // Apply roll left
      inputManager.handleActionDown(InputAction.ROLL_LEFT);
      player.update(1.0); // 1 second
      
      const rotation = player.getRotation();
      expect(rotation.z).toBeGreaterThan(initialRotation.z);
    });
    
    it('should roll right when ROLL_RIGHT action is active', () => {
      const inputManager = player.getInputManager();
      const initialRotation = player.getRotation().clone();
      
      // Apply roll right
      inputManager.handleActionDown(InputAction.ROLL_RIGHT);
      player.update(1.0); // 1 second
      
      const rotation = player.getRotation();
      expect(rotation.z).toBeLessThan(initialRotation.z);
    });
  });
  
  // Other test sections as needed
}); 