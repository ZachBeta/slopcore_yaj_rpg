import { InputManager } from '../../open-world/input-manager';

export interface JoystickConfig {
  title: string;
  axes: {
    vertical: { up: string; down: string };
    horizontal: { left: string; right: string };
  };
  labels: Array<{ key: string; label: string; position: 'top' | 'bottom' | 'left' | 'right' }>;
  throttle?: { 
    key: string; 
    upKey: string; 
    downKey: string; 
    upLabel: string; 
    downLabel: string;
  };
}

export class JoystickDisplay {
  private container: HTMLElement;
  private joystickDot: HTMLElement;
  private controlElements: Map<string, HTMLElement> = new Map();
  private throttleIndicator: HTMLElement | null = null;
  private throttleConfig: JoystickConfig['throttle'] | null = null;
  private joystickId: string;
  private inputManager: InputManager;

  /**
   * Create a joystick display for visualizing control inputs
   */
  constructor(
    containerId: string,
    private config: JoystickConfig,
    inputManager: InputManager
  ) {
    this.joystickId = `joystick_${containerId}`;
    this.inputManager = inputManager;
    
    // Create the joystick container
    this.container = this.createJoystickContainer();
    this.joystickDot = this.createJoystickDot();
    
    // Add the joystick labels and controls
    this.setupJoystickControls();
    
    // Add throttle if configured
    if (config.throttle) {
      this.throttleConfig = config.throttle;
      this.addThrottleControl(config.throttle);
    }
  }
  
  /**
   * Get the rendered joystick element
   */
  public getElement(): HTMLElement {
    return this.container;
  }
  
  /**
   * Update the joystick position based on current input
   */
  public update(): void {
    this.updateJoystickPosition();
    if (this.throttleConfig) {
      this.updateThrottlePosition();
    }
  }
  
  /**
   * Highlight a specific key on the joystick
   */
  public highlightKey(keyCode: string, isActive: boolean): void {
    const element = this.controlElements.get(keyCode);
    if (element) {
      if (isActive) {
        element.style.backgroundColor = 'rgba(0, 200, 100, 0.8)';
        element.style.boxShadow = '0 0 10px rgba(0, 255, 100, 0.7)';
        element.style.transform = element.style.transform.includes('translate') 
          ? element.style.transform.replace('scale(1)', 'scale(1.1)') 
          : element.style.transform + ' scale(1.1)';
      } else {
        element.style.backgroundColor = 'rgba(40, 40, 40, 0.7)';
        element.style.boxShadow = 'none';
        element.style.transform = element.style.transform.replace(' scale(1.1)', '');
      }
    }
  }
  
  /**
   * Create the main joystick container element
   */
  private createJoystickContainer(): HTMLElement {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    container.style.borderRadius = '10px';
    container.style.padding = '15px';
    container.style.position = 'relative';
    
    // Add title
    const title = document.createElement('div');
    title.textContent = this.config.title;
    title.style.color = 'white';
    title.style.fontFamily = 'monospace';
    title.style.marginBottom = '10px';
    title.style.fontSize = '14px';
    title.style.fontWeight = 'bold';
    container.appendChild(title);
    
    return container;
  }
  
  /**
   * Create the joystick dot (handle) element
   */
  private createJoystickDot(): HTMLElement {
    const stickArea = document.createElement('div');
    stickArea.style.width = '120px';
    stickArea.style.height = '120px';
    stickArea.style.borderRadius = '50%';
    stickArea.style.backgroundColor = 'rgba(40, 40, 40, 0.7)';
    stickArea.style.border = '1px solid rgba(100, 100, 100, 0.5)';
    stickArea.style.position = 'relative';
    stickArea.style.display = 'flex';
    stickArea.style.justifyContent = 'center';
    stickArea.style.alignItems = 'center';
    
    // Add crosshair to the joystick
    const horizontalLine = document.createElement('div');
    horizontalLine.style.position = 'absolute';
    horizontalLine.style.width = '100%';
    horizontalLine.style.height = '1px';
    horizontalLine.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    
    const verticalLine = document.createElement('div');
    verticalLine.style.position = 'absolute';
    verticalLine.style.width = '1px';
    verticalLine.style.height = '100%';
    verticalLine.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    
    stickArea.appendChild(horizontalLine);
    stickArea.appendChild(verticalLine);
    
    // Add joystick handle/dot
    const joystickDot = document.createElement('div');
    joystickDot.style.width = '20px';
    joystickDot.style.height = '20px';
    joystickDot.style.borderRadius = '50%';
    joystickDot.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    joystickDot.style.border = '1px solid rgba(200, 200, 200, 0.9)';
    joystickDot.style.position = 'absolute';
    joystickDot.style.top = '50%';
    joystickDot.style.left = '50%';
    joystickDot.style.transform = 'translate(-50%, -50%)';
    joystickDot.style.transition = 'all 0.1s ease-out';
    
    stickArea.appendChild(joystickDot);
    this.container.appendChild(stickArea);
    
    return joystickDot;
  }
  
