import { getActionFromKeyCode, InputAction, KeyCode } from '../constants/input';
import { Milliseconds } from '../types';

// Define more specific types for input manager
export type ActionHandler = (action: InputAction) => void;
export type DemoInterval = ReturnType<typeof setInterval>;

export interface InputState {
  activeActions: Set<InputAction>;
  isDemoMode: boolean;
  demoModeActions: InputAction[];
  demoModeIndex: number;
}

export class InputManager {
  private state: InputState;
  private onActionDown: ActionHandler;
  private onActionUp: ActionHandler;
  private demoModeInterval: DemoInterval | null = null;

  constructor(
    onActionDown: ActionHandler,
    onActionUp: ActionHandler,
  ) {
    this.state = {
      activeActions: new Set(),
      isDemoMode: false,
      demoModeActions: [],
      demoModeIndex: 0,
    };
    this.onActionDown = onActionDown;
    this.onActionUp = onActionUp;
  }

  /**
   * Handle key down events
   */
  public handleKeyDown(event: KeyboardEvent): void {
    const action = getActionFromKeyCode(event.code);
    if (action) {
      this.handleActionDown(action);
    }
  }

  /**
   * Handle key up events
   */
  public handleKeyUp(event: KeyboardEvent): void {
    const action = getActionFromKeyCode(event.code);
    if (action) {
      this.handleActionUp(action);
    }
  }

  /**
   * Handle input action activation
   */
  public handleActionDown(action: InputAction): void {
    if (!this.state.activeActions.has(action)) {
      this.state.activeActions.add(action);
      this.onActionDown(action);
    }
  }

  /**
   * Handle input action deactivation
   */
  public handleActionUp(action: InputAction): void {
    if (this.state.activeActions.has(action)) {
      this.state.activeActions.delete(action);
      this.onActionUp(action);
    }
  }

  /**
   * Get current active actions
   */
  public getActiveActions(): Set<InputAction> {
    return this.state.activeActions;
  }

  /**
   * Check if a specific key code is active
   */
  public isKeyActive(keyCode: KeyCode): boolean {
    const action = getActionFromKeyCode(keyCode);
    return action ? this.state.activeActions.has(action) : false;
  }

  /**
   * Enable demo mode with a sequence of actions
   */
  public enableDemoMode(actions: InputAction[], interval: Milliseconds = 1000): void {
    if (this.state.isDemoMode) {
      this.disableDemoMode();
    }

    this.state.isDemoMode = true;
    this.state.demoModeActions = actions;
    this.state.demoModeIndex = 0;

    // Start the demo mode interval
    this.demoModeInterval = globalThis.setInterval(() => {
      if (this.state.demoModeIndex >= this.state.demoModeActions.length) {
        this.state.demoModeIndex = 0;
      }

      const action = this.state.demoModeActions[this.state.demoModeIndex];
      if (action) {
        this.handleActionDown(action);

        // Release the action after a short delay
        setTimeout(() => {
          if (action) {
            this.handleActionUp(action);
          }
        }, interval * 0.8);
      }

      this.state.demoModeIndex++;
    }, interval);
  }

  /**
   * Disable demo mode
   */
  public disableDemoMode(): void {
    if (this.demoModeInterval) {
      clearInterval(this.demoModeInterval);
      this.demoModeInterval = null;
    }

    // Release all active actions
    this.state.activeActions.forEach((action) => {
      this.handleActionUp(action);
    });

    this.state.isDemoMode = false;
    this.state.demoModeActions = [];
    this.state.demoModeIndex = 0;
  }

  /**
   * Check if demo mode is active
   */
  public isDemoModeActive(): boolean {
    return this.state.isDemoMode;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.disableDemoMode();
  }
}
