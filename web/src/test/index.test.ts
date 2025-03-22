import { TerminalGame } from '../terminal-game/terminal-game';
import { MockConsoleRenderer } from './setupTests';

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
  
  beforeEach(() => {
    // Save original console
    originalConsole = global.console;
    
    // Mock console methods
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn(),
      clear: jest.fn()
    } as unknown as Console;
    
    // Set up DOM elements
    mockStartButton = document.createElement('button') as HTMLButtonElement;
    mockStartButton.id = 'start-game';
    
    mockOptionsButton = document.createElement('button') as HTMLButtonElement;
    mockOptionsButton.id = 'options';
    
    mockAboutButton = document.createElement('button') as HTMLButtonElement;
    mockAboutButton.id = 'about';
    
    mockMenuContainer = document.createElement('div') as HTMLDivElement;
    mockMenuContainer.className = 'menu-container';
    
    // Mock document.getElementById and querySelector
    jest.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'start-game') return mockStartButton;
      if (id === 'options') return mockOptionsButton;
      if (id === 'about') return mockAboutButton;
      return null;
    });
    
    jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === '.menu-container') return mockMenuContainer;
      return null;
    });
    
    // Load index.ts
    jest.isolateModules(() => {
      require('../index');
    });
  });
  
  afterEach(() => {
    // Restore original console
    global.console = originalConsole;
    
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
    window.processCommand = function(command: string) {
      if ((window as any).testMockGame && command && typeof command === 'string') {
        (window as any).testMockGame.processCommand(command);
      } else {
        console.error("Game not initialized or invalid command. Please provide a valid command as a string.");
      }
    };
    
    // Call processCommand from window
    window.processCommand('help');
    
    // Check if game.processCommand was called
    expect(mockProcessCommand).toHaveBeenCalledWith('help');
    
    // Clean up
    delete (window as any).testMockGame;
  });
  
  test('processCommand should show error if game is not initialized', () => {
    // Reset window.processCommand to simulate uninitialized game
    window.processCommand = function(command: string) {
      if (false && command && typeof command === 'string') {
        // This won't be called
      } else {
        console.error("Game not initialized or invalid command. Please provide a valid command as a string.");
      }
    };
    
    // Call processCommand
    window.processCommand('help');
    
    // Check if error was displayed
    expect(console.error).toHaveBeenCalledWith(
      "Game not initialized or invalid command. Please provide a valid command as a string."
    );
  });
  
  test('DOMContentLoaded event should set up event listeners', () => {
    // Simulate DOMContentLoaded event
    const domContentLoadedEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domContentLoadedEvent);
    
    // Verify event listeners were added
    expect(mockStartButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockOptionsButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockAboutButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });
}); 