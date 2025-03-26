import { ConsoleRenderer } from '../console-renderer';
import { GamePhase } from '../game-phases';
import { Card } from '../game-types';

interface MockTerminal {
  write: jest.Mock;
  clear: jest.Mock;
  appendChild: jest.Mock;
}

// Mock DOM methods to avoid errors
document.createElement = jest.fn().mockImplementation(() => {
  return {
    classList: {
      add: jest.fn()
    },
    appendChild: jest.fn(),
    style: {},
    innerText: '',
    innerHTML: '',
    addEventListener: jest.fn(),
    setAttribute: jest.fn()
  };
});

document.querySelector = jest.fn().mockImplementation(() => {
  return {
    appendChild: jest.fn(),
    innerHTML: '',
    style: {}
  };
});

describe('ConsoleRenderer', () => {
  let renderer: ConsoleRenderer;
  let mockAppendChildSpy: jest.SpyInstance;
  let mockTerminal: MockTerminal;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up spies
    mockAppendChildSpy = jest.spyOn(document.body, 'appendChild');
    
    mockTerminal = {
      write: jest.fn(),
      clear: jest.fn(),
      appendChild: jest.fn()
    };
    renderer = new ConsoleRenderer();
    (renderer as unknown as { terminal: MockTerminal }).terminal = mockTerminal;
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
      (renderer as unknown as { terminal: MockTerminal }).terminal = mockTerminal;
      renderer.renderMessage('Test message', 'info');
      expect(mockTerminal.appendChild).toHaveBeenCalled();
    });
    
    it('should render errors with the right styling', () => {
      (renderer as unknown as { terminal: MockTerminal }).terminal = mockTerminal;
      renderer.renderError('Test error');
      expect(mockTerminal.appendChild).toHaveBeenCalled();
    });
    
    it('should render game phases', () => {
      (renderer as unknown as { terminal: MockTerminal }).terminal = mockTerminal;
      renderer.renderPhase('Action', 1);
      expect(mockTerminal.appendChild).toHaveBeenCalled();
    });
    
    it('should render game stats', () => {
      (renderer as unknown as { terminal: MockTerminal }).terminal = mockTerminal;
      renderer.renderGameStats({
        credits: 5,
        memory: { total: 4, used: 2 },
        agendaPoints: 0,
        clicksRemaining: 3
      });
      expect(mockTerminal.appendChild).toHaveBeenCalled();
    });
    
    it('should render system status', () => {
      (renderer as unknown as { terminal: MockTerminal }).terminal = mockTerminal;
      renderer.renderSystemStatus({
        neuralInterface: 'Active',
        traceDetection: 0,
        securityLevel: 'Low'
      });
      expect(mockTerminal.appendChild).toHaveBeenCalled();
    });
    
    it('should render the game banner', () => {
      (renderer as unknown as { terminal: MockTerminal }).terminal = mockTerminal;
      renderer.renderBanner();
      expect(mockTerminal.appendChild).toHaveBeenCalled();
    });
  });
  
  describe('card rendering', () => {
    it('should render a hand of cards', () => {
      (renderer as unknown as { terminal: MockTerminal }).terminal = mockTerminal;
      
      // Create sample cards
      const sampleCards: Card[] = [
        {
          id: 'test-program',
          name: 'Test Program',
          type: 'program',
          cost: 3,
          description: 'A test program'
        }
      ];
      
      renderer.renderHand(sampleCards);
      expect(mockTerminal.appendChild).toHaveBeenCalled();
    });
  });
  
  describe('help and system', () => {
    it('should render command help', () => {
      (renderer as unknown as { terminal: MockTerminal }).terminal = mockTerminal;
      renderer.renderCommandHelp('test', 'Test command description');
      expect(mockTerminal.appendChild).toHaveBeenCalled();
    });

    it('should render command list', () => {
      (renderer as unknown as { terminal: MockTerminal }).terminal = mockTerminal;
      renderer.renderCommandList([{ command: 'test', description: 'Test command' }]);
      expect(mockTerminal.appendChild).toHaveBeenCalled();
    });

    it('should render command examples', () => {
      (renderer as unknown as { terminal: MockTerminal }).terminal = mockTerminal;
      renderer.renderCommandExamples([{ command: 'test', example: 'test example' }]);
      expect(mockTerminal.appendChild).toHaveBeenCalled();
    });
  });
}); 