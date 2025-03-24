/**
 * Terminal Game - Core game logic for the browser console-based mode
 */

import { Card, createStarterDeck } from './card-data';
import { ConsoleRenderer } from './console-renderer';
import { AIOpponent } from './ai-opponent';
import { GamePhase } from './game-phases';
import {
  Credits,
  MemoryUnits,
  ClickCount,
  TurnNumber,
  AgendaPoints,
  CardCount,
  CardIndex,
  RandomSeed,
  PlayerSide,
  ServerName,
  CommandName,
  GameResources,
  TurnState,
  WinState,
  CardState,
  CommandState,
  GameComponents,
  CommandDoc,
  validCommands,
  PlayedCard,
  Server,
  CommandHandler,
  CommandArguments,
  RunState,
  CardTrigger
} from './game-types';

// Command documentation
interface CommandManPage extends CommandDoc {}

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
  private randomSeed: RandomSeed;
  
  // Game resources
  private playerCredits: Credits = 5;
  private memoryUnitsAvailable: MemoryUnits = 4;
  private memoryUnitsUsed: MemoryUnits = 0;
  private playerSide: PlayerSide = "runner";
  private opponentSide: PlayerSide = "corp";
  
  // Game phases and turns
  private currentPhase: GamePhase = GamePhase.SETUP;
  private clicksRemaining: ClickCount = 0;
  private maxClicks: ClickCount = 4;
  private turnNumber: TurnNumber = 0;
  private activePlayer: PlayerSide | null = null;
  
  // Win conditions
  private runnerAgendaPoints: AgendaPoints = 0;
  private corpAgendaPoints: AgendaPoints = 0;
  private agendaPointsToWin: AgendaPoints = 7;
  private runnerCardsRemaining: CardCount = 0;
  private corpCardsRemaining: CardCount = 30;
  private gameOver: boolean = false;
  private winMessage: string = "";
  
  // Card data
  private playerDeck: Card[] = [];
  private handCards: Card[] = [];
  private playedCards: PlayedCard[] = [];
  private selectedCardIndex: CardIndex = -1;
  
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
  private servers: Record<ServerName, Server> = {};

  // Command handlers map
  private commandHandlers: Record<CommandName, CommandHandler> = {
    help: (args: string[]) => this.cmdHelp({ command: 'help', args, options: {} }),
    man: (args: string[]) => this.cmdMan({ command: 'man', args, options: {} }),
    draw: (args: string[]) => this.cmdDraw({ command: 'draw', args, options: {} }),
    hand: (args: string[]) => this.cmdHand({ command: 'hand', args, options: {} }),
    install: (args: string[]) => this.cmdInstall({ command: 'install', args, options: {} }),
    run: (args: string[]) => this.cmdRun({ command: 'run', args, options: {} }),
    end: (args: string[]) => this.cmdEnd({ command: 'end', args, options: {} }),
    info: (args: string[]) => this.cmdInfo({ command: 'info', args, options: {} }),
    discard: (args: string[]) => this.cmdDiscard({ command: 'discard', args, options: {} }),
    system: (args: string[]) => this.cmdSystem({ command: 'system', args, options: {} }),
    installed: (args: string[]) => this.cmdInstalled({ command: 'installed', args, options: {} }),
    credits: (args: string[]) => this.cmdCredits({ command: 'credits', args, options: {} }),
    memory: (args: string[]) => this.cmdMemory({ command: 'memory', args, options: {} }),
    jack_out: (args: string[]) => this.cmdJackOut({ command: 'jack_out', args, options: {} })
  };

  constructor(randomSeed: RandomSeed = Math.floor(Math.random() * 100000)) {
    this.randomSeed = randomSeed;
    this.renderer = new ConsoleRenderer();
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
  private setRandomSeed(seed: RandomSeed): void {
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
    const serverNames: ServerName[] = ["HQ", "R&D", "Archives"];
    this.servers = serverNames.reduce((acc, name) => {
      acc[name] = {
        name,
        ice: [],
        cards: [],
        root: null
      };
      return acc;
    }, {} as Record<ServerName, Server>);
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
  public startTurn(): void {
    this.clicksRemaining = this.maxClicks;
    this.turnNumber++;
    this.currentPhase = GamePhase.ACTION;
    this.activePlayer = this.playerSide;

    // Reset special flags
    this.bypassNextIce = 0;
    this.nextRunUntraceable = false;

    this.renderer.displayMessage(`Turn ${this.turnNumber} started`);
  }

  /**
   * Process abilities of played cards based on a trigger
   */
  private processCardAbilities(trigger: CardTrigger): void {
    this.playedCards.forEach(card => {
      if (card.type === 'program' && trigger === 'turn_start') {
        if (card.recurringCredits) {
          this.playerCredits = (this.playerCredits + card.recurringCredits) as Credits;
          this.renderer.renderSuccess(`${card.name} generates ${card.recurringCredits} credit(s).`);
        }
      }
    });
  }

  /**
   * Process a command from the user
   */
  public processCommand(command: string): void {
    if (!command.trim()) {
      return;
    }

    // Add to command history
    this.commandHistory.push(command);
    this.commandHistoryIndex = this.commandHistory.length;

    // Parse command and arguments
    const [cmdName, ...args] = command.toLowerCase().split(' ');
    const handler = this.commandHandlers[cmdName as CommandName];

    if (!handler) {
      this.renderer.displayError(`Unknown command: ${cmdName}`);
      return;
    }

    try {
      handler(args);
    } catch (error) {
      this.renderer.displayError(`Error executing command: ${error.message}`);
    }
  }

  /**
   * Check if any win conditions are met
   */
  private checkWinConditions(): void {
    if (this.runnerAgendaPoints >= this.agendaPointsToWin) {
      this.gameOver = true;
      this.winMessage = "Runner wins by agenda points!";
    } else if (this.corpAgendaPoints >= this.agendaPointsToWin) {
      this.gameOver = true;
      this.winMessage = "Corporation wins by agenda points!";
    } else if (this.runnerCardsRemaining <= 0) {
      this.gameOver = true;
      this.winMessage = "Corporation wins by decking the Runner!";
    } else if (this.corpCardsRemaining <= 0) {
      this.gameOver = true;
      this.winMessage = "Runner wins by decking the Corporation!";
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
  private cmdHelp(args: CommandArguments): void {
    if (args.args.length === 0) {
      this.renderer.displayHelp(validCommands);
      return;
    }

    const command = args.args[0] as CommandName;
    if (command in validCommands) {
      this.renderer.displayCommandHelp(command, validCommands[command]);
    } else {
      this.renderer.displayError(`No help available for command: ${command}`);
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
  private cmdDraw(args: CommandArguments): void {
    if (this.clicksRemaining < 1) {
      this.renderer.displayError("Not enough clicks remaining");
      return;
    }

    if (this.playerDeck.length === 0) {
      this.renderer.displayError("No cards left in deck");
      return;
    }

    const card = this.playerDeck.pop()!;
    this.handCards.push(card);
    this.clicksRemaining--;

    this.renderer.displayMessage(`Drew card: ${card.name}`);
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
  private cmdInstall(args: CommandArguments): void {
    if (args.args.length === 0) {
      this.renderer.displayError("Please specify a card index to install");
      return;
    }

    const cardIndex = parseInt(args.args[0], 10) as CardIndex;
    if (isNaN(cardIndex) || cardIndex < 0 || cardIndex >= this.handCards.length) {
      this.renderer.displayError("Invalid card index");
      return;
    }

    if (this.clicksRemaining < 1) {
      this.renderer.displayError("Not enough clicks remaining");
      return;
    }

    const card = this.handCards[cardIndex];
    if (this.playerCredits < card.installCost) {
      this.renderer.displayError("Not enough credits to install this card");
      return;
    }

    if (card.memoryUsage && this.memoryUnitsUsed + card.memoryUsage > this.memoryUnitsAvailable) {
      this.renderer.displayError("Not enough memory units available");
      return;
    }

    // Remove card from hand and add to played cards
    this.handCards.splice(cardIndex, 1);
    this.playedCards.push({
      ...card,
      installed: true,
      faceUp: true
    });

    // Update resources
    this.playerCredits -= card.installCost;
    if (card.memoryUsage) {
      this.memoryUnitsUsed += card.memoryUsage;
    }
    this.clicksRemaining--;

    this.renderer.displayMessage(`Installed ${card.name}`);
  }

  /**
   * Command handler for 'run'
   */
  private cmdRun(args: CommandArguments): void {
    if (args.args.length === 0) {
      this.renderer.displayError("Please specify a server to run on");
      return;
    }

    const serverName = args.args[0] as ServerName;
    const server = this.servers[serverName];
    
    if (!server) {
      this.renderer.displayError(`Unknown server: ${serverName}`);
      return;
    }

    if (this.clicksRemaining < 1) {
      this.renderer.displayError("Not enough clicks remaining");
      return;
    }

    if (this.currentRun) {
      this.renderer.displayError("Already in a run");
      return;
    }

    this.currentRun = {
      active: true,
      server: serverName,
      phase: 'approach',
      encounterIndex: 0,
      bypassNextIce: this.bypassNextIce > 0,
      untraceable: this.nextRunUntraceable
    };

    this.clicksRemaining--;
    this.bypassNextIce = Math.max(0, this.bypassNextIce - 1);
    this.nextRunUntraceable = false;

    this.renderer.displayMessage(`Starting run on ${serverName}`);
    this.processRun();
  }

  /**
   * Process the current run
   */
  private processRun(): void {
    if (!this.currentRun) {
      return;
    }

    const server = this.servers[this.currentRun.server];
    switch (this.currentRun.phase) {
      case "approach":
        if (server.ice.length > 0) {
          this.currentRun.phase = "encounter";
          this.renderer.displayMessage("Encountering ICE...");
        } else {
          this.currentRun.phase = "access";
          this.renderer.displayMessage("Accessing server...");
        }
        break;

      case "encounter":
        if (this.currentRun.bypassNextIce) {
          this.currentRun.encounterIndex++;
          if (this.currentRun.encounterIndex >= server.ice.length) {
            this.currentRun.phase = "access";
            this.renderer.displayMessage("Accessing server...");
          }
        }
        break;

      case "access":
        // Handle server access
        this.accessServer(this.currentRun.server);
        this.currentRun = null;
        break;
    }
  }

  /**
   * Access a server during a run
   */
  private accessServer(serverName: ServerName): void {
    const server = this.servers[serverName];
    if (!server) {
      return;
    }

    this.renderer.displayMessage(`Accessed ${serverName}`);
    // Additional server access logic here
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
  private cmdDiscard(args: CommandArguments): void {
    if (args.args.length === 0) {
      this.renderer.renderError("Please specify which card to discard. Example: discard 2");
      return;
    }
    
    const cardIndex = parseInt(args.args[0]);
    if (isNaN(cardIndex) || cardIndex < 0 || cardIndex >= this.handCards.length) {
      this.renderer.renderError(`Invalid card index: ${args.args[0]}`);
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
  private cmdCredits(args: CommandArguments): void {
    this.renderer.displayMessage(`Credits available: ${this.playerCredits}`);
  }

  /**
   * Command handler for 'memory'
   */
  private cmdMemory(args: CommandArguments): void {
    this.renderer.displayMessage(
      `Memory units: ${this.memoryUnitsUsed}/${this.memoryUnitsAvailable} used`
    );
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
      resources: {
        credits: this.playerCredits,
        memoryAvailable: this.memoryUnitsAvailable,
        memoryUsed: this.memoryUnitsUsed
      },
      turn: {
        phase: this.currentPhase,
        clicksRemaining: this.clicksRemaining,
        maxClicks: this.maxClicks,
        turnNumber: this.turnNumber,
        activePlayer: this.activePlayer
      },
      win: {
        runnerAgendaPoints: this.runnerAgendaPoints,
        corpAgendaPoints: this.corpAgendaPoints,
        agendaPointsToWin: this.agendaPointsToWin,
        runnerCardsRemaining: this.runnerCardsRemaining,
        corpCardsRemaining: this.corpCardsRemaining,
        gameOver: this.gameOver,
        winMessage: this.winMessage
      },
      cards: {
        playerDeck: this.playerDeck,
        handCards: this.handCards,
        playedCards: this.playedCards,
        selectedCardIndex: this.selectedCardIndex
      },
      run: this.currentRun,
      command: {
        history: this.commandHistory,
        historyIndex: this.commandHistoryIndex
      },
      components: {
        renderer: this.renderer,
        aiOpponent: this.aiOpponent
      },
      servers: this.servers
    };
  }

  // Public getter for the renderer
  public getRenderer(): ConsoleRenderer {
    return this.renderer;
  }

  /**
   * Initialize a new game
   */
  public initGame(): void {
    // Initialize player resources
    this.playerCredits = 5 as Credits;
    this.memoryUnitsAvailable = 4 as MemoryUnits;
    this.memoryUnitsUsed = 0 as MemoryUnits;
    this.clicksRemaining = 0 as ClickCount;
    this.maxClicks = 4 as ClickCount;
    this.turnNumber = 0 as TurnNumber;

    // Initialize win conditions
    this.runnerAgendaPoints = 0 as AgendaPoints;
    this.corpAgendaPoints = 0 as AgendaPoints;
    this.agendaPointsToWin = 7 as AgendaPoints;
    this.runnerCardsRemaining = 0 as CardCount;
    this.corpCardsRemaining = 30 as CardCount;

    // Initialize game state
    this.currentPhase = GamePhase.SETUP;
    this.activePlayer = null;
    this.gameOver = false;
    this.winMessage = "";

    // Initialize card collections
    this.playerDeck = createStarterDeck();
    this.handCards = [];
    this.playedCards = [];
    this.selectedCardIndex = -1 as CardIndex;

    // Initialize special flags
    this.bypassNextIce = 0;
    this.nextRunUntraceable = false;
    this.currentRun = null;

    // Initialize servers
    this.initializeServers();

    // Initialize AI opponent
    this.aiOpponent = new AIOpponent();

    this.renderer.displayMessage("Game initialized");
  }

  /**
   * End the current turn
   */
  public endTurn(): void {
    if (this.currentRun) {
      this.renderer.displayError("Cannot end turn during a run");
      return;
    }

    this.currentPhase = GamePhase.CLEANUP;
    this.clicksRemaining = 0;
    this.activePlayer = null;

    // Process end of turn effects
    this.processEndOfTurn();

    this.renderer.displayMessage(`Turn ${this.turnNumber} ended`);
  }

  /**
   * Process end of turn effects
   */
  private processEndOfTurn(): void {
    // Process recurring credits
    this.playedCards.forEach(card => {
      if (card.recurringCredits) {
        this.playerCredits = (this.playerCredits + card.recurringCredits) as Credits;
      }
    });

    // Check win conditions
    this.checkWinConditions();
  }

  // Getters
  public getPlayerCredits(): number {
    return this.playerCredits;
  }

  public getMemoryUnitsAvailable(): number {
    return this.memoryUnitsAvailable;
  }

  public getMemoryUnitsUsed(): number {
    return this.memoryUnitsUsed;
  }

  public getPlayerSide(): string {
    return this.playerSide;
  }

  public getCurrentPhase(): GamePhase {
    return this.currentPhase;
  }

  public getPlayerDeck(): Card[] {
    return this.playerDeck;
  }

  public getHandCards(): Card[] {
    return this.handCards;
  }

  public getPlayedCards(): PlayedCard[] {
    return this.playedCards;
  }

  public getServers(): Record<ServerName, Server> {
    return this.servers;
  }

  public getCurrentRun(): RunState | null {
    return this.currentRun;
  }

  public getWinMessage(): string {
    return this.winMessage;
  }

  // Setters (for testing)
  public setClicksRemaining(clicks: number): void {
    this.clicksRemaining = clicks;
  }

  public setCurrentPhase(phase: GamePhase): void {
    this.currentPhase = phase;
  }

  public setHandCards(cards: Card[]): void {
    this.handCards = cards;
  }

  public setPlayerDeck(cards: Card[]): void {
    this.playerDeck = cards;
  }

  public setRunnerAgendaPoints(points: number): void {
    this.runnerAgendaPoints = points;
  }

  public setCorpAgendaPoints(points: number): void {
    this.corpAgendaPoints = points;
  }

  public setPlayerCredits(credits: number): void {
    this.playerCredits = credits;
  }

  public getClicksRemaining(): ClickCount {
    return this.clicksRemaining;
  }
} 