  /**
   * Set up the joystick controls and labels
   */
  private setupJoystickControls(): void {
    // Get the stick area (parent of the joystick dot)
    const stickArea = this.joystickDot.parentElement as HTMLElement;
    
    // Add control labels around the joystick
    this.config.labels.forEach(({ key, label, position }) => {
      const labelElement = document.createElement('div');
      labelElement.textContent = label;
      labelElement.style.position = 'absolute';
      labelElement.style.fontFamily = 'monospace';
      labelElement.style.fontSize = '16px';
      labelElement.style.fontWeight = 'bold';
      labelElement.style.color = 'white';
      labelElement.style.width = '24px';
      labelElement.style.height = '24px';
      labelElement.style.textAlign = 'center';
      labelElement.style.lineHeight = '24px';
      labelElement.style.borderRadius = '3px';
      labelElement.style.backgroundColor = 'rgba(40, 40, 40, 0.7)';
      
      switch (position) {
        case 'top':
          labelElement.style.top = '-30px';
          labelElement.style.left = '50%';
          labelElement.style.transform = 'translateX(-50%)';
          break;
        case 'bottom':
          labelElement.style.bottom = '-30px';
          labelElement.style.left = '50%';
          labelElement.style.transform = 'translateX(-50%)';
          break;
        case 'left':
          labelElement.style.left = '-30px';
          labelElement.style.top = '50%';
          labelElement.style.transform = 'translateY(-50%)';
          break;
        case 'right':
          labelElement.style.right = '-30px';
          labelElement.style.top = '50%';
          labelElement.style.transform = 'translateY(-50%)';
          break;
      }
      
      stickArea.appendChild(labelElement);
      
      // Store reference for key highlighting
      this.controlElements.set(key, labelElement);
    });
  }
  
  /**
   * Add throttle control to the joystick
   */
  private addThrottleControl(throttle: NonNullable<JoystickConfig['throttle']>): void {
    const throttleContainer = document.createElement('div');
    throttleContainer.style.display = 'flex';
    throttleContainer.style.flexDirection = 'column';
    throttleContainer.style.alignItems = 'center';
    throttleContainer.style.marginTop = '20px';
    
    // Throttle title
    const throttleTitle = document.createElement('div');
    throttleTitle.textContent = 'Throttle';
    throttleTitle.style.color = 'white';
    throttleTitle.style.fontFamily = 'monospace';
    throttleTitle.style.fontSize = '12px';
    throttleTitle.style.marginBottom = '5px';
    throttleContainer.appendChild(throttleTitle);
    
    // Throttle bar
    const throttleBar = document.createElement('div');
    throttleBar.style.width = '20px';
    throttleBar.style.height = '60px';
    throttleBar.style.backgroundColor = 'rgba(40, 40, 40, 0.7)';
    throttleBar.style.border = '1px solid rgba(100, 100, 100, 0.5)';
    throttleBar.style.borderRadius = '10px';
    throttleBar.style.position = 'relative';
    
    // Throttle indicator
    const throttleIndicator = document.createElement('div');
    throttleIndicator.style.width = '18px';
    throttleIndicator.style.height = '10px';
    throttleIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    throttleIndicator.style.borderRadius = '5px';
    throttleIndicator.style.position = 'absolute';
    throttleIndicator.style.left = '1px';
    throttleIndicator.style.top = '50%';
    throttleIndicator.style.transform = 'translateY(-50%)';
    throttleIndicator.style.transition = 'top 0.1s ease-out';
    
    throttleBar.appendChild(throttleIndicator);
    this.throttleIndicator = throttleIndicator;
    
    // Add up/down throttle labels
    const upLabel = document.createElement('div');
    upLabel.textContent = throttle.upLabel;
    upLabel.style.position = 'absolute';
    upLabel.style.top = '-25px';
    upLabel.style.left = '50%';
    upLabel.style.transform = 'translateX(-50%)';
    upLabel.style.color = 'white';
    upLabel.style.fontFamily = 'monospace';
    upLabel.style.fontSize = '16px';
    upLabel.style.fontWeight = 'bold';
    upLabel.style.width = '24px';
    upLabel.style.height = '24px';
    upLabel.style.textAlign = 'center';
    upLabel.style.lineHeight = '24px';
    upLabel.style.borderRadius = '3px';
    upLabel.style.backgroundColor = 'rgba(40, 40, 40, 0.7)';
    
    const downLabel = document.createElement('div');
    downLabel.textContent = throttle.downLabel;
    downLabel.style.position = 'absolute';
    downLabel.style.bottom = '-25px';
    downLabel.style.left = '50%';
    downLabel.style.transform = 'translateX(-50%)';
    downLabel.style.color = 'white';
    downLabel.style.fontFamily = 'monospace';
    downLabel.style.fontSize = '16px';
    downLabel.style.fontWeight = 'bold';
    downLabel.style.width = '24px';
    downLabel.style.height = '24px';
    downLabel.style.textAlign = 'center';
    downLabel.style.lineHeight = '24px';
    downLabel.style.borderRadius = '3px';
    downLabel.style.backgroundColor = 'rgba(40, 40, 40, 0.7)';
    
    throttleBar.appendChild(upLabel);
    throttleBar.appendChild(downLabel);
    
    // Store references
    this.controlElements.set(throttle.upKey, upLabel);
    this.controlElements.set(throttle.downKey, downLabel);
    
    throttleContainer.appendChild(throttleBar);
    this.container.appendChild(throttleContainer);
  }
  
