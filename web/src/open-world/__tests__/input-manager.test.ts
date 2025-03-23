import { InputManager } from '../input-manager';
import { InputAction } from '../../constants/input';

describe('InputManager', () => {
  let inputManager: InputManager;
  let onActionDown: jest.Mock;
  let onActionUp: jest.Mock;

  beforeEach(() => {
    onActionDown = jest.fn();
    onActionUp = jest.fn();
    inputManager = new InputManager(onActionDown, onActionUp);
  });

  afterEach(() => {
    inputManager.dispose();
  });

  describe('Key Event Handling', () => {
    it('should handle WASD movement keys correctly', () => {
      // Test W key (move up)
      inputManager.handleKeyDown({ code: 'KeyW' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.MOVE_UP);
      inputManager.handleKeyUp({ code: 'KeyW' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.MOVE_UP);
      
      // Test A key (rotate left)
      inputManager.handleKeyDown({ code: 'KeyA' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.ROTATE_LEFT);
      inputManager.handleKeyUp({ code: 'KeyA' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.ROTATE_LEFT);
      
      // Test S key (move down)
      inputManager.handleKeyDown({ code: 'KeyS' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.MOVE_DOWN);
      inputManager.handleKeyUp({ code: 'KeyS' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.MOVE_DOWN);
      
      // Test D key (rotate right)
      inputManager.handleKeyDown({ code: 'KeyD' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.ROTATE_RIGHT);
      inputManager.handleKeyUp({ code: 'KeyD' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.ROTATE_RIGHT);
    });

    it('should handle IJKL look controls correctly', () => {
      // Test I key (pitch up)
      inputManager.handleKeyDown({ code: 'KeyI' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.LOOK_UP);
      inputManager.handleKeyUp({ code: 'KeyI' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.LOOK_UP);
      
      // Test J key (roll left)
      inputManager.handleKeyDown({ code: 'KeyJ' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.ROLL_LEFT);
      inputManager.handleKeyUp({ code: 'KeyJ' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.ROLL_LEFT);
      
      // Test K key (pitch down)
      inputManager.handleKeyDown({ code: 'KeyK' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.LOOK_DOWN);
      inputManager.handleKeyUp({ code: 'KeyK' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.LOOK_DOWN);
      
      // Test L key (roll right)
      inputManager.handleKeyDown({ code: 'KeyL' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.ROLL_RIGHT);
      inputManager.handleKeyUp({ code: 'KeyL' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.ROLL_RIGHT);
    });

    it('should handle space key correctly', () => {
      inputManager.handleKeyDown({ code: 'Space' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.JUMP);
      inputManager.handleKeyUp({ code: 'Space' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.JUMP);
    });

    it('should not trigger actions for unmapped keys', () => {
      inputManager.handleKeyDown({ code: 'KeyQ' } as KeyboardEvent);
      expect(onActionDown).not.toHaveBeenCalled();
      inputManager.handleKeyUp({ code: 'KeyQ' } as KeyboardEvent);
      expect(onActionUp).not.toHaveBeenCalled();
    });
  });

  describe('Action State Management', () => {
    it('should track active actions', () => {
      // Activate multiple actions
      inputManager.handleKeyDown({ code: 'KeyW' } as KeyboardEvent);
      inputManager.handleKeyDown({ code: 'KeyA' } as KeyboardEvent);
      
      // Get active actions
      const activeActions = inputManager.getActiveActions();
      expect(activeActions.size).toBe(2);
      expect(activeActions.has(InputAction.MOVE_UP)).toBe(true);
      expect(activeActions.has(InputAction.ROTATE_LEFT)).toBe(true);
      
      // Release one action
      inputManager.handleKeyUp({ code: 'KeyW' } as KeyboardEvent);
      
      // Check updated active actions
      const updatedActions = inputManager.getActiveActions();
      expect(updatedActions.size).toBe(1);
      expect(updatedActions.has(InputAction.MOVE_UP)).toBe(false);
      expect(updatedActions.has(InputAction.ROTATE_LEFT)).toBe(true);
    });

    it('should not duplicate active actions', () => {
      inputManager.handleKeyDown({ code: 'KeyW' } as KeyboardEvent);
      inputManager.handleKeyDown({ code: 'KeyW' } as KeyboardEvent);
      
      const activeActions = inputManager.getActiveActions();
      expect(activeActions.size).toBe(1);
    });
  });

  describe('Demo Mode', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should enable demo mode with the specified actions', () => {
      const actions = [
        InputAction.MOVE_UP,
        InputAction.ROTATE_LEFT
      ];
      
      inputManager.enableDemoMode(actions, 1000);
      
      expect(inputManager.isDemoModeActive()).toBe(true);
      
      // Let the first action be triggered
      jest.advanceTimersByTime(1000);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.MOVE_UP);
      jest.advanceTimersByTime(800);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.MOVE_UP);
      
      // Let the second action be triggered
      jest.advanceTimersByTime(200);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.ROTATE_LEFT);
      jest.advanceTimersByTime(800);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.ROTATE_LEFT);
      
      // Loop back to the first action
      jest.advanceTimersByTime(200);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.MOVE_UP);
    });

    it('should disable demo mode', () => {
      const demoActions = [InputAction.MOVE_UP];
      inputManager.enableDemoMode(demoActions, 100);
      
      // Let the action be triggered
      jest.advanceTimersByTime(100);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.MOVE_UP);
      
      // Disable demo mode
      inputManager.disableDemoMode();
      
      expect(inputManager.isDemoModeActive()).toBe(false);
    });

    it('should clean up resources when disposed', () => {
      inputManager.enableDemoMode([InputAction.MOVE_UP], 1000);
      expect(inputManager.isDemoModeActive()).toBe(true);
      
      inputManager.dispose();
      
      expect(inputManager.isDemoModeActive()).toBe(false);
    });
  });
}); 