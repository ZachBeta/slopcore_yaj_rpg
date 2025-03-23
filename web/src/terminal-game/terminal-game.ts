/**
 * Terminal Game - Core game logic for the browser console-based mode
 */

import { Card, createStarterDeck } from './card-data';
import { ConsoleRenderer } from './console-renderer';
import { AIOpponent } from './ai-opponent';
import { GamePhase } from './game-phases';
import { CommandArguments, GameState, PlayedCard, RunState, Server, CommandHandler } from './types';

// Command documentation
const validCommands: Record<string, string> = {
  help: "Display a list of available commands",
  man: "Display detailed manual for a command",
  draw: "Draw a card from your deck (costs 1 click)",
  hand: "Display cards in your hand",
  install: "Install a card from your hand (costs 1 click)",
  run: "Initiate a run on a server (costs 1 click)",
  end: "End your turn",
  info: "Display game information",
  discard: "Discard a card from your hand",
  system: "Display system status",
  installed: "Display your installed cards",
  credits: "Display your credit balance",
  memory: "Display memory unit status",
  jack_out: "Jack out of a run"
};

// Command manual pages
interface CommandManPage {
  NAME: string;
  SYNOPSIS: string;
  DESCRIPTION: string;
  EXAMPLES: string;
  SEE_ALSO: string;
}

const commandManPages: Record<string, CommandManPage> = {
  help: {
    NAME: "help - display available commands",
    SYNOPSIS: "help [command]",
    DESCRIPTION: "Display a list of available commands or get help on a specific command.",
    EXAMPLES: "help\nhelp install",
    SEE_ALSO: "man"
  },
  man: {
    NAME: "man - display command manual",
    SYNOPSIS: "man <command>",
    DESCRIPTION: "Display the manual page for a specific command with detailed information about its usage.",
    EXAMPLES: "man install\nman run",
    SEE_ALSO: "help"
  },
  draw: {
    NAME: "draw - draw a card",
    SYNOPSIS: "draw",
    DESCRIPTION: "Draw a card from your deck. Costs 1 click and can only be used during the action phase.",
    EXAMPLES: "draw",
    SEE_ALSO: "hand, discard"
  },
  hand: {
    NAME: "hand - view cards in hand",
    SYNOPSIS: "hand",
    DESCRIPTION: "Display all cards currently in your hand/grip.",
    EXAMPLES: "hand",
    SEE_ALSO: "draw, install, discard"
  },
  install: {
    NAME: "install - install a card",
    SYNOPSIS: "install <card_index>",
    DESCRIPTION: "Install a card from your hand. Costs 1 click and the credits shown on the card. Programs require memory units.",
    EXAMPLES: "install 0\ninstall 2",
    SEE_ALSO: "hand, memory, credits"
  },
  run: {
    NAME: "run - attack a server",
    SYNOPSIS: "run <server>",
    DESCRIPTION: "Initiate a run on a server. Costs 1 click. Valid servers are R&D, HQ, and Archives.",
    EXAMPLES: "run R&D\nrun HQ",
    SEE_ALSO: "jack_out, system"
  },
  end: {
    NAME: "end - end your turn",
    SYNOPSIS: "end",
    DESCRIPTION: "End your turn. You must discard down to your maximum hand size first.",
    EXAMPLES: "end",
    SEE_ALSO: "discard"
  }
};

export class TerminalGame {
  // Game dependencies
  private renderer: ConsoleRenderer;
  private randomSeed: number;
  
  // Game state
  private playerCredits: number = 5;
  private memoryUnitsAvailable: number = 4;
  private memoryUnitsUsed: number = 0;
  private playerSide: string = "runner";
  private opponentSide: string = "corp";
  
  // Game phases and turns
  private currentPhase: GamePhase = GamePhase.SETUP;
  private clicksRemaining: number = 0;
  private maxClicks: number = 4;
  private turnNumber: number = 0;
  private activePlayer: string | null = null;
  
  // Win conditions
  private runnerAgendaPoints: number = 0;
  private corpAgendaPoints: number = 0;
  private agendaPointsToWin: number = 7;
  private runnerCardsRemaining: number = 0;
  private corpCardsRemaining: number = 30;
  private gameOver: boolean = false;
  private winMessage: string = "";
  
