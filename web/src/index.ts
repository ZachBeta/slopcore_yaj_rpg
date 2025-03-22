import { TerminalGame } from './terminal-game/terminal-game';
import { ThreeScene } from './three-scene';

// Define the global interface for the window object
declare global {
  interface Window {
    processCommand: (command: string) => void;
  }
}

// Variables to store the game and scene instances
let game: TerminalGame | null = null;
let threeScene: ThreeScene | null = null;

// Function to initialize the Three.js scene
function initializeThreeScene(): void {
  // Create and start the Three.js scene
  threeScene = new ThreeScene('canvas-container');
  threeScene.start();
}

// Function to initialize and start the game
function initializeGame(): void {
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
window.processCommand = function(command: string): void {
  if (game && command && typeof command === 'string') {
    game.processCommand(command);
  } else {
    console.error("Game not initialized or invalid command. Please provide a valid command as a string.");
  }
};

// Add an HTML element to provide instructions on the page
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the Three.js scene as soon as the DOM is loaded
  initializeThreeScene();
  
  // Add event listener for the start game button
  const startButton = document.getElementById('start-game');
  if (startButton) {
    startButton.addEventListener('click', () => {
      // Hide the menu container
      const menuContainer = document.querySelector('.menu-container');
      if (menuContainer instanceof HTMLElement) {
        menuContainer.style.display = 'none';
      }
      
      // Initialize the game
      initializeGame();
      
      // Create and show the game instructions
      createGameInstructions();
    });
  }
  
  // Add a demo mode button
  const demoButton = document.createElement('button');
  demoButton.className = 'btn';
  demoButton.id = 'demo-mode';
  demoButton.textContent = 'Demo Mode';
  demoButton.style.backgroundColor = '#9933cc';
  
  // Insert the demo button after the start game button
  if (startButton && startButton.parentNode) {
    startButton.parentNode.insertBefore(demoButton, startButton.nextSibling);
  }
  
  // Add event listener for the demo button
  demoButton.addEventListener('click', () => {
    // Hide the menu container
    const menuContainer = document.querySelector('.menu-container');
    if (menuContainer instanceof HTMLElement) {
      menuContainer.style.display = 'none';
    }
    
    // Initialize the game
    initializeGame();
    
    // Create and show the game instructions
    createGameInstructions();
    
    // Start the demo mode after a short delay
    setTimeout(() => {
      // Access the renderer through the game's public API
      if (game && game.getRenderer && typeof game.getRenderer === 'function') {
        const renderer = game.getRenderer();
        if (renderer && typeof renderer.startDemoMode === 'function') {
          renderer.startDemoMode();
        }
      }
    }, 2000);
  });
  
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

// Function to create game instructions panel
function createGameInstructions(): void {
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
  
  // Create DOM elements instead of using innerHTML for better security
  const instructionsText = document.createTextNode('This game runs in your browser console!');
  const strongText = document.createElement('strong');
  strongText.style.color = '#00ffff';
  strongText.style.fontSize = '20px';
  strongText.appendChild(instructionsText);
  
  instructions.appendChild(strongText);
  instructions.appendChild(document.createElement('br'));
  instructions.appendChild(document.createElement('br'));
  
  // Add instruction steps
  const steps = [
    '1. Open your browser\'s Developer Tools (',
    'F12',
    ' or ',
    'Ctrl+Shift+I',
    ' / ',
    'Cmd+Option+I',
    ')',
    '2. Navigate to the "',
    'Console',
    '" tab',
    '3. The game has already started in the console',
    '4. Use the console to enter commands like: ',
    'processCommand(\'help\')'
  ];
  
  for (let i = 0; i < steps.length; i++) {
    if (i === 1 || i === 3 || i === 5 || i === 8 || i === 12) {
      const strong = document.createElement('strong');
      if (i === 8) strong.style.color = '#00ffff';
      strong.textContent = steps[i];
      instructions.appendChild(strong);
    } else if (i === 6 || i === 9 || i === 10 || i === 11) {
      instructions.appendChild(document.createTextNode(steps[i]));
      instructions.appendChild(document.createElement('br'));
    } else if (i === 12) {
      const code = document.createElement('code');
      code.style.background = '#333';
      code.style.padding = '2px 6px';
      code.style.borderRadius = '4px';
      code.textContent = steps[i];
      instructions.appendChild(code);
    } else {
      instructions.appendChild(document.createTextNode(steps[i]));
    }
  }
  
  const examples = document.createElement('div');
  examples.style.marginTop = '20px';
  examples.style.textAlign = 'left';
  examples.style.backgroundColor = '#333';
  examples.style.padding = '20px';
  examples.style.borderRadius = '5px';
  examples.style.fontSize = '16px';
  examples.style.lineHeight = '1.8';
  
  // Create examples using DOM methods instead of innerHTML
  const examplesTitle = document.createElement('strong');
  examplesTitle.style.color = '#00ffff';
  examplesTitle.style.fontSize = '18px';
  examplesTitle.textContent = 'Example commands:';
  examples.appendChild(examplesTitle);
  examples.appendChild(document.createElement('br'));
  
  // Create example commands
  const exampleCommands = [
    { cmd: 'processCommand(\'help\')', desc: ' - List all available commands' },
    { cmd: 'processCommand(\'draw\')', desc: ' - Draw a card' },
    { cmd: 'processCommand(\'hand\')', desc: ' - View your hand' },
    { cmd: 'processCommand(\'install 0\')', desc: ' - Install the first card from your hand' }
  ];
  
  exampleCommands.forEach(example => {
    const code = document.createElement('code');
    code.style.display = 'block';
    code.style.margin = '10px 0';
    code.style.background = '#222';
    code.style.padding = '8px';
    code.style.borderRadius = '4px';
    code.textContent = example.cmd;
    
    examples.appendChild(code);
    examples.appendChild(document.createTextNode(example.desc));
    examples.appendChild(document.createElement('br'));
  });
  
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
} 