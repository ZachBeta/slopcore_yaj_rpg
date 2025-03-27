import { TerminalGame } from './terminal-game/terminal-game';
import { ThreeScene } from './three-scene';
import { OpenWorldGame } from './open-world/open-world';
import { AudioManager } from './audio-manager';
import { AudioControls } from './audio-controls';

// Define the global interface for the window object
declare global {
  interface Window {
    processCommand: (command: string) => void;
  }
}

// Variables to store the game and scene instances
let game: TerminalGame | null = null;
let threeScene: ThreeScene | null = null;
let openWorldGame: OpenWorldGame | null = null;

// Function to initialize the Three.js scene
function initializeThreeScene(): void {
  // Create and start the Three.js scene
  threeScene = new ThreeScene('canvas-container');
  threeScene.start();
}

// Function to initialize and start the terminal game
function initializeGame(): void {
  // Clear console before starting
  console.clear();

  // Initialize the terminal game with a random seed
  const randomSeed = Math.floor(Math.random() * 1000000);
  game = new TerminalGame(randomSeed);

  // Start the game
  game.initialize();

  // Add a message about how to play the game
  console.log(
    "%cTo play, type commands in the browser console after the '>' prompt.",
    'color: #4CAF50; font-weight: bold',
  );
  console.log(
    "%cFor example, type 'help' and press Enter to see available commands.",
    'color: #4CAF50;',
  );

  // Display instructions for how to input commands
  console.log('');
  console.log(
    '%cTo enter commands, call the following function:',
    'color: #2196F3; font-weight: bold',
  );
  console.log("%cprocessCommand('your command here')", 'color: #2196F3; font-style: italic');
  console.log("%cFor example: processCommand('draw')", 'color: #2196F3;');
}

// Function to initialize the open world game
function initializeOpenWorldGame(): void {
  // Hide the menu container
  const menuContainer = document.querySelector('.menu-container');
  if (menuContainer instanceof HTMLElement) {
    menuContainer.style.display = 'none';
  }

  // Remove the game instructions if they exist
  const gameInstructions = document.getElementById('game-instructions');
  if (gameInstructions) {
    gameInstructions.remove();
  }

  // Hide the Three.js scene if it's active
  if (threeScene) {
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
      canvasContainer.style.display = 'none';
    }
  }

  // Create a container for the open world game
  const openWorldContainer = document.createElement('div');
  openWorldContainer.id = 'open-world-container';
  openWorldContainer.style.position = 'absolute';
  openWorldContainer.style.top = '0';
  openWorldContainer.style.left = '0';
  openWorldContainer.style.width = '100%';
  openWorldContainer.style.height = '100%';
  document.body.appendChild(openWorldContainer);

  // Initialize and start the open world game
  openWorldGame = new OpenWorldGame('open-world-container');
  openWorldGame.start();

  // Add a back button to return to the main menu
  const backButton = document.createElement('button');
  backButton.className = 'btn';
  backButton.textContent = 'Back to Menu';
  backButton.style.position = 'absolute';
  backButton.style.top = '10px';
  backButton.style.left = '10px';
  backButton.style.zIndex = '1000';
  backButton.style.backgroundColor = '#222';
  backButton.style.color = '#fff';
  backButton.style.border = '1px solid #444';
  backButton.style.padding = '8px 16px';
  backButton.style.borderRadius = '4px';
  backButton.style.cursor = 'pointer';

  backButton.addEventListener('click', () => {
    // Stop and cleanup the open world game
    if (openWorldGame) {
      openWorldGame.dispose();
      openWorldGame = null;
    }

    // Remove the open world container
    openWorldContainer.remove();

    // Show the menu container again
    if (menuContainer instanceof HTMLElement) {
      menuContainer.style.display = 'flex';
    }

    // Show the Three.js scene again
    if (threeScene) {
      const canvasContainer = document.getElementById('canvas-container');
      if (canvasContainer) {
        canvasContainer.style.display = 'block';
      }
    }

    // Remove the back button
    backButton.remove();
  });

  document.body.appendChild(backButton);
}

// Define interface for globalThis to support processCommand
interface ProcessCommandGlobal {
  processCommand: (command: string) => void;
}

