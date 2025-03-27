/**
 * @jest-environment jsdom
 */
import { ConsoleRenderer } from '../console-renderer';
import { Card } from '../game-types';

// Mock DOM methods to avoid errors
document.createElement = jest.fn().mockImplementation(() => {
  return {
    classList: {
      add: jest.fn(),
    },
    appendChild: jest.fn(),
    style: {},
    innerText: '',
    innerHTML: '',
    addEventListener: jest.fn(),
    setAttribute: jest.fn(),
  };
});

document.querySelector = jest.fn().mockImplementation(() => {
  return {
    appendChild: jest.fn(),
    innerHTML: '',
    style: {},
  };
});

describe('ConsoleRenderer', () => {
  let renderer: ConsoleRenderer;
  let mockAppendChildSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Set up spies
    mockAppendChildSpy = jest.spyOn(document.body, 'appendChild');
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    renderer = new ConsoleRenderer();
  });

  describe('initialization', () => {
    it('should create DOM elements on initialization', () => {
      // Document.createElement should have been called to create console elements
      expect(document.createElement).toHaveBeenCalledWith('div');

      // The console should be appended to the body
      expect(mockAppendChildSpy).toHaveBeenCalled();
    });
  });

  describe('rendering methods', () => {
    it('should render messages with the right styling', () => {
      renderer.renderMessage('Test message', 'info');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should render errors with the right styling', () => {
      renderer.renderError('Test error');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should render game phases', () => {
      renderer.renderPhase('Action', 1);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should render game stats', () => {
      renderer.renderGameStats({
        credits: 5,
        memory: { total: 4, used: 2 },
        agendaPoints: 0,
        clicksRemaining: 3,
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should render system status', () => {
      renderer.renderSystemStatus({
        neuralInterface: 'Active',
        traceDetection: 0,
        securityLevel: 'Low',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should render the game banner', () => {
      renderer.renderBanner();
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('card rendering', () => {
    it('should render a hand of cards', () => {
      // Create sample cards
      const sampleCards: Card[] = [
        {
          id: 'test-program',
          name: 'Test Program',
          type: 'program',
          cost: 3,
          description: 'A test program',
        },
      ];

      renderer.renderHand(sampleCards);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('help and system', () => {
    it('should render command help', () => {
      renderer.displayCommandHelp('test', 'Test command description');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should render command list', () => {
      renderer.renderHelp({ 'test': 'Test command' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should render help', () => {
      renderer.displayHelp({ 'test': 'Test command example' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
