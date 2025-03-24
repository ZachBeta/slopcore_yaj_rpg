import { TerminalGame } from '../terminal-game';
import { GamePhase } from '../game-phases';
import { ConsoleRenderer } from '../console-renderer';
import { AIOpponent } from '../ai-opponent';

// Only mock the render methods to avoid DOM interactions
jest.mock('../console-renderer', () => {
  const original = jest.requireActual('../console-renderer');
  return {
    ConsoleRenderer: jest.fn().mockImplementation(() => {
      const instance = new original.ConsoleRenderer();
      // Mock only the render methods that interact with DOM
      instance.renderMessage = jest.fn();
      instance.renderError = jest.fn();
      instance.renderWarning = jest.fn();
      instance.renderSuccess = jest.fn();
      instance.renderHand = jest.fn();
      instance.renderBanner = jest.fn();
      instance.renderPhase = jest.fn();
      instance.renderGameStats = jest.fn();
      instance.renderHelp = jest.fn();
      instance.renderSystemStatus = jest.fn();
      instance.renderInstalledCards = jest.fn();
      instance.showPrompt = jest.fn();
      instance.clearConsole = jest.fn();
      return instance;
    })
  };
});

// Only mock methods in AIOpponent that might have randomness
jest.mock('../ai-opponent', () => {
  const original = jest.requireActual('../ai-opponent');
  return {
    AIOpponent: jest.fn().mockImplementation(() => {
      const instance = new original.AIOpponent();
      instance.takeTurn = jest.fn().mockReturnValue({
        actionsLog: ['AI action 1', 'AI action 2'],
        iceInstalled: 1
      });
      instance.getTraceLevel = jest.fn().mockReturnValue(25);
      return instance;
    })
  };
});

