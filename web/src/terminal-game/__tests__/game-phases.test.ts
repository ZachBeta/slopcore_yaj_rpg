import { GamePhase } from '../game-phases';

describe('GamePhase', () => {
  it('should define all the required game phases', () => {
    // Check that all expected phases are defined
    expect(GamePhase.SETUP).toBe('setup');
    expect(GamePhase.START_TURN).toBe('start_turn');
    expect(GamePhase.ACTION).toBe('action');
    expect(GamePhase.DISCARD).toBe('discard');
    expect(GamePhase.END_TURN).toBe('end_turn');
    expect(GamePhase.CLEANUP).toBe('cleanup');
    expect(GamePhase.GAME_OVER).toBe('game_over');
  });

  it('should have exactly 7 phases defined', () => {
    // Count the number of phases in the enum
    const phaseCount = Object.keys(GamePhase).length;
    expect(phaseCount).toBe(7);
  });
});
