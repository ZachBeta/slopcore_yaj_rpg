/**
 * Console Renderer - Handles all text output for the browser console version of the game
 */

// Console colors - using CSS styling for browser console
export const Colors = {
  BLACK: 'color: black',
  RED: 'color: red',
  GREEN: 'color: green',
  YELLOW: 'color: #f39c12',
  BLUE: 'color: blue',
  MAGENTA: 'color: magenta',
  CYAN: 'color: cyan',
  WHITE: 'color: white',
  BRIGHT_RED: 'color: #ff5252; font-weight: bold',
  BRIGHT_GREEN: 'color: #2ecc71; font-weight: bold',
  BRIGHT_YELLOW: 'color: #f1c40f; font-weight: bold',
  BRIGHT_BLUE: 'color: #3498db; font-weight: bold',
  BRIGHT_MAGENTA: 'color: #9b59b6; font-weight: bold',
  BRIGHT_CYAN: 'color: #00bcd4; font-weight: bold',
  BRIGHT_WHITE: 'color: white; font-weight: bold',
  BOLD: 'font-weight: bold',
  RESET: '',
  HEADING: 'color: #00bcd4; font-weight: bold; font-size: 1.2em',
  INFO: 'color: #3498db',
  SUCCESS: 'color: #2ecc71; font-weight: bold',
  WARNING: 'color: #f39c12; font-weight: bold',
  ERROR: 'color: #ff5252; font-weight: bold',
  CARD: 'color: #9b59b6; background-color: rgba(155, 89, 182, 0.1); padding: 2px',
  SERVER: 'color: #e67e22; font-weight: bold',
  CREDITS: 'color: #f1c40f; font-weight: bold',
  MEMORY: 'color: #3498db; font-weight: bold',
  ICE: 'color: #00bcd4; font-weight: bold',
};

export class ConsoleRenderer {
  private commandPrefix: string = '>';
  private colors = {
    info: 'color: #88CCEE; font-size: 14px;',
    success: 'color: #44FF88; font-size: 14px; font-weight: bold;',
    error: 'color: #FF5555; font-size: 14px; font-weight: bold;',
    warning: 'color: #FFAA44; font-size: 14px;',
    highlight: 'color: #FFDD44; font-size: 14px; font-weight: bold;',
    subtle: 'color: #AAAAAA; font-size: 14px;',
    command: 'color: #FFFFFF; font-size: 14px; font-weight: bold; background-color: #333;',
    stats: 'color: #44DDFF; font-size: 14px;',
    prompt: 'color: #00FF99; font-size: 14px; font-weight: bold;',
    card: 'color: #DD88FF; font-size: 14px; font-weight: bold;',
    phase: 'color: #FF88AA; font-size: 14px; font-weight: bold;',
    credit: 'color: #FFCC44; font-size: 14px;',
    memory: 'color: #88AAFF; font-size: 14px;',
    system: 'color: #AACCDD; font-size: 14px;',
    trace: 'color: #FF6677; font-size: 14px; font-weight: bold;'
  };

  /**
   * Constructor for the console renderer
   */
  constructor() {
    // Apply some styling to the console to make it more readable
    this.applyConsoleStyles();
  }

  /**
   * Apply styling to make the console more readable
   */
  private applyConsoleStyles(): void {
    // Increase console text size and improve readability with these styles
    console.log("%cConsole styling applied for better readability", 
      "color: #00ffff; font-size: 14px; font-weight: bold; background-color: #222; padding: 5px;");
    
    // Try to apply styles to body element to make console more visible
    try {
      if (document.body) {
        document.body.style.backgroundColor = "#121212";
        
        // Create a tip at the top of the page
        const consoleTip = document.createElement('div');
        consoleTip.style.position = 'fixed';
        consoleTip.style.top = '10px';
        consoleTip.style.right = '10px';
        consoleTip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        consoleTip.style.color = '#00ffff';
        consoleTip.style.padding = '10px';
        consoleTip.style.borderRadius = '5px';
        consoleTip.style.zIndex = '9999';
        consoleTip.style.fontSize = '14px';
        consoleTip.style.fontFamily = 'monospace';
        consoleTip.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
        consoleTip.innerHTML = 'Press <strong>F12</strong> to open the console';
        
        // Create a menu button to return to main screen
        const menuButton = document.createElement('div');
        menuButton.style.position = 'fixed';
        menuButton.style.top = '10px';
        menuButton.style.left = '10px';
        menuButton.style.backgroundColor = 'rgba(0, 170, 255, 0.9)';
        menuButton.style.color = 'white';
        menuButton.style.padding = '10px 15px';
        menuButton.style.borderRadius = '5px';
        menuButton.style.zIndex = '9999';
        menuButton.style.fontSize = '14px';
        menuButton.style.fontFamily = 'Arial, sans-serif';
        menuButton.style.fontWeight = 'bold';
        menuButton.style.cursor = 'pointer';
        menuButton.style.boxShadow = '0 0 10px rgba(0, 170, 255, 0.3)';
        menuButton.textContent = '≡ MENU';
        menuButton.title = 'Open Menu';

        // Add click event to show menu options
        menuButton.addEventListener('click', () => this.showMenuOptions());
        
        document.body.appendChild(consoleTip);
        document.body.appendChild(menuButton);
      }
    } catch (e) {
      // Ignore any errors with DOM manipulation
    }
  }