  // Card data
  private playerDeck: Card[] = [];
  private handCards: Card[] = [];
  private playedCards: PlayedCard[] = [];
  private selectedCardIndex: number = -1;
  
  // Special gameplay flags
  private bypassNextIce: number = 0;
  private nextRunUntraceable: boolean = false;
  private currentRun: RunState | null = null;
  
  // Command history
  private commandHistory: string[] = [];
  private commandHistoryIndex: number = -1;

  // AI opponent
  private aiOpponent: AIOpponent | null = null;

  // Server data
  private servers: Record<string, Server> = {};

  // Command handlers map
  private commandHandlers: Record<string, CommandHandler> = {};

  constructor(randomSeed: number = Math.floor(Math.random() * 100000)) {
    // Set up dependencies
    this.randomSeed = randomSeed;
    this.renderer = new ConsoleRenderer();
    
    // Set up command handlers
    this.commandHandlers = {
      'help': this.cmdHelp.bind(this),
      'man': this.cmdMan.bind(this),
      'draw': this.cmdDraw.bind(this),
      'hand': this.cmdHand.bind(this),
      'install': this.cmdInstall.bind(this),
      'run': this.cmdRun.bind(this),
      'end': this.cmdEnd.bind(this),
      'info': this.cmdInfo.bind(this),
      'discard': this.cmdDiscard.bind(this),
      'system': this.cmdSystem.bind(this),
      'installed': this.cmdInstalled.bind(this),
      'credits': this.cmdCredits.bind(this),
      'memory': this.cmdMemory.bind(this),
      'jack_out': this.cmdJackOut.bind(this)
    };
  }

  /**
   * Initialize the game state and display welcome message
   */
  initialize(): void {
    // Set up the random seed for consistent behavior
    this.setRandomSeed(this.randomSeed);
    
    // Initialize AI opponent with the same seed
    this.aiOpponent = new AIOpponent('medium', this.randomSeed);
    
    // Initialize servers
    this.initializeServers();
    
    // Set up the initial deck, shuffle, and draw starting hand
    this.initializeDeck();
    this.drawStartingHand();
    
    // Set initial game phase and active player
    this.currentPhase = GamePhase.SETUP;
    this.activePlayer = this.playerSide;
    
    // Display welcome message and help
    this.displayWelcome();
    this.processCommand("help");
    
    // Start the game
    this.startTurn();
  }

  /**
   * Set the random seed for consistent behavior
   */
  private setRandomSeed(seed: number): void {
    this.randomSeed = seed;
    // We don't actually set JavaScript's Math.random seed here because
    // that's not directly possible. Instead, we use a predictable
    // algorithm in getRandomNumber method.
  }

  /**
   * Get a random number using the seed
   */
  private getRandomNumber(min: number, max: number): number {
    // Simple pseudo-random number generator
    this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
    const rnd = this.randomSeed / 233280;
    return min + Math.floor(rnd * (max - min + 1));
  }

  /**
   * Initialize corporate servers
   */
  private initializeServers(): void {
    // Set up the three main servers
    this.servers = {
      'R&D': {
        name: 'R&D',
        ice: [],
        strength: 1,
        cards: []
      },
      'HQ': {
        name: 'HQ',
        ice: [],
        strength: 2,
        cards: []
      },
      'Archives': {
        name: 'Archives',
        ice: [],
        strength: 1,
        cards: []
      }
    };
  }

  /**
   * Initialize the player deck with cards
   */
  private initializeDeck(): void {
    // Create a starter deck with the same random seed
    this.playerDeck = createStarterDeck(this.randomSeed);
    
    // Set number of cards for status tracking
    this.runnerCardsRemaining = this.playerDeck.length;
  }

  /**
   * Draw the initial hand of cards
   */
  private drawStartingHand(): void {
    const startingHandSize = 5;
    for (let i = 0; i < startingHandSize; i++) {
      if (this.playerDeck.length > 0) {
        this.handCards.push(this.playerDeck.pop()!);
      }
    }
  }

  /**
   * Display welcome message
   */
  private displayWelcome(): void {
    this.renderer.renderBanner();
  }

