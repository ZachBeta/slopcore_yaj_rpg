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
      // Test W key
      inputManager.handleKeyDown({ code: 'KeyW' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.MOVE_FORWARD);
      inputManager.handleKeyUp({ code: 'KeyW' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.MOVE_FORWARD);

      // Test A key
      inputManager.handleKeyDown({ code: 'KeyA' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.MOVE_LEFT);
      inputManager.handleKeyUp({ code: 'KeyA' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.MOVE_LEFT);

      // Test S key
      inputManager.handleKeyDown({ code: 'KeyS' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.MOVE_BACKWARD);
      inputManager.handleKeyUp({ code: 'KeyS' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.MOVE_BACKWARD);

      // Test D key
      inputManager.handleKeyDown({ code: 'KeyD' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.MOVE_RIGHT);
      inputManager.handleKeyUp({ code: 'KeyD' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.MOVE_RIGHT);
    });

    it('should handle IJKL look controls correctly', () => {
      // Test I key
      inputManager.handleKeyDown({ code: 'KeyI' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.LOOK_UP);
      inputManager.handleKeyUp({ code: 'KeyI' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.LOOK_UP);

      // Test J key
      inputManager.handleKeyDown({ code: 'KeyJ' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.LOOK_LEFT);
      inputManager.handleKeyUp({ code: 'KeyJ' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.LOOK_LEFT);

      // Test K key
      inputManager.handleKeyDown({ code: 'KeyK' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.LOOK_DOWN);
      inputManager.handleKeyUp({ code: 'KeyK' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.LOOK_DOWN);

      // Test L key
      inputManager.handleKeyDown({ code: 'KeyL' } as KeyboardEvent);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.LOOK_RIGHT);
      inputManager.handleKeyUp({ code: 'KeyL' } as KeyboardEvent);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.LOOK_RIGHT);
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
    it('should maintain correct active actions state', () => {
      // Press multiple keys
      inputManager.handleKeyDown({ code: 'KeyW' } as KeyboardEvent);
      inputManager.handleKeyDown({ code: 'KeyA' } as KeyboardEvent);
      
      const activeActions = inputManager.getActiveActions();
      expect(activeActions.has(InputAction.MOVE_FORWARD)).toBe(true);
      expect(activeActions.has(InputAction.MOVE_LEFT)).toBe(true);
      
      // Release one key
      inputManager.handleKeyUp({ code: 'KeyW' } as KeyboardEvent);
      expect(activeActions.has(InputAction.MOVE_FORWARD)).toBe(false);
      expect(activeActions.has(InputAction.MOVE_LEFT)).toBe(true);
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

    it('should execute demo sequence correctly', () => {
      const demoActions = [
        InputAction.MOVE_FORWARD,
        InputAction.MOVE_LEFT,
        InputAction.JUMP
      ];

      inputManager.enableDemoMode(demoActions, 1000);

      // First action
      expect(onActionDown).toHaveBeenCalledWith(InputAction.MOVE_FORWARD);
      jest.advanceTimersByTime(800);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.MOVE_FORWARD);

      // Second action
      jest.advanceTimersByTime(200);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.MOVE_LEFT);
      jest.advanceTimersByTime(800);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.MOVE_LEFT);

      // Third action
      jest.advanceTimersByTime(200);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.JUMP);
      jest.advanceTimersByTime(800);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.JUMP);
    });

    it('should loop demo sequence', () => {
      const demoActions = [InputAction.MOVE_FORWARD];
      inputManager.enableDemoMode(demoActions, 1000);

      // First iteration
      expect(onActionDown).toHaveBeenCalledWith(InputAction.MOVE_FORWARD);
      jest.advanceTimersByTime(1000);
      expect(onActionUp).toHaveBeenCalledWith(InputAction.MOVE_FORWARD);

      // Second iteration
      jest.advanceTimersByTime(1000);
      expect(onActionDown).toHaveBeenCalledWith(InputAction.MOVE_FORWARD);
    });

    it('should clean up properly when disabled', () => {
      inputManager.enableDemoMode([InputAction.MOVE_FORWARD], 1000);
      inputManager.disableDemoMode();

      const activeActions = inputManager.getActiveActions();
      expect(activeActions.size).toBe(0);
      expect(inputManager.isDemoModeActive()).toBe(false);
    });
  });
}); 