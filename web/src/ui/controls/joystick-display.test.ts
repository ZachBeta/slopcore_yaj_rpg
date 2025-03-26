import { JoystickConfig, JoystickDisplay } from './joystick-display';
import { InputManager } from '../../open-world/input-manager';
import { InputAction } from '../../constants/input';

// Mock InputManager for testing
class MockInputManager {
  private activeKeys: Set<string> = new Set();

  public isKeyActive(keyCode: string): boolean {
    return this.activeKeys.has(keyCode);
  }

  public activateKey(keyCode: string): void {
    this.activeKeys.add(keyCode);
  }

  public deactivateKey(keyCode: string): void {
    this.activeKeys.delete(keyCode);
  }

  public clearKeys(): void {
    this.activeKeys.clear();
  }

  // Stub implementation of required interface methods
  public getActiveActions(): Set<InputAction> {
    return new Set();
  }

  public handleKeyDown(): void {
    // Stub
  }

  public handleKeyUp(): void {
    // Stub
  }

  public handleActionDown(): void {
    // Stub
  }

  public handleActionUp(): void {
    // Stub
  }
}

describe('JoystickDisplay', () => {
  let joystickDisplay: JoystickDisplay;
  let mockInputManager: MockInputManager;
  let container: HTMLElement;

  // Sample joystick configuration
  const testConfig: JoystickConfig = {
    title: 'Test Joystick',
    axes: {
      vertical: { up: 'KeyW', down: 'KeyS' },
      horizontal: { left: 'KeyA', right: 'KeyD' },
    },
    labels: [
      { key: 'KeyW', label: 'W', position: 'top' },
      { key: 'KeyS', label: 'S', position: 'bottom' },
      { key: 'KeyA', label: 'A', position: 'left' },
      { key: 'KeyD', label: 'D', position: 'right' },
    ],
    throttle: {
      key: 'throttle',
      upKey: 'KeyR',
      downKey: 'KeyF',
      upLabel: 'R',
      downLabel: 'F',
    },
  };

  beforeEach(() => {
    // Set up DOM environment for testing
    document.body.innerHTML = '<div id="test-container"></div>';
    container = document.getElementById('test-container') as HTMLElement;

    // Create mock input manager
    mockInputManager = new MockInputManager();

    // Create joystick display
    joystickDisplay = new JoystickDisplay(
      'test',
      testConfig,
      mockInputManager as unknown as InputManager,
    );

    // Add to container
    container.appendChild(joystickDisplay.getElement());
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });

  test('renders a joystick with correct title', () => {
    const element = joystickDisplay.getElement();
    expect(element.textContent).toContain('Test Joystick');
  });

  test('renders control labels', () => {
    const element = joystickDisplay.getElement();
    expect(element.textContent).toContain('W');
    expect(element.textContent).toContain('A');
    expect(element.textContent).toContain('S');
    expect(element.textContent).toContain('D');
  });

  test('renders throttle controls when configured', () => {
    const element = joystickDisplay.getElement();
    expect(element.textContent).toContain('Throttle');
    expect(element.textContent).toContain('R');
    expect(element.textContent).toContain('F');
  });

  test('updates joystick position when keys are pressed', () => {
    // Get the joystick dot element
    const joystickElement = joystickDisplay.getElement();
    const joystickDot = joystickElement.querySelector('div > div > div') as HTMLElement;

    // Initial position should be centered
    expect(joystickDot.style.transform).toContain('translate(-50%, -50%)');

    // Simulate pressing the W key
    mockInputManager.activateKey('KeyW');
    joystickDisplay.update();

    // Joystick should move up
    expect(joystickDot.style.transform).toContain('translate(calc(-50% + 0%), calc(-50% + -40%))');

    // Add D key - should move diagonally
    mockInputManager.activateKey('KeyD');
    joystickDisplay.update();

    // Joystick should move up and right
    expect(joystickDot.style.transform).toContain('translate(calc(-50% + 40%), calc(-50% + -40%))');

    // Release all keys
    mockInputManager.clearKeys();
    joystickDisplay.update();

    // Should return to center
    expect(joystickDot.style.transform).toContain('translate(calc(-50% + 0%), calc(-50% + 0%))');
  });

  test('updates throttle position when keys are pressed', () => {
    // Get the throttle indicator element
    const joystickElement = joystickDisplay.getElement();
    const throttleIndicator = joystickElement.querySelector(
      'div > div:nth-child(2) > div > div',
    ) as HTMLElement;

    // Initial position should be in the middle
    expect(throttleIndicator.style.top).toBe('50%');

    // Simulate pressing the R key (throttle up)
    mockInputManager.activateKey('KeyR');
    joystickDisplay.update();

    // Throttle should move up
    expect(throttleIndicator.style.top).toBe('20%');

    // Simulate pressing the F key (throttle down)
    mockInputManager.deactivateKey('KeyR');
    mockInputManager.activateKey('KeyF');
    joystickDisplay.update();

    // Throttle should move down
    expect(throttleIndicator.style.top).toBe('80%');

    // Release all keys
    mockInputManager.clearKeys();
    joystickDisplay.update();

    // Should return to middle
    expect(throttleIndicator.style.top).toBe('50%');
  });

  test('highlights keys when they are active', () => {
    // Get the key elements
    const joystickElement = joystickDisplay.getElement();
    const wKey = Array.from(joystickElement.querySelectorAll('div')).find(
      (el) => el.textContent === 'W',
    ) as HTMLElement;

    // Initial state should be default
    expect(wKey.style.backgroundColor).toBe('rgba(40, 40, 40, 0.7)');

    // Simulate pressing the W key
    mockInputManager.activateKey('KeyW');
    joystickDisplay.update();

    // W key should be highlighted
    expect(wKey.style.backgroundColor).toBe('rgba(0, 200, 100, 0.8)');

    // Release the key
    mockInputManager.deactivateKey('KeyW');
    joystickDisplay.update();

    // W key should return to default
    expect(wKey.style.backgroundColor).toBe('rgba(40, 40, 40, 0.7)');
  });
});