  /**
   * Start a new turn
   */
  startTurn(): void {
    // Increment turn counter if returning to the runner
    if (this.activePlayer === this.opponentSide) {
      this.turnNumber++;
    }
    
    // Set active player to the runner
    this.activePlayer = this.playerSide;
    
    // Update phase
    this.currentPhase = GamePhase.START_TURN;
    
    // Reset clicks
    this.clicksRemaining = this.maxClicks;
    
    // Trigger start-of-turn effects
    this.processCardAbilities('turn_start');
    
    // Display turn information
    this.renderer.renderPhase(this.getPhaseDescription(), this.turnNumber);
    
    // Update phase to action phase
    this.currentPhase = GamePhase.ACTION;
    
    // Display status
    this.updateStatus();
  }

  /**
   * Process abilities of played cards based on a trigger
   */
  private processCardAbilities(trigger: string, _context: Record<string, unknown> | null = null): void {
    // Iterate through installed/played cards and check for matching abilities
    this.playedCards.forEach(card => {
      if (card.type === 'program' && trigger === 'turn_start') {
        if (card.id === 'prog_autoscript') {
          // Draw 1 card
          if (this.playerDeck.length > 0) {
            this.handCards.push(this.playerDeck.pop()!);
            this.renderer.renderSuccess(`${card.name} lets you draw a card.`);
          }
        } else if (card.id === 'prog_credit_miner') {
          // Gain 1 credit
          this.playerCredits += 1;
          this.renderer.renderSuccess(`${card.name} generates 1 credit.`);
        }
      } else if (card.type === 'resource' && trigger === 'turn_start') {
        if (card.id === 'res_darknet_contact' && this.playerCredits < 6) {
          // Gain 1 credit if fewer than 6 credits
          this.playerCredits += 1;
          this.renderer.renderSuccess(`${card.name} generates 1 credit.`);
        }
      }
    });
  }

  /**
   * Process a command entered by the player
   */
  processCommand(commandText: string): void {
    // Add to command history
    this.commandHistory.push(commandText);
    this.commandHistoryIndex = this.commandHistory.length;
    
    // Parse command and arguments
    const { command, args } = this.parseCommand(commandText);
    
    // Check if command exists
    if (command && this.commandHandlers[command]) {
      // Execute the command
      this.commandHandlers[command](args);
    } else if (command) {
      // Unknown command
      this.renderer.renderError(`Unknown command: ${command}`);
      this.renderer.renderMessage("Type 'help' for a list of available commands.", 'info');
    }
    
    // Check win conditions after every command
    this.checkWinConditions();
    
    // Display prompt if game is not over
    if (!this.gameOver) {
      this.renderer.showPrompt();
    }
  }

  /**
   * Parse a command string into command name and arguments
   */
  private parseCommand(commandText: string): CommandArguments {
    const parts = commandText.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);
    const options: Record<string, string> = {};
    
    // Extract options (starts with --)
    const filteredArgs = args.filter(arg => {
      if (arg.startsWith('--')) {
        const optParts = arg.substring(2).split('=');
        options[optParts[0]] = optParts[1] || 'true';
        return false;
      }
      return true;
    });
    
