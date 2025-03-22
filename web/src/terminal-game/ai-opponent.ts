/**
 * AI Opponent for Neon Dominance Terminal Game
 * Handles automated opponent actions during gameplay
 */

interface GameState {
  playerCredits: number;
  playerMemory: number;
  opponentCredits: number;
  opponentCards: number;
  installedPrograms: any[];
  runHistory: any[];
  serverStrengths: Record<string, number>;
  turnNumber: number;
}

export class AIOpponent {
  private difficulty: 'easy' | 'medium' | 'hard';
  private credits: number;
  private iceInstalled: any[];
  private agenda: any[];
  private turn: number;
  private random: () => number;

  constructor(
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    seed?: number
  ) {
    this.difficulty = difficulty;
    this.credits = this.getStartingCredits();
    this.iceInstalled = [];
    this.agenda = [];
    this.turn = 0;
    
    // Initialize random function with seed if provided
    if (seed !== undefined) {
      // Simple seeded random function
      const a = 1664525;
      const c = 1013904223;
      const m = Math.pow(2, 32);
      let _seed = seed;
      
      this.random = () => {
        _seed = (a * _seed + c) % m;
        return _seed / m;
      };
    } else {
      this.random = Math.random;
    }
  }

  /**
   * Get starting credits based on difficulty
   */
  private getStartingCredits(): number {
    switch(this.difficulty) {
      case 'easy':
        return 5;
      case 'medium':
        return 8;
      case 'hard':
        return 12;
      default:
        return 8;
    }
  }

  /**
   * Take a turn as the corporation
   * @returns An object containing the actions taken
   */
  public takeTurn(): { 
    actionsLog: string[],
    iceInstalled: number,
    creditsGained: number,
    creditsSpent: number,
    newTraceLevel: number
  } {
    this.turn++;
    const actionsLog: string[] = [];
    let creditsGained = 0;
    let creditsSpent = 0;
    let iceInstalled = 0;
    
    // Gain credits (base + difficulty bonus)
    const baseCredits = 3;
    const difficultyBonus = this.difficulty === 'easy' ? 0 : this.difficulty === 'medium' ? 1 : 2;
    creditsGained = baseCredits + difficultyBonus;
    this.credits += creditsGained;
    
    actionsLog.push(`Corporation gained ${creditsGained} credits (now has ${this.credits}).`);
    
    // Determine number of actions based on difficulty and turn number
    const actionsCount = this.getActionsCount();
    
    // Take actions
    for (let i = 0; i < actionsCount; i++) {
      const action = this.determineNextAction();
      
      switch (action) {
        case 'installIce':
          if (this.credits >= 2) {
            const iceName = this.generateIceName();
            const iceStrength = Math.floor(this.turn / 2) + Math.floor(this.random() * 3) + 1;
            const iceCost = 2 + Math.floor(iceStrength / 2);
            
            if (this.credits >= iceCost) {
              this.iceInstalled.push({
                name: iceName,
                strength: iceStrength,
                cost: iceCost,
                rezzed: false
              });
              
              this.credits -= iceCost;
              creditsSpent += iceCost;
              iceInstalled++;
              
              actionsLog.push(`Corporation installed new ICE: ${iceName} (strength ${iceStrength}).`);
            }
          }
          break;
          
        case 'drawCard':
          actionsLog.push('Corporation drew a card.');
          break;
          
        case 'advanceAgenda':
          if (this.random() < 0.3 && this.agenda.length < 3) {
            const newAgenda = {
              name: this.generateAgendaName(),
              advancement: 0,
              pointValue: Math.ceil(this.random() * 2) + 1,
              advancementRequired: (Math.ceil(this.random() * 3) + 2)
            };
            
            this.agenda.push(newAgenda);
            actionsLog.push(`Corporation created new agenda: ${newAgenda.name}.`);
          } else if (this.agenda.length > 0) {
            // Advance an existing agenda
            const agendaIndex = Math.floor(this.random() * this.agenda.length);
            const agenda = this.agenda[agendaIndex];
            
            agenda.advancement++;
            actionsLog.push(`Corporation advanced agenda: ${agenda.name} (${agenda.advancement}/${agenda.advancementRequired}).`);
            
            // Check if agenda is completed
            if (agenda.advancement >= agenda.advancementRequired) {
              actionsLog.push(`Corporation scored agenda: ${agenda.name} for ${agenda.pointValue} points!`);
              this.agenda.splice(agendaIndex, 1);
            }
          }
          break;
          
        case 'gainCredit':
          this.credits++;
          creditsGained++;
          actionsLog.push('Corporation gained 1 additional credit.');
          break;
      }
    }
    
    // Calculate new trace level based on turn number and difficulty
    const baseTraceLevel = Math.min(10 + this.turn, 60);
    const difficultyMultiplier = this.difficulty === 'easy' ? 0.8 : this.difficulty === 'medium' ? 1 : 1.2;
    const newTraceLevel = Math.floor(baseTraceLevel * difficultyMultiplier);
    
    return {
      actionsLog,
      iceInstalled,
      creditsGained,
      creditsSpent,
      newTraceLevel
    };
  }
  