  /**
   * Show menu options in a modal dialog
   */
  private showMenuOptions(): void {
    try {
      // Create modal overlay
      const modalOverlay = document.createElement('div');
      modalOverlay.style.position = 'fixed';
      modalOverlay.style.top = '0';
      modalOverlay.style.left = '0';
      modalOverlay.style.width = '100%';
      modalOverlay.style.height = '100%';
      modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      modalOverlay.style.zIndex = '10000';
      modalOverlay.style.display = 'flex';
      modalOverlay.style.justifyContent = 'center';
      modalOverlay.style.alignItems = 'center';

      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.style.width = '300px';
      modalContent.style.backgroundColor = '#1a1a2e';
      modalContent.style.borderRadius = '10px';
      modalContent.style.padding = '20px';
      modalContent.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.4)';
      modalContent.style.border = '1px solid rgba(0, 200, 255, 0.2)';

      // Create title
      const title = document.createElement('h2');
      title.textContent = 'Game Menu';
      title.style.color = '#00ffff';
      title.style.margin = '0 0 20px 0';
      title.style.textAlign = 'center';
      title.style.fontFamily = 'Arial, sans-serif';
      title.style.fontSize = '20px';

      // Create button styles
      const buttonStyle = `
        display: block;
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        background-color: #0088cc;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-family: Arial, sans-serif;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.2s ease;
        text-align: center;
      `;

      // Create menu buttons
      const continueButton = document.createElement('button');
      continueButton.textContent = 'Continue Game';
      continueButton.style.cssText = buttonStyle;
      continueButton.style.backgroundColor = '#00aa88';
      continueButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
      });

      const resetButton = document.createElement('button');
      resetButton.textContent = 'Restart Game';
      resetButton.style.cssText = buttonStyle;
      resetButton.addEventListener('click', () => {
        location.reload();
      });

      const mainMenuButton = document.createElement('button');
      mainMenuButton.textContent = 'Return to Main Menu';
      mainMenuButton.style.cssText = buttonStyle;
      mainMenuButton.style.backgroundColor = '#cc5500';
      mainMenuButton.addEventListener('click', () => {
        // Show the main menu container again
        const menuContainer = document.querySelector('.menu-container');
        if (menuContainer) {
          (menuContainer as HTMLElement).style.display = 'block';
          
          // Remove any game instructions that might have been added
          const gameInstructions = document.querySelectorAll('body > div:not(.menu-container):not(#canvas-container)');
          gameInstructions.forEach(el => {
            if (el !== modalOverlay) {
              document.body.removeChild(el);
            }
          });
        }
        
        document.body.removeChild(modalOverlay);
        console.clear();
      });

      // Append elements to modal
      modalContent.appendChild(title);
      modalContent.appendChild(continueButton);
      modalContent.appendChild(resetButton);
      modalContent.appendChild(mainMenuButton);
      modalOverlay.appendChild(modalContent);

      // Add click event to close when clicking outside
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          document.body.removeChild(modalOverlay);
        }
      });

      document.body.appendChild(modalOverlay);

    } catch (e) {
      // Ignore any errors with DOM manipulation
    }
  }

  /**
   * Display the command prompt
   */
  public showPrompt(): void {
    console.log(`%c${this.commandPrefix}`, this.colors.prompt);
  }

  /**
   * Render a message with stylized formatting
   * @param message The message to display
   * @param type The type of message (error, warning, success, info)
   */
  public renderMessage(message: string, type: 'error' | 'warning' | 'success' | 'info' = 'info'): void {
    console.log(`%c${message}`, this.colors[type]);
  }

  /**
   * Render an error message
   * @param message The error message
   */
  public renderError(message: string): void {
    this.renderMessage(`Error: ${message}`, 'error');
  }

  /**
   * Render a warning message
   * @param message The warning message
   */
  public renderWarning(message: string): void {
    this.renderMessage(`Warning: ${message}`, 'warning');
  }

  /**
   * Render a success message
   * @param message The success message
   */
  public renderSuccess(message: string): void {
    this.renderMessage(message, 'success');
  }

  /**
   * Render the player's hand of cards
   * @param hand The array of cards in the player's hand
   */
  public renderHand(hand: any[]): void {
    if (hand.length === 0) {
      this.renderMessage('Your hand is empty.', 'info');
      return;
    }

    console.log('%cYOUR HAND:', this.colors.info);
    hand.forEach((card, index) => {
      console.log(
        `%c[${index}] ${card.name} - ${card.type} - Cost: ${card.cost}`,
        this.colors.card
      );
      console.log(`    ${card.description || 'No description'}`);
    });
  }

  /**
   * Render installed cards
   * @param installed The array of installed cards
   */
  public renderInstalledCards(installed: any[]): void {
    if (installed.length === 0) {
      this.renderMessage('No cards installed.', 'info');
      return;
    }

    console.log('%cINSTALLED CARDS:', this.colors.info);
    installed.forEach((card, index) => {
      console.log(
        `%c[${index}] ${card.name} - ${card.type}`,
        this.colors.card
      );
      if (card.memoryUsage) {
        console.log(`    Memory Usage: ${card.memoryUsage} MU`);
      }
    });
  }

  /**
   * Render the current game phase
   * @param phase The current game phase
   * @param turn The current turn number
   */
  public renderPhase(phase: string, turn: number): void {
    console.log(`%c=== TURN ${turn} - ${phase.toUpperCase()} PHASE ===`, this.colors.phase);
  }

  /**
   * Render game stats (credits, memory, etc.)
   * @param stats The game stats object
   */
  public renderGameStats(stats: { 
    credits: number; 
    memory: { total: number; used: number };
    agendaPoints: number;
    clicksRemaining: number;
  }): void {
    console.log('%cGAME STATUS:', this.colors.info);
    console.log(`%cCredits: ${stats.credits}`, this.colors.credit);
    console.log(`%cMemory: ${stats.memory.used}/${stats.memory.total} MU`, this.colors.memory);
    console.log(`%cAgenda Points: ${stats.agendaPoints}/7`, this.colors.success);
    console.log(`%cClicks Remaining: ${stats.clicksRemaining}`, this.colors.info);
  }

  /**
   * Render the help menu
   * @param commands The available commands and their descriptions
   */
  public renderHelp(commands: Record<string, string>): void {
    console.log('%cAVAILABLE COMMANDS:', this.colors.info);
    Object.entries(commands).forEach(([command, description]) => {
      console.log(`%c${command}`, 'font-weight: bold');
      console.log(`    ${description}`);
    });
  }

  /**
   * Render system status
   * @param status The system status information
   */
  public renderSystemStatus(status: {
    neuralInterface: string;
    traceDetection: number;
    securityLevel: string;
  }): void {
    console.log('%cSYSTEM STATUS:', this.colors.system);
    console.log(`  Neural Interface: ${status.neuralInterface}`);
    console.log(`%c  Trace Detection: ${status.traceDetection}%`, this.colors.trace);
    console.log(`  Security Level: ${status.securityLevel}`);
  }

  /**
   * Clear the console
   */
  public clearConsole(): void {
    console.clear();
  }

  /**
   * Render ASCII art banner for the game
   */
  public renderBanner(): void {
    console.log("%c███╗   ██╗███████╗ ██████╗ ███╗   ██╗    ██████╗  ██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ███╗   ██╗ ██████╗███████╗", 
      "color: #00ffff; font-weight: bold;");
    console.log("%c████╗  ██║██╔════╝██╔═══██╗████╗  ██║    ██╔══██╗██╔═══██╗████╗ ████║██║████╗  ██║██╔══██╗████╗  ██║██╔════╝██╔════╝", 
      "color: #00ffff; font-weight: bold;");
    console.log("%c██╔██╗ ██║█████╗  ██║   ██║██╔██╗ ██║    ██║  ██║██║   ██║██╔████╔██║██║██╔██╗ ██║███████║██╔██╗ ██║██║     █████╗  ", 
      "color: #00ffff; font-weight: bold;");
    console.log("%c██║╚██╗██║██╔══╝  ██║   ██║██║╚██╗██║    ██║  ██║██║   ██║██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║╚██╗██║██║     ██╔══╝  ", 
      "color: #00ffff; font-weight: bold;");
    console.log("%c██║ ╚████║███████╗╚██████╔╝██║ ╚████║    ██████╔╝╚██████╔╝██║ ╚═╝ ██║██║██║ ╚████║██║  ██║██║ ╚████║╚██████╗███████╗", 
      "color: #00ffff; font-weight: bold;");
    console.log("%c╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝    ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝", 
      "color: #00ffff; font-weight: bold;");
    console.log("%c                                       A CYBERPUNK HACKING CARD GAME                                                  ", 
      "color: #ffffff; background-color: #222; font-size: 14px;");
    console.log("");
  }
} 