describe('TerminalGame', () => {
  let game: TerminalGame;
  const SEED = 12345;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new game instance for each test
    game = new TerminalGame(SEED);
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      expect(game).toBeDefined();
      
      // Verify initial values
      expect(game.getPlayerCredits()).toBe(5);
      expect(game.getMemoryUnitsAvailable()).toBe(4);
      expect(game.getMemoryUnitsUsed()).toBe(0);
      expect(game.getPlayerSide()).toBe('runner');
      expect(game.getCurrentPhase()).toBe(GamePhase.SETUP);
    });

    it('should initialize the game with proper setup', () => {
      // Initialize the game
      game.initialize();
      
      // Check if initialization happened correctly
      expect(game.getPlayerDeck().length).toBeGreaterThan(0);
      expect(game.getHandCards().length).toBe(5); // Initial hand size
      expect(game.getCurrentPhase()).not.toBe(GamePhase.SETUP); // Should have moved past setup
      expect(Object.keys(game.getServers()).length).toBe(3); // Should have 3 servers
    });
  });

  describe('command handling', () => {
    beforeEach(() => {
      // Initialize the game before testing commands
      game.initialize();
    });

    it('should handle help command', () => {
      const helpSpy = jest.spyOn(game as unknown as { cmdHelp: () => void }, 'cmdHelp');
      game.processCommand('help');
      expect(helpSpy).toHaveBeenCalled();
    });

    it('should handle invalid commands', () => {
      const renderSpy = jest.spyOn((game as unknown as { renderer: { renderError: (msg: string) => void } }).renderer, 'renderError');
      game.processCommand('invalid');
      expect(renderSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown command'));
    });

    it('should parse commands correctly', () => {
      const parseSpy = jest.spyOn(game as unknown as { parseCommand: (cmd: string) => string[] }, 'parseCommand');
      game.processCommand('draw');
      expect(parseSpy).toHaveBeenCalledWith('draw');
    });
  });

  describe('game state changes', () => {
    beforeEach(() => {
      // Initialize the game before testing state changes
      game.initialize();
    });

    it('should update clicks when drawing a card', () => {
      // Set up the test state
      game.setClicksRemaining(4);
      game.setCurrentPhase(GamePhase.ACTION);
      
      // Process the draw command
      game.processCommand('draw');
      
      // Check if clicks were deducted
      expect(game.getClicksRemaining()).toBe(3);
    });

    it('should handle turn transitions', () => {
      // Set up for end of turn
      game.setHandCards([]); // Empty hand so no discard needed
      game.setCurrentPhase(GamePhase.ACTION);
      
      // Spy on AI turn processing
      const aiSpy = jest.spyOn((game as unknown as { aiOpponent: { takeTurn: () => void } }).aiOpponent, 'takeTurn');
      
      // End the turn
      game.processCommand('end');
      
      // Verify turn transition happened
      expect(aiSpy).toHaveBeenCalled();
    });
  });

  describe('win conditions', () => {
    it('should detect runner win by agenda points', () => {
      // Initialize the game
      game.initialize();
      
      // Set up win condition
      game.setRunnerAgendaPoints(7);
      
      // Check win conditions
      game.checkWinConditions();
      
      // Game should be over with runner win
      expect(game.isGameOver()).toBe(true);
      expect(game.getWinMessage()).toContain('won the game');
    });

    it('should detect corporation win by agenda points', () => {
      // Initialize the game
      game.initialize();
      
      // Set up win condition
      game.setCorpAgendaPoints(7);
      
      // Check win conditions
      game.checkWinConditions();
      
      // Game should be over with corp win
      expect(game.isGameOver()).toBe(true);
      expect(game.getWinMessage()).toContain('Corporation has scored');
    });

    it('should detect runner loss by deck depletion', () => {
      // Initialize the game
      game.initialize();
      
      // Set up loss condition
      game.setPlayerDeck([]);
      game.setHandCards([]);
      
      // Check win conditions
      game.checkWinConditions();
      
      // Game should be over with runner loss
      expect(game.isGameOver()).toBe(true);
      expect(game.getWinMessage()).toContain('no cards left');
    });
  });

  describe('card installation', () => {
    beforeEach(() => {
      // Initialize the game
      game.initialize();
      
      // Set phase to action
      game.setCurrentPhase(GamePhase.ACTION);
      game.setClicksRemaining(3);
    });

    it('should successfully install a card with sufficient credits', () => {
      // Set up test state
      const initialHandSize = game.getHandCards().length;
      const initialPlayedSize = game.getPlayedCards().length;
      
      // Make sure we have credits for the card
      game.setPlayerCredits(10);
      
      // Install the first card (index 0)
      game.processCommand('install 0');
      
      // Verify installation
      expect(game.getHandCards().length).toBe(initialHandSize - 1);
      expect(game.getPlayedCards().length).toBe(initialPlayedSize + 1);
      expect(game.getClicksRemaining()).toBe(2);
    });

    it('should fail to install a card with insufficient credits', () => {
      // Set up test state
      const initialHandSize = game.getHandCards().length;
      
      // Make sure first card costs more than we have
      game.setPlayerCredits(0);
      
      // Try to install the first card
      game.processCommand('install 0');
      
      // Verify installation failed
      expect(game.getHandCards().length).toBe(initialHandSize);
      expect(game.getClicksRemaining()).toBe(3); // Unchanged
    });
  });

  describe('run actions', () => {
    beforeEach(() => {
      // Initialize the game
      game.initialize();
      
      // Set phase to action
      game.setCurrentPhase(GamePhase.ACTION);
      game.setClicksRemaining(3);
    });

    it('should initiate a run on a valid server', () => {
      // Try to run on a valid server
      game.processCommand('run R&D');
      
      // Verify run was initiated
      expect(game.getCurrentRun()).not.toBeNull();
      expect(game.getCurrentRun()?.target).toBe('R&D');
      expect(game.getClicksRemaining()).toBe(2);
    });

    it('should fail to run on an invalid server', () => {
      // Try to run on an invalid server
      game.processCommand('run InvalidServer');
      
      // Verify run was not initiated
      expect(game.getCurrentRun()).toBeNull();
      expect(game.getClicksRemaining()).toBe(3); // Unchanged
    });
  });

  describe('click management', () => {
    it('should start with 3 clicks', () => {
      expect(game.getClicksRemaining()).toBe(3);
    });

    it('should decrease clicks when taking actions', () => {
      game.processCommand('draw');
      expect(game.getClicksRemaining()).toBe(2);
    });
  });

  describe('game state', () => {
    it('should initialize with correct starting values', () => {
      expect(game.getClicksRemaining()).toBe(3);
      expect(game.getPlayerCredits()).toBe(5);
      expect(game.getMemoryUnits()).toBe(4);
    });

    it('should handle end of turn', () => {
      game.processCommand('draw');
      game.processCommand('end');
      expect(game.getClicksRemaining()).toBe(3);
    });

    it('should check win conditions', () => {
      game.setRunnerAgendaPoints(7);
      game.checkWinConditions();
      expect(game.isGameOver()).toBe(true);
      expect(game.getWinMessage()).toContain('Runner wins');
    });
  });

  describe('AI interaction', () => {
    it('should handle AI opponent turns', () => {
      const aiSpy = jest.spyOn((game as unknown as { aiOpponent: { takeTurn: () => void } }).aiOpponent, 'takeTurn');
      game.processCommand('end');
      expect(aiSpy).toHaveBeenCalled();
    });
  });
}); 