  /**
   * Determine the number of actions the corporation will take
   */
  private getActionsCount(): number {
    // Base actions depend on difficulty
    const baseActions = this.difficulty === 'easy' ? 2 : this.difficulty === 'medium' ? 3 : 4;
    
    // Add bonus actions based on turn number
    const bonusActions = Math.floor(this.turn / 3);
    
    // Cap at reasonable maximum
    return Math.min(baseActions + bonusActions, 7);
  }
  
  /**
   * Determine the next action the corporation should take
   */
  private determineNextAction(): 'installIce' | 'drawCard' | 'advanceAgenda' | 'gainCredit' {
    const roll = this.random();
    
    // Weights for different actions based on game state
    const weights = {
      installIce: 0.25 + (this.credits > 5 ? 0.2 : 0) - (this.iceInstalled.length * 0.05),
      drawCard: 0.2,
      advanceAgenda: 0.3 + (this.turn > 3 ? 0.1 : 0),
      gainCredit: 0.25 - (this.credits > 8 ? 0.15 : 0)
    };
    
    let cumulativeWeight = 0;
    for (const [action, weight] of Object.entries(weights)) {
      cumulativeWeight += weight;
      if (roll < cumulativeWeight) {
        return action as any;
      }
    }
    
    return 'gainCredit';
  }
  
  /**
   * Generate a random ICE name
   */
  private generateIceName(): string {
    const prefixes = ['Enigma', 'Heimdall', 'Neural', 'Data', 'Hadrian\'s', 'Viktor', 'Ichi', 'Lotus', 'Tollbooth', 'Archer'];
    const suffixes = ['Barrier', 'Sentry', 'Wall', 'Katana', 'Raven', 'Protocol', 'Field', 'Gate', 'Firewall', 'Codegate'];
    
    const prefix = prefixes[Math.floor(this.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(this.random() * suffixes.length)];
    
    return `${prefix} ${suffix}`;
  }
  
  /**
   * Generate a random agenda name
   */
  private generateAgendaName(): string {
    const prefixes = ['Project', 'Hostile', 'NAPD', 'Priority', 'Corporate', 'Government', 'Efficiency', 'Private', 'Accelerated', 'Global'];
    const suffixes = ['Takeover', 'Contracts', 'Vitruvius', 'Diagnostics', 'Security', 'Analytics', 'Deployment', 'Research', 'Initiative', 'Breakthrough'];
    
    const prefix = prefixes[Math.floor(this.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(this.random() * suffixes.length)];
    
    return `${prefix} ${suffix}`;
  }
  
  /**
   * Get the current trace detection level
   */
  public getTraceLevel(): number {
    const baseLevel = 10 + (this.turn * 3);
    const difficultyMultiplier = this.difficulty === 'easy' ? 0.8 : this.difficulty === 'medium' ? 1 : 1.2;
    
    return Math.floor(Math.min(baseLevel * difficultyMultiplier, 95));
  }
  
  /**
   * Get the corporation's current credits
   */
  public getCredits(): number {
    return this.credits;
  }
  
  /**
   * Get the installed ICE
   */
  public getInstalledIce(): any[] {
    return [...this.iceInstalled];
  }
  
  /**
   * Get the current agendas
   */
  public getAgendas(): any[] {
    return [...this.agenda];
  }
} 