// Create a function to handle console input
(globalThis as unknown as ProcessCommandGlobal).processCommand = function (command: string): void {
  if (game && command && typeof command === 'string') {
    game.processCommand(command);
  } else {
    console.error(
      'Game not initialized or invalid command. Please provide a valid command as a string.',
    );
  }
};

// Initialize audio for the menu
function initializeAudio(): void {
  // Add audio controls to the menu container
  try {
    new AudioControls('canvas-container', 'top-right');
  } catch (error) {
    console.error('Failed to initialize audio controls:', error);
  }
}

// Add an HTML element to provide instructions on the page
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the Three.js scene as soon as the DOM is loaded
  initializeThreeScene();

  // Initialize audio for the menu
  initializeAudio();

  // Add event listener for the start game button
  const startButton = document.getElementById('start-game');
  if (startButton) {
    startButton.addEventListener('click', () => {
      // Play button click sound
      AudioManager.getInstance().playSoundEffect('/audio/button-click.mp3');

      // Fade out menu music
      const audioManager = AudioManager.getInstance();
      const currentVolume = audioManager.getVolume();
      let fadeVolume = currentVolume;
      const fadeInterval = setInterval(() => {
        fadeVolume -= 0.1;
        if (fadeVolume <= 0) {
          clearInterval(fadeInterval);
          audioManager.stopBackgroundMusic();
          audioManager.setVolume(currentVolume); // Restore original volume
        } else {
          audioManager.setVolume(fadeVolume);
        }
      }, 100);

      // Hide the menu container
      const menuContainer = document.querySelector('.menu-container');
      if (menuContainer instanceof HTMLElement) {
        menuContainer.style.display = 'none';
      }

      // Initialize and start the game
      initializeGame();
    });
  }

  // Add event listener for the open world button
  const openWorldButton = document.getElementById('open-world-game');
  if (openWorldButton) {
    openWorldButton.addEventListener('click', () => {
      // Play button click sound
      AudioManager.getInstance().playSoundEffect('/audio/button-click.mp3');

      initializeOpenWorldGame();
    });
  }

  // Add event listeners for other menu buttons
  const optionsButton = document.getElementById('options');
  if (optionsButton) {
    optionsButton.addEventListener('click', () => {
      // Play button click sound
      AudioManager.getInstance().playSoundEffect('/audio/button-click.mp3');

      alert('Options are not implemented yet.');
    });
  }

  const aboutButton = document.getElementById('about');
  if (aboutButton) {
    aboutButton.addEventListener('click', () => {
      // Play button click sound
      AudioManager.getInstance().playSoundEffect('/audio/button-click.mp3');

      alert(
        'Neon Dominance is a cyberpunk card game inspired by Android: Netrunner. Play as a hacker running against corporate servers in a dystopian future.',
      );
    });
  }

  // Add event listener for page unload to clean up resources
  globalThis.addEventListener('beforeunload', () => {
    console.log('Page unloading, cleaning up resources...');

    // Clean up the open world game
    if (openWorldGame) {
      openWorldGame.dispose();
      openWorldGame = null;
    }

    // Clean up the Three.js scene
    if (threeScene) {
      threeScene.stop();
      threeScene = null;
    }

    // Clean up the terminal game
    if (game) {
      game = null;
    }

    // Remove any event listeners
    const startButton = document.getElementById('start-game');
    if (startButton) {
      startButton.replaceWith(startButton.cloneNode(true));
    }

    const openWorldButton = document.getElementById('open-world-game');
    if (openWorldButton) {
      openWorldButton.replaceWith(openWorldButton.cloneNode(true));
    }

    const optionsButton = document.getElementById('options');
    if (optionsButton) {
      optionsButton.replaceWith(optionsButton.cloneNode(true));
    }

    const aboutButton = document.getElementById('about');
    if (aboutButton) {
      aboutButton.replaceWith(aboutButton.cloneNode(true));
    }
  });
});

// Function to create game instructions panel
function _createGameInstructions(): void {
  const instructions = document.createElement('div');
  instructions.id = 'instructions';
  instructions.innerHTML = `
    <h2>Game Instructions</h2>
    <p>Use WASD to move</p>
    <p>Use mouse to look around</p>
    <p>Press E to interact</p>
    <p>Press ESC to toggle menu</p>
  `;
  document.body.appendChild(instructions);
}