    return { command, args: filteredArgs, options };
  }

  /**
   * Check if any win conditions are met
   */
  private checkWinConditions(): void {
    // Check agenda points
    if (this.runnerAgendaPoints >= this.agendaPointsToWin) {
      this.gameOver = true;
      this.winMessage = `You have collected ${this.runnerAgendaPoints} agenda points and won the game!`;
      this.displayGameOver();
    } else if (this.corpAgendaPoints >= this.agendaPointsToWin) {
      this.gameOver = true;
      this.winMessage = `The Corporation has scored ${this.corpAgendaPoints} agenda points and won the game.`;
      this.displayGameOver();
    }
    
    // Check if runner is out of cards
    if (this.playerDeck.length === 0 && this.handCards.length === 0) {
      this.gameOver = true;
      this.winMessage = "You have no cards left in your stack or grip. The Corporation wins.";
      this.displayGameOver();
    }
    
    // Check if corp is out of cards
    if (this.corpCardsRemaining <= 0) {
      this.gameOver = true;
      this.winMessage = "The Corporation has no cards left in R&D. You win!";
      this.displayGameOver();
    }
  }

  /**
   * Display game over screen
   */
  private displayGameOver(): void {
    const winner = this.runnerAgendaPoints >= this.agendaPointsToWin ? "Runner" : "Corporation";
    this.renderer.renderMessage(`\n=== GAME OVER ===`, 'info');
    this.renderer.renderMessage(`Winner: ${winner}`, 'success');
    this.renderer.renderMessage(this.winMessage, 'info');
  }

  /**
   * Update game status line
   */
  private updateStatus(): void {
    const stats = {
      credits: this.playerCredits,
      memory: {
        total: this.memoryUnitsAvailable,
        used: this.memoryUnitsUsed
      },
      agendaPoints: this.runnerAgendaPoints,
      clicksRemaining: this.clicksRemaining
    };
    
    this.renderer.renderGameStats(stats);
  }

  /**
   * Get a user-friendly description of the current phase
   */
  private getPhaseDescription(): string {
    switch (this.currentPhase) {
      case GamePhase.SETUP: return "Setup";
      case GamePhase.START_TURN: return "Start of Turn";
      case GamePhase.ACTION: return "Action Phase";
      case GamePhase.DISCARD: return "Discard Phase";
      case GamePhase.END_TURN: return "End of Turn";
      case GamePhase.GAME_OVER: return "Game Over";
      default: return "Unknown";
    }
  }

  /**
   * Command handler for 'help'
   */
  private cmdHelp(args: string[]): void {
    if (args.length > 0) {
      // Display help for specific command
      const commandName = args[0].toLowerCase();
      if (validCommands[commandName]) {
        this.renderer.renderMessage(`\n${commandName}: ${validCommands[commandName]}`, 'info');
        this.renderer.renderMessage(`\nFor more detailed information, type 'man ${commandName}'`, 'info');
      } else {
        this.renderer.renderError(`No help available for command: ${commandName}`);
      }
    } else {
      // Display general help
      this.renderer.renderHelp(validCommands);
    }
  }

  /**
   * Command handler for 'man'
   */
  private cmdMan(args: string[]): void {
    if (args.length === 0) {
      this.renderer.renderError("Usage: man <command>");
      this.renderer.renderMessage("Example: man install", 'info');
      return;
    }
    
    const commandName = args[0].toLowerCase();
    const manPage = commandManPages[commandName];
    
    if (manPage) {
      // Display the man page
      this.renderer.renderMessage(manPage.NAME, 'info');
      this.renderer.renderMessage("\nSYNOPSIS", 'info');
      this.renderer.renderMessage(`  ${manPage.SYNOPSIS}`, 'info');
      this.renderer.renderMessage("\nDESCRIPTION", 'info');
      this.renderer.renderMessage(`  ${manPage.DESCRIPTION}`, 'info');
      this.renderer.renderMessage("\nEXAMPLES", 'info');
      manPage.EXAMPLES.split('\n').forEach((example: string) => {
        this.renderer.renderMessage(`  ${example}`, 'info');
      });
      this.renderer.renderMessage("\nSEE ALSO", 'info');
      this.renderer.renderMessage(`  ${manPage.SEE_ALSO}`, 'info');
    } else {
      this.renderer.renderError(`No manual entry for ${commandName}`);
    }
  }

  /**
   * Command handler for 'draw'
   */
  private cmdDraw(_args: string[]): void {
    if (this.currentPhase !== GamePhase.ACTION) {
      this.renderer.renderError("You can only draw cards during the action phase.");
      return;
    }
    
    if (this.clicksRemaining < 1) {
      this.renderer.renderError("Not enough clicks remaining.");
      return;
    }
    
    if (this.playerDeck.length === 0) {
      this.renderer.renderError("Your deck is empty.");
      return;
    }
    
    // Draw a card from the top of the deck
    const card = this.playerDeck.pop();
    if (card) {
      this.handCards.push(card);
      this.clicksRemaining--;
      this.renderer.renderSuccess(`You drew ${card.name}.`);
      
      // Update status
      this.updateStatus();
    }
  }

  /**
   * Command handler for 'hand'
   */
  private cmdHand(_args: string[]): void {
    if (this.handCards.length === 0) {
      this.renderer.renderMessage("Your hand is empty.", 'info');
      return;
    }
    
    // Render the player's hand
    this.renderer.renderHand(this.handCards);
  }

  /**
   * Command handler for 'install'
   */
  private cmdInstall(args: string[]): void {
    if (this.currentPhase !== GamePhase.ACTION) {
      this.renderer.renderError("You can only install cards during the action phase.");
      return;
    }
    
    if (this.clicksRemaining < 1) {
      this.renderer.renderError("Not enough clicks remaining.");
      return;
    }
    
    if (args.length === 0) {
      this.renderer.renderError("Please specify which card to install. Example: install 2");
      return;
    }
    
    const cardIndex = parseInt(args[0]);
    if (isNaN(cardIndex) || cardIndex < 0 || cardIndex >= this.handCards.length) {
      this.renderer.renderError(`Invalid card index: ${args[0]}`);
      return;
    }
    
    const card = this.handCards[cardIndex];
    
    // Check if we can afford it
    if (card.cost > this.playerCredits) {
      this.renderer.renderError(`Not enough credits to install ${card.name}. Cost: ${card.cost}, Available: ${this.playerCredits}`);
      return;
    }
    
    // Check if we have enough memory for programs
    if (card.type === 'program' && card.memoryUsage && card.memoryUsage + this.memoryUnitsUsed > this.memoryUnitsAvailable) {
      this.renderer.renderError(`Not enough memory to install ${card.name}. Required: ${card.memoryUsage}, Available: ${this.memoryUnitsAvailable - this.memoryUnitsUsed}`);
      return;
    }
    
    // Install the card
    const playedCard: PlayedCard = {
      ...card,
      playedId: Date.now(),
      faceup: true
    };
    
    this.playedCards.push(playedCard);
    this.handCards.splice(cardIndex, 1);
    
    // Update resources
    this.playerCredits -= card.cost;
    this.clicksRemaining--;
    
    if (card.type === 'program' && card.memoryUsage) {
      this.memoryUnitsUsed += card.memoryUsage;
    }
    
    if (card.type === 'hardware') {
      // Hardware with memory bonus
      if (card.id === 'hw_mem_chip') {
        this.memoryUnitsAvailable += 1;
        this.renderer.renderSuccess(`Your memory capacity increased by 1 unit.`);
      } else if (card.id === 'hw_modded_console') {
        this.memoryUnitsAvailable += 2;
        this.renderer.renderSuccess(`Your memory capacity increased by 2 units.`);
        
        // Also draw a card
        if (this.playerDeck.length > 0) {
          this.handCards.push(this.playerDeck.pop()!);
          this.renderer.renderSuccess(`You drew a card.`);
        }
      } else if (card.id === 'hw_quantum_processor') {
        this.memoryUnitsAvailable += 3;
        this.renderer.renderSuccess(`Your memory capacity increased by 3 units.`);
      }
    }
    
    this.renderer.renderSuccess(`Installed ${card.name}.`);
    this.updateStatus();
  }

  /**
   * Command handler for 'run'
   */
  private cmdRun(args: string[]): void {
    if (this.currentPhase !== GamePhase.ACTION) {
      this.renderer.renderError("You can only initiate runs during the action phase.");
      return;
    }
    
    if (this.clicksRemaining < 1) {
      this.renderer.renderError("Not enough clicks remaining.");
      return;
    }
    
    if (args.length === 0) {
      this.renderer.renderError("Please specify a server to run on. Example: run R&D");
      return;
    }
    
    const serverName = args[0];
    if (!this.servers[serverName]) {
      this.renderer.renderError(`Invalid server: ${serverName}`);
      return;
    }
    
    // Initiate a run
    this.currentRun = {
      active: true,
      target: serverName,
      iceIndex: 0,
      iceEncountered: [],
      successful: false,
      untraceable: this.nextRunUntraceable
    };
    
    // Consume click
    this.clicksRemaining--;
    
    // Reset the untraceable flag
    if (this.nextRunUntraceable) {
      this.nextRunUntraceable = false;
    }
    
    // Display run message
    this.renderer.renderMessage(`Initiating run on ${serverName}...`, 'info');
    
    // For this demo, we'll simulate a successful run
    this.renderer.renderSuccess(`Run on ${serverName} was successful!`);
    
    // Set run as successful
    if (this.currentRun) {
      this.currentRun.successful = true;
      this.currentRun.active = false;
    }
    
    this.updateStatus();
  }

  /**
   * Command handler for 'end'
   */
  private cmdEnd(_args: string[]): void {
    // Check if we need to discard cards (max hand size)
    const maxHandSize = 5;
    if (this.handCards.length > maxHandSize) {
      this.currentPhase = GamePhase.DISCARD;
      this.renderer.renderError(`You must discard ${this.handCards.length - maxHandSize} card(s) before ending your turn.`);
      return;
    }
    
    // End the turn
    this.currentPhase = GamePhase.END_TURN;
    
    // Corp's turn
    this.activePlayer = this.opponentSide;
    
    // Run the AI opponent's turn
    this.renderer.renderMessage(`\nCorporation's turn...`, 'info');
    
    if (this.aiOpponent) {
      const aiActions = this.aiOpponent.takeTurn();
      
      // Display AI actions
      aiActions.actionsLog.forEach(action => {
        this.renderer.renderMessage(action, 'info');
      });
      
      // Update game state based on AI turn
      if (aiActions.iceInstalled > 0) {
        // Update server protection levels based on new ICE
        Object.keys(this.servers).forEach(server => {
          this.servers[server].strength += this.getRandomNumber(0, 1);
        });
      }
      
      // Reduce remaining corp cards (simulating card draw)
      this.corpCardsRemaining = Math.max(0, this.corpCardsRemaining - 1);
    }
    
    // Wait a moment before starting the player's turn (simulate delay)
    setTimeout(() => {
      this.renderer.renderMessage("Corporation ends turn.", 'info');
      
      // Back to runner's turn
      this.startTurn();
    }, 1000);
  }

  /**
   * Command handler for 'info'
   */
  private cmdInfo(_args: string[]): void {
    this.renderer.renderMessage("\nGame Information:", 'info');
    this.renderer.renderMessage(`Turn: ${this.turnNumber}`, 'info');
    this.renderer.renderMessage(`Phase: ${this.getPhaseDescription()}`, 'info');
    this.renderer.renderMessage(`Active Player: ${this.activePlayer}`, 'info');
    this.renderer.renderMessage(`Agenda Points: Runner ${this.runnerAgendaPoints}, Corp ${this.corpAgendaPoints}`, 'info');
    this.renderer.renderMessage(`Cards Remaining: ${this.playerDeck.length}`, 'info');
  }

  /**
   * Command handler for 'discard'
   */
  private cmdDiscard(args: string[]): void {
    if (args.length === 0) {
      this.renderer.renderError("Please specify which card to discard. Example: discard 2");
      return;
    }
    
    const cardIndex = parseInt(args[0]);
    if (isNaN(cardIndex) || cardIndex < 0 || cardIndex >= this.handCards.length) {
      this.renderer.renderError(`Invalid card index: ${args[0]}`);
      return;
    }
    
    // Check if we need to spend a click (not during discard phase)
    if (this.currentPhase === GamePhase.ACTION) {
      if (this.clicksRemaining < 1) {
        this.renderer.renderError("Not enough clicks remaining.");
        return;
      }
      this.clicksRemaining--;
    }
    
    // Discard the card
    const discardedCard = this.handCards.splice(cardIndex, 1)[0];
    this.renderer.renderSuccess(`Discarded ${discardedCard.name}.`);
    
    // Check if we can end turn now (after discarding to hand size)
    if (this.currentPhase === GamePhase.DISCARD) {
      const maxHandSize = 5;
      if (this.handCards.length <= maxHandSize) {
        // Auto-end turn
        this.processCommand("end");
      }
    }
    
    this.updateStatus();
  }

  /**
   * Command handler for 'system'
   */
  private cmdSystem(_args: string[]): void {
    // Get trace level from AI opponent
    const traceLevel = this.aiOpponent ? this.aiOpponent.getTraceLevel() : 25;
    
    // Determine security level based on turn number
    let securityLevel = "Low";
    if (this.turnNumber > 5) {
      securityLevel = "Medium";
    }
    if (this.turnNumber > 10) {
      securityLevel = "High";
    }
    
    const status = {
      neuralInterface: "Online",
      traceDetection: traceLevel,
      securityLevel: securityLevel
    };
    
    this.renderer.renderSystemStatus(status);
  }

  /**
   * Command handler for 'installed'
   */
  private cmdInstalled(_args: string[]): void {
    if (this.playedCards.length === 0) {
      this.renderer.renderMessage("You have no installed programs or hardware.", 'info');
      return;
    }
    
    this.renderer.renderInstalledCards(this.playedCards);
  }

  /**
   * Command handler for 'credits'
   */
  private cmdCredits(_args: string[]): void {
    this.renderer.renderMessage("\nCredit Account:", 'info');
    this.renderer.renderMessage(`Available Credits: ${this.playerCredits}`, 'info');
    
    // Calculate recurring credits
    let recurringCredits = 0;
    
    // Count recurring income from cards
    this.playedCards.forEach(card => {
      if (card.type === 'program' && card.id === 'prog_credit_miner') {
        recurringCredits += 1;
      } else if (card.type === 'resource' && card.id === 'res_darknet_contact') {
        recurringCredits += 1;
      }
    });
    
    this.renderer.renderMessage(`Recurring Income: ${recurringCredits} per turn`, 'info');
  }

  /**
   * Command handler for 'memory'
   */
  private cmdMemory(_args: string[]): void {
    this.renderer.renderMessage("\nMemory Status:", 'info');
    this.renderer.renderMessage(`Total MU: ${this.memoryUnitsAvailable}`, 'info');
    this.renderer.renderMessage(`Used MU: ${this.memoryUnitsUsed}`, 'info');
    this.renderer.renderMessage(`Available MU: ${this.memoryUnitsAvailable - this.memoryUnitsUsed}`, 'info');
    
    // List memory usage by program
    const programs = this.playedCards.filter(card => card.type === 'program' && card.memoryUsage);
    if (programs.length > 0) {
      this.renderer.renderMessage("\nMemory Usage by Program:", 'info');
      programs.forEach(program => {
        this.renderer.renderMessage(`${program.name}: ${program.memoryUsage} MU`, 'info');
      });
    }
  }

  /**
   * Command handler for 'jack_out'
   */
  private cmdJackOut(_args: string[]): void {
    if (!this.currentRun || !this.currentRun.active) {
      this.renderer.renderError("You are not currently on a run.");
      return;
    }
    
    // In this demo, jacking out is always successful
    this.renderer.renderSuccess("Successfully jacked out of the run.");
    this.currentRun.active = false;
    this.updateStatus();
  }

  /**
   * Get the current game state (for AI or saving)
   */
  getGameState(): GameState {
    return {
      // Player state
      playerCredits: this.playerCredits,
      memoryUnitsAvailable: this.memoryUnitsAvailable,
      memoryUnitsUsed: this.memoryUnitsUsed,
      playerSide: this.playerSide,
      opponentSide: this.opponentSide,
      
      // Game phases and turns
      currentPhase: this.currentPhase,
      clicksRemaining: this.clicksRemaining,
      maxClicks: this.maxClicks,
      turnNumber: this.turnNumber,
      activePlayer: this.activePlayer!,
      
      // Win conditions
      runnerAgendaPoints: this.runnerAgendaPoints,
      corpAgendaPoints: this.corpAgendaPoints,
      agendaPointsToWin: this.agendaPointsToWin,
      runnerCardsRemaining: this.runnerCardsRemaining,
      corpCardsRemaining: this.corpCardsRemaining,
      gameOver: this.gameOver,
      winMessage: this.winMessage,
      
      // Card data
      playerDeck: this.playerDeck,
      handCards: this.handCards,
      playedCards: this.playedCards,
      selectedCardIndex: this.selectedCardIndex,
      
      // Special gameplay flags
      bypassNextIce: this.bypassNextIce,
      nextRunUntraceable: this.nextRunUntraceable,
      currentRun: this.currentRun,
      
      // Command history
      commandHistory: this.commandHistory,
      commandHistoryIndex: this.commandHistoryIndex,

      // Server data
      servers: this.servers
    };
  }

  // Public getter for the renderer
  public getRenderer(): ConsoleRenderer {
    return this.renderer;
  }
} 