import { TerminalGame } from './terminal-game/terminal-game';

// Variable to store the game instance
let game: TerminalGame | null = null;

// Function to initialize and start the game
function initializeGame() {
  // Clear console before starting
  console.clear();

  // Initialize the terminal game with a random seed
  const randomSeed = Math.floor(Math.random() * 1000000);
  game = new TerminalGame(randomSeed);

  // Start the game
  game.initialize();

  // Add a message about how to play the game
  console.log("%cTo play, type commands in the browser console after the '>' prompt.", 'color: #4CAF50; font-weight: bold');
  console.log("%cFor example, type 'help' and press Enter to see available commands.", 'color: #4CAF50;');

  // Display instructions for how to input commands
  console.log("");
  console.log("%cTo enter commands, call the following function:", 'color: #2196F3; font-weight: bold');
  console.log("%cprocessCommand('your command here')", 'color: #2196F3; font-style: italic');
  console.log("%cFor example: processCommand('draw')", 'color: #2196F3;');
}

// Create a function to handle console input
(window as any).processCommand = function(command: string) {
  if (game && command && typeof command === 'string') {
    game.processCommand(command);
  } else {
    console.error("Game not initialized or invalid command. Please provide a valid command as a string.");
  }
};

// Add an HTML element to provide instructions on the page
document.addEventListener('DOMContentLoaded', () => {
  // Add event listener for the start game button
  const startButton = document.getElementById('start-game');
  if (startButton) {
    startButton.addEventListener('click', () => {
      // Hide the menu container
      const menuContainer = document.querySelector('.menu-container');
      if (menuContainer) {
        (menuContainer as HTMLElement).style.display = 'none';
      }
      
      // Initialize the game
      initializeGame();
      
      // Create and show the game instructions
      const container = document.createElement('div');
      container.id = 'game-instructions';
      container.style.padding = '30px';
      container.style.fontFamily = 'monospace';
      container.style.maxWidth = '800px';
      container.style.margin = '0 auto';
      container.style.textAlign = 'center';
      container.style.backgroundColor = '#222';
      container.style.color = '#fff';
      container.style.borderRadius = '10px';
      container.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
      container.style.marginTop = '50px';
      
      const title = document.createElement('h1');
      title.textContent = 'Neon Dominance - Browser Console Game';
      title.style.color = '#00ffff';
      title.style.textShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
      title.style.fontSize = '28px';
      title.style.marginBottom = '20px';
      
      const instructions = document.createElement('p');
      instructions.style.fontSize = '16px';
      instructions.style.lineHeight = '1.6';
      instructions.style.marginBottom = '30px';
      instructions.innerHTML = `
        <strong style="color: #00ffff; font-size: 20px;">This game runs in your browser console!</strong><br><br>
        1. Open your browser's Developer Tools (<strong>F12</strong> or <strong>Ctrl+Shift+I</strong> / <strong>Cmd+Option+I</strong>)<br>
        2. Navigate to the "<strong style="color: #00ffff;">Console</strong>" tab<br>
        3. The game has already started in the console<br>
        4. Use the console to enter commands like: <code style="background: #333; padding: 2px 6px; border-radius: 4px;">processCommand('help')</code>
      `;
      
      const examples = document.createElement('div');
      examples.style.marginTop = '20px';
      examples.style.textAlign = 'left';
      examples.style.backgroundColor = '#333';
      examples.style.padding = '20px';
      examples.style.borderRadius = '5px';
      examples.style.fontSize = '16px';
      examples.style.lineHeight = '1.8';
      
      examples.innerHTML = `
        <strong style="color: #00ffff; font-size: 18px;">Example commands:</strong><br>
        <code style="display: block; margin: 10px 0; background: #222; padding: 8px; border-radius: 4px;">processCommand('help')</code> - List all available commands<br>
        <code style="display: block; margin: 10px 0; background: #222; padding: 8px; border-radius: 4px;">processCommand('draw')</code> - Draw a card<br>
        <code style="display: block; margin: 10px 0; background: #222; padding: 8px; border-radius: 4px;">processCommand('hand')</code> - View your hand<br>
        <code style="display: block; margin: 10px 0; background: #222; padding: 8px; border-radius: 4px;">processCommand('install 0')</code> - Install the first card from your hand
      `;
      
      // Add a reminder button to open console
      const consoleButton = document.createElement('button');
      consoleButton.textContent = 'Open Developer Console (F12)';
      consoleButton.style.backgroundColor = '#00bcd4';
      consoleButton.style.color = 'white';
      consoleButton.style.border = 'none';
      consoleButton.style.padding = '10px 20px';
      consoleButton.style.borderRadius = '5px';
      consoleButton.style.cursor = 'pointer';
      consoleButton.style.fontSize = '16px';
      consoleButton.style.marginTop = '20px';
      consoleButton.style.fontWeight = 'bold';
      consoleButton.onclick = () => alert('Press F12 (Windows/Linux) or Cmd+Option+I (Mac) to open the developer console');
      
      container.appendChild(title);
      container.appendChild(instructions);
      container.appendChild(examples);
      container.appendChild(consoleButton);
      
      document.body.appendChild(container);
    });
  }
  
  // Add event listeners for other menu buttons
  const optionsButton = document.getElementById('options');
  if (optionsButton) {
    optionsButton.addEventListener('click', () => {
      alert('Options are not implemented yet.');
    });
  }
  
  const aboutButton = document.getElementById('about');
  if (aboutButton) {
    aboutButton.addEventListener('click', () => {
      alert('Neon Dominance is a cyberpunk card game inspired by Android: Netrunner. Play as a hacker running against corporate servers in a dystopian future.');
    });
  }
}); 