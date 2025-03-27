import { AIOpponent } from '../ai-opponent';

describe('AIOpponent', () => {
  describe('initialization', () => {
    it('should create an AI opponent with default settings', () => {
      const ai = new AIOpponent();
      expect(ai).toBeDefined();
    });

    it('should create an AI opponent with specified difficulty', () => {
      const ai = new AIOpponent('hard');
      expect(ai).toBeDefined();
    });

    it('should create an AI opponent with a seed for predictable behavior', () => {
      const seed = 12345;
      const ai = new AIOpponent('medium', seed);

      // Using the same seed should result in the same behavior
      const ai2 = new AIOpponent('medium', seed);

      // Take a turn with both AIs and compare the trace levels
      ai.takeTurn();
      ai2.takeTurn();

      expect(ai.getTraceLevel()).toBe(ai2.getTraceLevel());
    });
  });

  describe('game actions', () => {
    let ai: AIOpponent;

    beforeEach(() => {
      // Use a seed for predictable test results
      ai = new AIOpponent('medium', 12345);
    });

    it('should take a turn and return action results', () => {
      const turnResult = ai.takeTurn();

      // Check turn result structure
      expect(turnResult).toBeDefined();
      expect(turnResult.actionsLog).toBeDefined();
      expect(Array.isArray(turnResult.actionsLog)).toBe(true);
      expect(typeof turnResult.iceInstalled).toBe('number');
      expect(typeof turnResult.creditsGained).toBe('number');
      expect(typeof turnResult.creditsSpent).toBe('number');
      expect(typeof turnResult.newTraceLevel).toBe('number');
    });

    it('should accumulate credits over multiple turns', () => {
      // Get initial credits
      const initialCredits = ai.getCredits();

      // Take a turn
      const turn1 = ai.takeTurn();
      const creditsAfterTurn1 = ai.getCredits();

      // Take another turn
      const _turn2 = ai.takeTurn();
      const creditsAfterTurn2 = ai.getCredits();

      // Credits should change predictably
      expect(creditsAfterTurn1).not.toBe(initialCredits);
      expect(creditsAfterTurn2).not.toBe(creditsAfterTurn1);

      // Credits after turn should equal:
      // initial + gained - spent
      expect(creditsAfterTurn1).toBe(
        initialCredits + turn1.creditsGained - turn1.creditsSpent,
      );
    });

    it('should install ICE during turns', () => {
      // Take multiple turns to ensure ICE gets installed
      let iceInstalled = 0;
      for (let i = 0; i < 5; i++) {
        const turn = ai.takeTurn();
        iceInstalled += turn.iceInstalled;
      }

      // Get installed ICE
      const installedIce = ai.getInstalledIce();

      // Should have installed some ICE
      expect(installedIce.length).toBeGreaterThan(0);
      expect(installedIce.length).toBe(iceInstalled);

      // Check ICE structure
      const firstIce = installedIce[0];
      expect(firstIce).toHaveProperty('name');
      expect(firstIce).toHaveProperty('strength');
      expect(firstIce).toHaveProperty('cost');
    });
  });

  describe('trace detection', () => {
    it('should have different trace levels based on difficulty', () => {
      // Create AIs with same seed but different difficulties
      const seed = 12345;
      const easyAI = new AIOpponent('easy', seed);
      const mediumAI = new AIOpponent('medium', seed);
      const hardAI = new AIOpponent('hard', seed);

      // Take a turn with each
      easyAI.takeTurn();
      mediumAI.takeTurn();
      hardAI.takeTurn();

      // Get trace levels
      const easyTrace = easyAI.getTraceLevel();
      const mediumTrace = mediumAI.getTraceLevel();
      const hardTrace = hardAI.getTraceLevel();

      // Hard should have higher trace than medium, which is higher than easy
      expect(hardTrace).toBeGreaterThan(mediumTrace);
      expect(mediumTrace).toBeGreaterThan(easyTrace);
    });

    it('should increase trace level over time', () => {
      const ai = new AIOpponent('medium', 12345);

      // Get initial trace level
      const initialTrace = ai.getTraceLevel();

      // Take multiple turns
      for (let i = 0; i < 3; i++) {
        ai.takeTurn();
      }

      // Get new trace level
      const newTrace = ai.getTraceLevel();

      // Trace should increase over time
      expect(newTrace).toBeGreaterThan(initialTrace);
    });
  });
});
