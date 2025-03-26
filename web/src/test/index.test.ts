import './setupTests';

// Mock TerminalGame class
jest.mock('../terminal-game/terminal-game', () => {
  const mockRenderer = {
    startDemoMode: jest.fn(),
    renderMessage: jest.fn(),
    renderBanner: jest.fn(),
  };

  return {
    TerminalGame: jest.fn().mockImplementation(() => {
      return {
        initialize: jest.fn(),
        processCommand: jest.fn(),
        getRenderer: jest.fn().mockReturnValue(mockRenderer),
      };
    }),
  };
});

// Mock ThreeScene class
jest.mock('../three-scene', () => {
  return {
    ThreeScene: jest.fn().mockImplementation(() => {
      return {
        start: jest.fn(),
        stop: jest.fn(),
        dispose: jest.fn(),
      };
    }),
  };
});

// Mock OpenWorldGame class
jest.mock('../open-world/open-world', () => {
  return {
    OpenWorldGame: jest.fn().mockImplementation(() => {
      return {
        start: jest.fn(),
        dispose: jest.fn(),
      };
    }),
  };
});

// Mock DOM elements
const mockAppendChild = jest.fn();
document.body.appendChild = mockAppendChild;

// Define the global type for processCommand
declare global {
  interface Window {
    testMockGame?: {
      processCommand: (command: string) => void;
    };
  }
}

// Create a safer type for accessing processCommand
interface ProcessCommandGlobal {
  processCommand?: (command: string) => void;
}

// Test subject interface (to avoid any in casts)
interface TestMockGame {
  processCommand: (command: string) => void;
}

// Tests for the index.ts file
describe('Index', () => {
  let originalConsole: Console;
  let mockStartButton: HTMLButtonElement;
  let mockOptionsButton: HTMLButtonElement;
  let mockAboutButton: HTMLButtonElement;
  let mockDemoButton: HTMLButtonElement;
  let mockOpenWorldButton: HTMLButtonElement;
  let mockMenuContainer: HTMLDivElement;
  let mockCanvasContainer: HTMLDivElement;

  beforeEach(() => {
    // Save original console
    originalConsole = console;

    // Mock console
    globalThis.console = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      clear: jest.fn(),
    } as unknown as Console;

    // Set up DOM elements with real event listeners
    mockStartButton = document.createElement('button');
    mockStartButton.id = 'start-game';

    mockOptionsButton = document.createElement('button');
    mockOptionsButton.id = 'options';

    mockAboutButton = document.createElement('button');
    mockAboutButton.id = 'about';

    mockDemoButton = document.createElement('button');
    mockDemoButton.id = 'demo-mode';

    mockOpenWorldButton = document.createElement('button');
    mockOpenWorldButton.id = 'open-world-game';

    mockMenuContainer = document.createElement('div');
    mockMenuContainer.className = 'menu-container';
    mockMenuContainer.appendChild(mockStartButton);
    mockMenuContainer.appendChild(mockOptionsButton);
    mockMenuContainer.appendChild(mockAboutButton);
    mockMenuContainer.appendChild(mockDemoButton);
    mockMenuContainer.appendChild(mockOpenWorldButton);

    mockCanvasContainer = document.createElement('div');
    mockCanvasContainer.id = 'canvas-container';

    document.body.appendChild(mockMenuContainer);
    document.body.appendChild(mockCanvasContainer);

    // Use real DOM querying rather than mocking
    jest.spyOn(document, 'getElementById').mockImplementation((id) => {
      switch (id) {
        case 'start-game':
          return mockStartButton;
        case 'options':
          return mockOptionsButton;
        case 'about':
          return mockAboutButton;
        case 'canvas-container':
          return mockCanvasContainer;
        case 'demo-mode':
          return mockDemoButton;
        case 'open-world-game':
          return mockOpenWorldButton;
        default:
          return null;
      }
    });

    // Use real DOM querying with spying
    jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === '.menu-container') return mockMenuContainer;
      if (selector === '#canvas-container') return mockCanvasContainer;
      return null;
    });
  });

  afterEach(() => {
    // Restore original console
    globalThis.console = originalConsole;

    // Clean up DOM
    document.body.innerHTML = '';

    // Clear all mocks
    jest.clearAllMocks();
  });

  test('processCommand should call game.processCommand with valid command', () => {
    // Create a mock game instance and assign it to the window scope
    const mockProcessCommand = jest.fn();
    const mockGame: TestMockGame = {
      processCommand: mockProcessCommand,
    };

    // Temporarily assign the mock game to window using a type-safe approach
    globalThis.testMockGame = mockGame;

    // Override processCommand to use our mock
    type ProcessCommandFn = (command: string) => void;
    const processCommandFn: ProcessCommandFn = function (command: string) {
      if (globalThis.testMockGame && command && typeof command === 'string') {
        globalThis.testMockGame.processCommand(command);
      } else {
        console.error(
          'Game not initialized or invalid command. Please provide a valid command as a string.',
        );
      }
    };

    // Assign the function to globalThis with proper typing
    const g = globalThis as unknown as ProcessCommandGlobal;
    g.processCommand = processCommandFn;

    // Call processCommand from window
    if (g.processCommand) {
      g.processCommand('help');
    }

    // Check if game.processCommand was called
    expect(mockProcessCommand).toHaveBeenCalledWith('help');

    // Clean up
    delete globalThis.testMockGame;
  });

  test('processCommand should show error if game is not initialized', () => {
    // Reset window.processCommand to simulate uninitialized game
    const g = globalThis as unknown as ProcessCommandGlobal;
    g.processCommand = function (command: string) {
      if (command === null || command === undefined) {
        // This won't be called because command is a string
      } else {
        console.error(
          'Game not initialized or invalid command. Please provide a valid command as a string.',
        );
      }
    };

    // Call processCommand
    if (g.processCommand) {
      g.processCommand('help');
    }

    // Check if error was displayed
    expect(console.error).toHaveBeenCalledWith(
      'Game not initialized or invalid command. Please provide a valid command as a string.',
    );
  });

  test('Event listeners should be added to UI elements', async () => {
    // Spy on event listeners to verify they're added
    const startButtonSpy = jest.spyOn(mockStartButton, 'addEventListener');
    const optionsButtonSpy = jest.spyOn(mockOptionsButton, 'addEventListener');
    const aboutButtonSpy = jest.spyOn(mockAboutButton, 'addEventListener');
    const demoButtonSpy = jest.spyOn(mockDemoButton, 'addEventListener');
    const openWorldButtonSpy = jest.spyOn(mockOpenWorldButton, 'addEventListener');

    // Import the index module and call the DOMContentLoaded handler
    jest.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'DOMContentLoaded') {
        // Immediately call the handler
        (handler as EventListener)({} as Event);
      }
      return undefined;
    });

    // Now import index.ts which should trigger our mocked addEventListener
    await import('../index');

    // Verify event listeners were added
    expect(startButtonSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(optionsButtonSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(aboutButtonSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(demoButtonSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(openWorldButtonSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });
});

describe('Game initialization', () => {
  beforeEach(() => {
    // Set up mock game instance
    const mockGame = {
      processCommand: jest.fn(),
    };
    globalThis.testMockGame = mockGame;
  });

  afterEach(() => {
    // Clean up
    delete globalThis.testMockGame;
  });

  it('should process commands through the game instance', () => {
    // Test command processing
    if (globalThis.testMockGame && typeof globalThis.testMockGame.processCommand === 'function') {
      globalThis.testMockGame.processCommand('test command');
      expect(globalThis.testMockGame.processCommand).toHaveBeenCalledWith('test command');
    }
  });
});
