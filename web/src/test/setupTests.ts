// Mock browser environment for tests
class MockConsoleRenderer {
  renderMessage() {}
  renderError() {}
  renderWarning() {}
  renderSuccess() {}
  renderHand() {}
  renderBanner() {}
  renderPhase() {}
  renderGameStats() {}
  renderHelp() {}
  renderSystemStatus() {}
  renderInstalledCards() {}
  showPrompt() {}
  clearConsole() {}
  startDemoMode() {}
  applyConsoleStyles() {}
  showMenuOptions() {}
}

// Mock console methods
globalThis.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  clear: jest.fn(),
};

// Set up mocks for browser environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock document methods
document.createElement = jest.fn().mockImplementation(_tag => {
  const element = {
    style: {},
    innerHTML: '',
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    classList: {
      add: jest.fn()
    },
    setAttribute: jest.fn(),
  };
  return element;
});

document.querySelector = jest.fn().mockImplementation(() => null);
document.querySelectorAll = jest.fn().mockImplementation(() => []);

// Instead of directly assigning to document.body, mock appendChild and removeChild
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

// Create a mock for document.body methods
Object.defineProperty(document, 'body', {
  value: {
    appendChild: mockAppendChild,
    removeChild: mockRemoveChild,
    style: {},
  },
  writable: false
});

// Export mocks for use in tests
export { MockConsoleRenderer };

describe('Test Environment Setup', () => {
  test('Jest is working', () => {
    expect(true).toBe(true);
  });
}); 