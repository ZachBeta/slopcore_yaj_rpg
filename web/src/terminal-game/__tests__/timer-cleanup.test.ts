import { TerminalGame } from '../terminal-game';

// Spy on global setTimeout and clearTimeout
jest.spyOn(global, 'setTimeout');
jest.spyOn(global, 'clearTimeout');

describe('Terminal Game Timer Cleanup', () => {
  let game: TerminalGame;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new game instance for each test
    game = new TerminalGame();
    
    // Initialize the game
    game.initialize();
  });
  
  afterEach(() => {
    // Clean up resources
    game.cleanup();
  });
  
  it('should track timers when they are created', () => {
    // Mock empty hand to avoid discard phase
    game.setHandCards([]);
    
    // Set phase to action so we can end turn
    game.setCurrentPhase('action');
    
    // End turn creates a timer for starting the next turn
    game.processCommand('end');
    
    // Check that setTimeout was called
    expect(setTimeout).toHaveBeenCalled();
    
    // We can't directly test that the timer was tracked, but we can test
    // that cleanup will clear it by spying on clearTimeout
    game.cleanup();
    
    // Since we called end, we should have at least one timer to clear
    expect(clearTimeout).toHaveBeenCalled();
  });
  
  it('should clean up all timers properly', () => {
    // Create multiple timers (this is a bit of a hack since we can't directly add timers)
    // We'll end turn multiple times in quick succession to create multiple timers
    game.setHandCards([]);
    game.setCurrentPhase('action');
    
    // First end turn
    game.processCommand('end');
    
    // Set up for another end
    game.setHandCards([]);
    game.setCurrentPhase('action');
    
    // Second end turn
    game.processCommand('end');
    
    // Check how many times setTimeout was called
    const setTimeoutCallCount = (setTimeout as jest.Mock).mock.calls.length;
    
    // Clean up all timers
    game.cleanup();
    
    // Check that clearTimeout was called the same number of times as setTimeout
    expect((clearTimeout as jest.Mock).mock.calls.length).toBe(setTimeoutCallCount);
  });
}); 