  /**
   * Update the joystick position based on current input
   */
  private updateJoystickPosition(): void {
    // Default position (center)
    let xOffset = 0;
    let yOffset = 0;
    
    const axes = this.config.axes;
    
    // Check horizontal movement
    const isLeftActive = document.activeElement?.tagName !== 'INPUT' && 
      this.inputManager.isKeyActive(axes.horizontal.left);
    const isRightActive = document.activeElement?.tagName !== 'INPUT' && 
      this.inputManager.isKeyActive(axes.horizontal.right);
    
    // Check vertical movement
    const isUpActive = document.activeElement?.tagName !== 'INPUT' && 
      this.inputManager.isKeyActive(axes.vertical.up);
    const isDownActive = document.activeElement?.tagName !== 'INPUT' && 
      this.inputManager.isKeyActive(axes.vertical.down);
    
    // Calculate offsets (out of 40%)
    if (isLeftActive) xOffset -= 40;
    if (isRightActive) xOffset += 40;
    if (isUpActive) yOffset -= 40;
    if (isDownActive) yOffset += 40;
    
    // Apply movement to joystick dot
    this.joystickDot.style.transform = `translate(calc(-50% + ${xOffset}%), calc(-50% + ${yOffset}%))`;
    
    // Update key highlights
    this.highlightKey(axes.horizontal.left, isLeftActive);
    this.highlightKey(axes.horizontal.right, isRightActive);
    this.highlightKey(axes.vertical.up, isUpActive);
    this.highlightKey(axes.vertical.down, isDownActive);
  }
  
  /**
   * Update throttle position based on active keys
   */
  private updateThrottlePosition(): void {
    if (!this.throttleIndicator || !this.throttleConfig) return;
    
    // Check throttle keys
    const isUpActive = document.activeElement?.tagName !== 'INPUT' && 
      this.inputManager.isKeyActive(this.throttleConfig.upKey);
    const isDownActive = document.activeElement?.tagName !== 'INPUT' && 
      this.inputManager.isKeyActive(this.throttleConfig.downKey);
    
    // Default position (middle)
    let yPosition = 50;
    
    // Adjust based on active keys
    if (isUpActive) yPosition = 20;
    if (isDownActive) yPosition = 80;
    
    // Apply position to throttle indicator
    this.throttleIndicator.style.top = `${yPosition}%`;
    
    // Update key highlights
    this.highlightKey(this.throttleConfig.upKey, isUpActive);
    this.highlightKey(this.throttleConfig.downKey, isDownActive);
  }
} 