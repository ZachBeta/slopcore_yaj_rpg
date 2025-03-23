import { Player } from '../player';
import { InputAction } from '../../constants/input';
import { WORLD_DIRECTIONS, MOVEMENT, ROTATION, GROUND_LEVEL } from '../../constants/directions';
import * as THREE from 'three';

describe('Player', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player('test-player', true);
  });

  afterEach(() => {
    player.dispose();
  });

  describe('Movement', () => {
    it('should move forward correctly', () => {
      const inputManager = player.getInputManager();
      inputManager.handleActionDown(InputAction.MOVE_FORWARD);
      
      // Update for 1 second
      player.update(1);
      
      const position = player.getPosition();
      expect(position.z).toBeLessThan(0); // Forward is -Z in world space
      expect(Math.abs(position.x)).toBeLessThan(0.001); // No sideways movement
    });

    it('should move backward correctly', () => {
      const inputManager = player.getInputManager();
      inputManager.handleActionDown(InputAction.MOVE_BACKWARD);
      
      // Update for 1 second
      player.update(1);
      
      const position = player.getPosition();
      expect(position.z).toBeGreaterThan(0); // Backward is +Z in world space
      expect(Math.abs(position.x)).toBeLessThan(0.001); // No sideways movement
    });

    it('should move left correctly', () => {
      const inputManager = player.getInputManager();
      inputManager.handleActionDown(InputAction.MOVE_LEFT);
      
      // Update for 1 second
      player.update(1);
      
      const position = player.getPosition();
      expect(position.x).toBeLessThan(0); // Left is -X in world space
      expect(Math.abs(position.z)).toBeLessThan(0.001); // No forward/backward movement
    });

    it('should move right correctly', () => {
      const inputManager = player.getInputManager();
      inputManager.handleActionDown(InputAction.MOVE_RIGHT);
      
      // Update for 1 second
      player.update(1);
      
      const position = player.getPosition();
      expect(position.x).toBeGreaterThan(0); // Right is +X in world space
      expect(Math.abs(position.z)).toBeLessThan(0.001); // No forward/backward movement
    });

    it('should normalize diagonal movement', () => {
      const inputManager = player.getInputManager();
      inputManager.handleActionDown(InputAction.MOVE_FORWARD);
      inputManager.handleActionDown(InputAction.MOVE_RIGHT);
      
      // Update for 1 second
      player.update(1);
      
      const position = player.getPosition();
      const distance = Math.sqrt(position.x * position.x + position.z * position.z);
      expect(distance).toBeCloseTo(MOVEMENT.DEFAULT_SPEED, 1); // Should move at normal speed
      
      // Verify diagonal movement is normalized
      const expectedComponent = MOVEMENT.DEFAULT_SPEED / Math.sqrt(2);
      expect(Math.abs(position.x)).toBeCloseTo(expectedComponent, 1); // X component
      expect(position.z).toBeCloseTo(-expectedComponent, 1); // Z component
    });

    it('should correctly calculate movement direction and rotation', () => {
      const inputManager = player.getInputManager();
      
      // Test forward movement with no rotation
      inputManager.handleActionDown(InputAction.MOVE_FORWARD);
      player.update(1);
      let position = player.getPosition();
      expect(position.z).toBeLessThan(0); // Forward is -Z
      expect(Math.abs(position.x)).toBeLessThan(0.001); // No sideways movement
      
      // Reset position and rotate 90 degrees right
      player.setPosition(new THREE.Vector3(0, GROUND_LEVEL, 0));
      player.setRotation(new THREE.Euler(0, -Math.PI / 2, 0)); // Negative for right turn
      player.update(1);
      position = player.getPosition();
      expect(position.x).toBeGreaterThan(0); // After 90° right turn, forward becomes +X
      expect(Math.abs(position.z)).toBeLessThan(0.001); // No forward/backward movement
      
      // Reset position and test diagonal movement
      player.setPosition(new THREE.Vector3(0, GROUND_LEVEL, 0));
      player.setRotation(new THREE.Euler(0, 0, 0));
      inputManager.handleActionUp(InputAction.MOVE_FORWARD);
      inputManager.handleActionDown(InputAction.MOVE_RIGHT);
      player.update(1);
      position = player.getPosition();
      expect(position.x).toBeGreaterThan(0); // Right is +X
      expect(Math.abs(position.z)).toBeLessThan(0.001); // No forward/backward movement
    });

    it('should maintain consistent movement speed in all directions', () => {
      const inputManager = player.getInputManager();
      const directions = [
        { action: InputAction.MOVE_FORWARD, expectedX: 0, expectedZ: -MOVEMENT.DEFAULT_SPEED },
        { action: InputAction.MOVE_BACKWARD, expectedX: 0, expectedZ: MOVEMENT.DEFAULT_SPEED },
        { action: InputAction.MOVE_LEFT, expectedX: -MOVEMENT.DEFAULT_SPEED, expectedZ: 0 },
        { action: InputAction.MOVE_RIGHT, expectedX: MOVEMENT.DEFAULT_SPEED, expectedZ: 0 }
      ];

      for (const dir of directions) {
        // Reset position and rotation
        player.setPosition(new THREE.Vector3(0, GROUND_LEVEL, 0));
        player.setRotation(new THREE.Euler(0, 0, 0));
        
        // Apply movement
        inputManager.handleActionDown(dir.action);
        player.update(1);
        
        const position = player.getPosition();
        expect(position.x).toBeCloseTo(dir.expectedX, 1);
        expect(position.z).toBeCloseTo(dir.expectedZ, 1);
        
        // Clean up
        inputManager.handleActionUp(dir.action);
      }
    });
  });

  describe('Rotation', () => {
    it('should look up correctly', () => {
      const inputManager = player.getInputManager();
      const initialRotation = player.getRotation().x;
      inputManager.handleActionDown(InputAction.LOOK_UP);
      
      // Update for 1 second
      player.update(1);
      
      const rotation = player.getRotation();
      expect(rotation.x).toBeLessThan(initialRotation); // Looking up decreases pitch
    });

    it('should look down correctly', () => {
      const inputManager = player.getInputManager();
      const initialRotation = player.getRotation().x;
      inputManager.handleActionDown(InputAction.LOOK_DOWN);
      
      // Update for 1 second
      player.update(1);
      
      const rotation = player.getRotation();
      expect(rotation.x).toBeGreaterThan(initialRotation); // Looking down increases pitch
    });

    it('should look left correctly', () => {
      const inputManager = player.getInputManager();
      const initialRotation = player.getRotation().y;
      inputManager.handleActionDown(InputAction.LOOK_LEFT);
      
      // Update for 1 second
      player.update(1);
      
      const rotation = player.getRotation();
      expect(rotation.y).toBeGreaterThan(initialRotation); // Looking left increases yaw
    });

    it('should look right correctly', () => {
      const inputManager = player.getInputManager();
      const initialRotation = player.getRotation().y;
      inputManager.handleActionDown(InputAction.LOOK_RIGHT);
      
      // Update for 1 second
      player.update(1);
      
      const rotation = player.getRotation();
      expect(rotation.y).toBeLessThan(initialRotation); // Looking right decreases yaw
    });

    it('should limit up/down look angles', () => {
      const inputManager = player.getInputManager();
      
      // Look up for a long time
      inputManager.handleActionDown(InputAction.LOOK_UP);
      for (let i = 0; i < 10; i++) {
        player.update(1);
      }
      
      let rotation = player.getRotation();
      expect(rotation.x).toBeGreaterThanOrEqual(ROTATION.MIN_PITCH); // Max up angle
      
      // Look down for a long time
      inputManager.handleActionUp(InputAction.LOOK_UP);
      inputManager.handleActionDown(InputAction.LOOK_DOWN);
      for (let i = 0; i < 10; i++) {
        player.update(1);
      }
      
      rotation = player.getRotation();
      expect(rotation.x).toBeLessThanOrEqual(ROTATION.MAX_PITCH); // Max down angle
    });
  });

  describe('Jumping', () => {
    it('should jump when grounded', () => {
      const inputManager = player.getInputManager();
      
      // Ensure player is grounded
      player.setPosition(new THREE.Vector3(0, GROUND_LEVEL, 0));
      player.update(0.016); // One frame at 60fps
      
      // Jump
      inputManager.handleActionDown(InputAction.JUMP);
      player.update(0.016);
      
      const position = player.getPosition();
      expect(position.y).toBeGreaterThan(GROUND_LEVEL); // Should move up
    });

    it('should not jump when not grounded', () => {
      const inputManager = player.getInputManager();
      
      // First jump
      inputManager.handleActionDown(InputAction.JUMP);
      player.update(0.016);
      const initialHeight = player.getPosition().y;
      
      // Try to jump again while in air
      inputManager.handleActionDown(InputAction.JUMP);
      player.update(0.016);
      
      const position = player.getPosition();
      expect(position.y - initialHeight).toBeLessThan(0.5); // Should not gain significant height
    });
  });

  describe('Gravity', () => {
    it('should apply gravity when not grounded', () => {
      // Start in air
      player.setPosition(new THREE.Vector3(0, 3, 0));
      const initialHeight = player.getPosition().y;
      
      // Update for one frame
      player.update(0.016); // One frame at 60fps
      
      const position = player.getPosition();
      expect(position.y).toBeLessThan(initialHeight); // Should fall down
    });

    it('should stop at ground level', () => {
      // Start in air
      player.setPosition(new THREE.Vector3(0, 3, 0));
      
      // Update until ground is hit
      for (let i = 0; i < 60; i++) { // 1 second at 60fps
        player.update(0.016);
      }
      
      const position = player.getPosition();
      expect(position.y).toBe(GROUND_LEVEL); // Should stop exactly at ground level
    });
  });
}); 