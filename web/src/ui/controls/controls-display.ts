import { InputManager } from '../../open-world/input-manager';
import { JoystickConfig, JoystickDisplay } from './joystick-display';

export class ControlsDisplay {
  private container: HTMLElement;
  private joysticks: JoystickDisplay[] = [];
  private animationFrameId: number | null = null;

  /**
   * Creates a controls display container with joystick displays
   */
  constructor(
    private parentElement: HTMLElement,
    private inputManager: InputManager,
  ) {
    this.container = this.createContainer();
    parentElement.appendChild(this.container);
  }

  /**
   * Add a joystick to the controls display
   */
  public addJoystick(id: string, config: JoystickConfig): JoystickDisplay {
    const joystick = new JoystickDisplay(id, config, this.inputManager);
    this.joysticks.push(joystick);
    this.container.appendChild(joystick.getElement());
    return joystick;
  }

  /**
   * Start the animation loop to update the joystick displays
   */
  public start(): void {
    if (this.animationFrameId) return;

    const updateLoop = (): void => {
      // Update all joysticks
      this.joysticks.forEach((joystick) => joystick.update());

      // Request next frame
      this.animationFrameId = requestAnimationFrame(updateLoop);
    };

    updateLoop();
  }

  /**
   * Stop the animation loop
   */
  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.stop();

    // Remove the container from its parent
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }

  /**
   * Create the main container for the controls display
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.bottom = '20px';
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.display = 'flex';
    container.style.gap = '40px';
    container.style.zIndex = '100';
    return container;
  }
}
