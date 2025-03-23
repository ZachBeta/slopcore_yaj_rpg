import { Player } from '../player';
import { MOVEMENT, GROUND_LEVEL } from '../../constants/directions';
import { InputAction } from '../../constants/input';
import * as THREE from 'three';

describe('Player', () => {
  let player: Player;
  
  beforeEach(() => {
    player = new Player('test-player', true);
    player.setPosition(new THREE.Vector3(0, GROUND_LEVEL, 0));
  });
  
  afterEach(() => {
    player.dispose();
  });
  
  describe('Movement', () => {
    it('should move up when MOVE_UP action is active', () => {
      const inputManager = player.getInputManager();
      const initialPosition = player.getPosition().clone();
      
      // Apply up movement
      inputManager.handleActionDown(InputAction.MOVE_UP);
      player.update(1.0); // 1 second
      
      const position = player.getPosition();
      expect(position.y).toBeGreaterThan(initialPosition.y);
      expect(Math.abs(position.x)).toBeLessThan(0.001); // No sideways movement
      expect(Math.abs(position.z)).toBeLessThan(0.001); // No forward/backward movement
    });
    
    it('should move down when MOVE_DOWN action is active', () => {
      const inputManager = player.getInputManager();
      const initialPosition = player.getPosition().clone();
      initialPosition.y = 5; // Start above ground level
      player.setPosition(initialPosition);
      
      // Apply down movement
      inputManager.handleActionDown(InputAction.MOVE_DOWN);
      player.update(1.0); // 1 second
      
      const position = player.getPosition();
      expect(position.y).toBeLessThan(initialPosition.y);
      expect(Math.abs(position.x)).toBeLessThan(0.001); // No sideways movement
      expect(Math.abs(position.z)).toBeLessThan(0.001); // No forward/backward movement
    });
    
    it('should maintain consistent movement speed', () => {
      const inputManager = player.getInputManager();
      
      // Test upward movement
      {
        player.setPosition(new THREE.Vector3(0, 5, 0));
        const initialPosition = player.getPosition().clone();
        
        inputManager.handleActionDown(InputAction.MOVE_UP);
        player.update(1.0);
        inputManager.handleActionUp(InputAction.MOVE_UP);
        
        const position = player.getPosition();
        const delta = position.y - initialPosition.y;
        expect(Math.abs(delta)).toBeCloseTo(MOVEMENT.DEFAULT_SPEED, 1);
      }
      
      // Test downward movement
      {
        player.setPosition(new THREE.Vector3(0, 10, 0));
        const initialPosition = player.getPosition().clone();
        
        inputManager.handleActionDown(InputAction.MOVE_DOWN);
        player.update(1.0);
        inputManager.handleActionUp(InputAction.MOVE_DOWN);
        
        const position = player.getPosition();
        const delta = initialPosition.y - position.y;
        expect(Math.abs(delta)).toBeCloseTo(MOVEMENT.DEFAULT_SPEED, 1);
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