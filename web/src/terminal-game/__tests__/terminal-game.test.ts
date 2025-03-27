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
    }),
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
        iceInstalled: 1,
      });
      instance.getTraceLevel = jest.fn().mockReturnValue(25);
      return instance;
    }),
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

  // Clean up resources after each test
  afterEach(() => {
    // Clean up timers
    game.cleanup();
  });

  describe.skip('initialization', () => {
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

  describe.skip('command handling', () => {
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
      const renderSpy = jest.spyOn(
        (game as unknown as { renderer: { renderError: (msg: string) => void } }).renderer,
        'renderError',
      );
      game.processCommand('invalid');
      expect(renderSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown command'));
    });

    it('should parse commands correctly', () => {
      const parseSpy = jest.spyOn(
        game as unknown as { parseCommand: (cmd: string) => string[] },
        'parseCommand',
      );
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
      const aiSpy = jest.spyOn(
        (game as unknown as { aiOpponent: { takeTurn: () => void } }).aiOpponent,
        'takeTurn',
      );

      // End the turn
      game.processCommand('end');

      // Verify turn transition happened
      expect(aiSpy).toHaveBeenCalled();
    });
  });

  describe('win conditions', () => {
    it.skip('should detect runner win by agenda points', () => {
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

    it.skip('should detect corporation win by agenda points', () => {
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

    it.skip('should detect runner loss by deck depletion', () => {
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
      // Set up a test environment for card installation
      game.initialize();
      game.setCurrentPhase(GamePhase.ACTION);
      game.setClicksRemaining(3);
      game.setPlayerCredits(10);

      // Add a test card to hand
      game.setHandCards([
        {
          id: 'test-program',
          name: 'Test Program',
          type: 'program',
          cost: 3,
          memoryRequirement: 2,
          description: 'A test program',
        },
      ]);
    });

    it.skip('should install a card from hand', () => {
      const initialHandSize = game.getHandCards().length;
      game.processCommand('install 0');

      // Verify card was installed
      expect(game.getHandCards().length).toBe(initialHandSize - 1);
      expect(game.getPlayedCards().length).toBe(1);
      expect(game.getClicksRemaining()).toBe(2);
      expect(game.getPlayerCredits()).toBe(7); // 10 - 3
    });

    it.skip('should fail to install a card with insufficient credits', () => {
      const initialHandSize = game.getHandCards().length;
      game.setPlayerCredits(2); // Not enough credits

      game.processCommand('install 0');

      // Verify installation failed
      expect(game.getHandCards().length).toBe(initialHandSize);
      expect(game.getClicksRemaining()).toBe(3); // Unchanged
    });
  });

  describe('run actions', () => {
    beforeEach(() => {
      game.initialize();
      game.setCurrentPhase(GamePhase.ACTION);
      game.setClicksRemaining(3);
    });

    it.skip('should initiate a run on a valid server', () => {
      game.processCommand('run rd');

      // Verify run was initiated
      expect(game.getCurrentRun()).not.toBeNull();
      expect(game.getCurrentRun()?.target).toBe('R&D');
      expect(game.getClicksRemaining()).toBe(2);
    });

    it.skip('should reject run on invalid server', () => {
      game.processCommand('run invalidserver');
      expect(game.getCurrentRun()).toBeNull();
    });
  });

  describe('click management', () => {
    it.skip('should start with 3 clicks', () => {
      expect(game.getClicksRemaining()).toBe(3);
    });

    it.skip('should decrease clicks when taking actions', () => {
      game.processCommand('draw');
      expect(game.getClicksRemaining()).toBe(2);
    });
  });

  describe('game state', () => {
    it.skip('should initialize with correct starting values', () => {
      expect(game.getClicksRemaining()).toBe(3);
      expect(game.getPlayerCredits()).toBe(5);
      expect(game.getMemoryUnits()).toBe(4);
    });

    it.skip('should handle end of turn', () => {
      game.processCommand('draw');
      game.processCommand('end');
      expect(game.getClicksRemaining()).toBe(3);
    });

    it.skip('should check win conditions', () => {
      const checkSpy = jest.spyOn(
        game as unknown as { checkWinConditions: () => void },
        'checkWinConditions',
      );
      game.processCommand('end');
      expect(checkSpy).toHaveBeenCalled();
    });
  });

  describe('AI interaction', () => {
    it.skip('should handle AI opponent turns', () => {
      const aiSpy = jest.spyOn(
        (game as unknown as { aiOpponent: { takeTurn: () => void } }).aiOpponent,
        'takeTurn',
      );
      game.processCommand('end');
      expect(aiSpy).toHaveBeenCalled();
    });
  });
});
