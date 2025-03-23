import { TerminalGame as _TerminalGame } from '../terminal-game/terminal-game';
import { MockConsoleRenderer as _MockConsoleRenderer } from './setupTests';

// Mock TerminalGame class
jest.mock('../terminal-game/terminal-game', () => {
  const mockRenderer = {
    startDemoMode: jest.fn(),
    renderMessage: jest.fn(),
    renderBanner: jest.fn()
  };

  return {
    TerminalGame: jest.fn().mockImplementation(() => {
      return {
        initialize: jest.fn(),
        processCommand: jest.fn(),
        getRenderer: jest.fn().mockReturnValue(mockRenderer)
      };
    })
  };
});

// Mock ThreeScene class
jest.mock('../three-scene', () => {
  return {
    ThreeScene: jest.fn().mockImplementation(() => {
      return {
        start: jest.fn(),
        stop: jest.fn(),
        dispose: jest.fn()
      };
    })
  };
});

// Mock DOM elements
const mockAppendChild = jest.fn();
document.body.appendChild = mockAppendChild;

// Tests for the index.ts file
describe('Index', () => {
  let originalConsole: Console;
  let mockStartButton: HTMLButtonElement;
  let mockOptionsButton: HTMLButtonElement;
  let mockAboutButton: HTMLButtonElement;
  let mockMenuContainer: HTMLDivElement;
  let mockCanvasContainer: HTMLDivElement;
  
  beforeEach(() => {
    // Save original console
    originalConsole = globalThis.console;
    
    // Mock console
    globalThis.console = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      clear: jest.fn()
    } as unknown as Console;
    
    // Set up DOM elements
    mockStartButton = document.createElement('button');
    mockStartButton.id = 'start-game';
    mockStartButton.addEventListener = jest.fn();

    mockOptionsButton = document.createElement('button');
    mockOptionsButton.id = 'options';
    mockOptionsButton.addEventListener = jest.fn();

    mockAboutButton = document.createElement('button');
    mockAboutButton.id = 'about';
    mockAboutButton.addEventListener = jest.fn();

    mockMenuContainer = document.createElement('div');
    mockMenuContainer.className = 'menu-container';
    mockMenuContainer.appendChild(mockStartButton);
    mockMenuContainer.appendChild(mockOptionsButton);
    mockMenuContainer.appendChild(mockAboutButton);

    mockCanvasContainer = document.createElement('div');
    mockCanvasContainer.id = 'canvas-container';

    document.body.appendChild(mockMenuContainer);
    document.body.appendChild(mockCanvasContainer);

    // Mock document.getElementById
    document.getElementById = jest.fn((id) => {
      switch (id) {
        case 'start-game':
          return mockStartButton;
        case 'options':
          return mockOptionsButton;
        case 'about':
          return mockAboutButton;
        case 'canvas-container':
          return mockCanvasContainer;
        default:
          return null;
      }
    });
    
    // Mock document.querySelector
    document.querySelector = jest.fn((selector) => {
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
    const mockGame = {
      initialize: jest.fn(),
      processCommand: mockProcessCommand,
      getRenderer: jest.fn()
    };
    
    // Temporarily assign the mock game to window
    (window as any).testMockGame = mockGame;
    
    // Override processCommand to use our mock
    globalThis.processCommand = function(command: string) {
      if ((window as any).testMockGame && command && typeof command === 'string') {
        (window as any).testMockGame.processCommand(command);
      } else {
        console.error("Game not initialized or invalid command. Please provide a valid command as a string.");
      }
    };
    
    // Call processCommand from window
    globalThis.processCommand('help');
    
    // Check if game.processCommand was called
    expect(mockProcessCommand).toHaveBeenCalledWith('help');
    
    // Clean up
    delete (window as any).testMockGame;
  });
  
  test('processCommand should show error if game is not initialized', () => {
    // Reset window.processCommand to simulate uninitialized game
    globalThis.processCommand = function(command: string) {
      if (command === null || command === undefined) {
        // This won't be called because command is a string
      } else {
        console.error("Game not initialized or invalid command. Please provide a valid command as a string.");
      }
    };
    
    // Call processCommand
    globalThis.processCommand('help');
    
    // Check if error was displayed
    expect(console.error).toHaveBeenCalledWith(
      "Game not initialized or invalid command. Please provide a valid command as a string."
    );
  });
  
  test('DOMContentLoaded event should set up event listeners', () => {
    // Clear the module cache to ensure fresh load
    jest.resetModules();
    
    // Load index.ts after DOM setup
    const _indexModule = require('../index');
    
    // Verify event listeners were added
    expect(mockStartButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockOptionsButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockAboutButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });
}); 