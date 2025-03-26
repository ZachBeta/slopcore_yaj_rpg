# Neon Dominance

A cyberpunk card game where you play as a hacker (Runner) breaking into corporate servers, while an AI opponent controls the Corporation trying to stop you.

## Current Version

**v0.7.2** - Open World Prototype with improved drone movement controls

## Game Overview

Neon Dominance is an asymmetric deckbuilder set in a cyberpunk world. You play as a hacker who must infiltrate corporate servers, bypass security ICE, and access valuable data while managing your resources and avoiding neural damage.

### Key Features

- **Asymmetric Gameplay**: Runner vs Corporation with different mechanics
- **Strategic AI Opponent**: Corporation AI with multiple strategic approaches
- **Complete Game Loop**: Card drawing, installation, runs, and win conditions
- **Resource Management**: Balance credits and memory units
- **Server Runs**: Make runs on different servers, handle ICE encounters
- **Jack Out Mechanics**: Strategic choices during runs
- **ASCII Art Interface**: Visual feedback with colored text
- **3D Web Version**: Three.js integration with interactive elements and easter eggs
- **Open World Prototype**: Multiplayer environment with 3D movement and physics

## Getting Started

### Quick Start

Run the game directly from the root folder:

```bash
./run_game.sh
```

### Web Version

The web version of the game features a modern interface with Three.js integration:

```bash
# Navigate to the web directory
cd web

# Run the production version
docker-compose up app

# Or run the development version with hot-reloading
docker-compose up dev
```

Special features in the web version:
- Interactive spinning cube in the background
- Semi-transparent cyberpunk UI
- Hidden d20 easter egg (try to find the HACK button!)

For more details, see the [Web README](web/README.md).

### Command-Line Options

```bash
./run_game.sh --help        # Show help
./run_game.sh --seed 12345  # Set a random seed for reproducible gameplay
./run_game.sh --test        # Run in automated test mode
./run_game.sh --scenario full --delay 1  # Run a full test scenario with 1s delay
```

### Demo Mode

Run the demo with various options:

```bash
./demo.sh                # Run demo with 2s delay between actions
./demo.sh --ascii        # Run with ASCII game board visualization
./demo.sh --fast         # Run with no delay (for fast iteration)
./demo.sh --fast --ascii # Run with ASCII board and no delay
./demo.sh --help         # Show all demo options
```

### Alternative Launch Method

The game can also be run using npm directly:

```bash
cd web
npm run terminal-game
```

## Gameplay Commands

During gameplay, the following commands are available:

- `help` - Display available commands
- `status` - Show current game status
- `draw` - Draw a card (costs 1 click)
- `hand` - View cards in your hand
- `install <card_num>` - Install a card from your hand (costs 1 click)
- `run <server>` - Run against a server (costs 1 click)
  - Options: `run <server> --stealth`, `--aggressive`, `--careful`
- `jack_out` - Abort a run after encountering ICE
- `discard <card_num>` - Discard a card from your hand
- `end` - End your turn

### Open World Controls

In the open world prototype, the following controls are available:

- `W` - Move Up along the drone's local Y axis
- `S` - Move Down along the drone's local Y axis
- `A` - Rotate Left (Yaw)
- `D` - Rotate Right (Yaw)
- `I` - Look Up (Pitch)
- `K` - Look Down (Pitch)
- `J` - Roll Left
- `L` - Roll Right
- `R` - Move Forward (Throttle)
- `F` - Move Backward (Throttle)
- `Space` - Jump
- `X` - Toggle Debug Mode

## AI Opponent

The game features a Corporation AI opponent with:

- Multiple strategic approaches (Balanced, Aggressive, Defensive, Economic)
- Independent game state management
- Strategic decision-making based on context
- Installation of ICE, creation of remote servers, and agenda advancement

## Development Status

✅ **IMPLEMENTED**:
- [x] Complete terminal-based game with full command interface
- [x] Strategic AI opponent for Corporation side
- [x] Resource management (credits and memory units)
- [x] Server run mechanics with ICE encounters
- [x] Jack out command implementation
- [x] Open world prototype with multiplayer support

🔄 **IN PROGRESS**:
- [ ] Enhanced run approach options
- [ ] Visual improvements for server visualization
- [ ] Economic rebalancing
- [ ] Advanced open world environment features

## Project Structure

```
slopcore_yaj_rpg/
├── web/                  # Web implementation
│   ├── src/              # Source code
│   │   ├── terminal-game/    # Terminal game implementation
│   │   │   ├── terminal-game.ts  # Core game logic
│   │   │   ├── ai-opponent.ts    # Corporation AI
│   │   │   └── console-renderer.ts  # Terminal UI
│   │   └── ...
│   └── ...
├── game/                 # Godot implementation
├── docs/                 # Documentation
└── ...
```

## Requirements

- [Node.js](https://nodejs.org/) 14.x or newer
- npm 6.x or newer

## Testing

The project includes a comprehensive test suite for the TypeScript implementation:

```bash
cd web
npm test                  # Run all tests
npm test -- terminal-game.test.ts  # Run a specific test file
```

## For Developers

### Prerequisites

- [Node.js](https://nodejs.org/) 14.x or newer
- npm 6.x or newer

### Running Tests

The game includes a comprehensive test suite to verify game mechanics and functionality.

Run all tests with the npm test command:

```bash
cd web
npm test
```

Additional options:
```bash
npm test -- --verbose                  # Detailed test output
npm test -- terminal-game.test.ts      # Run a specific test file
```

### Testing Best Practices

When writing tests for Neon Dominance, follow these guidelines:

1. Each test should be independent and not rely on state from other tests
2. Use descriptive test names that indicate what is being tested
3. Include both positive and negative test cases
4. Use deterministic random seeds for reproducible test results
5. Test edge cases and boundary conditions
6. Keep tests fast and focused on specific functionality

### Development Guidelines

- See [CHANGELOG.md](CHANGELOG.md) for version history and planned features
- See [RULES.md](RULES.md) for project conventions and versioning guidelines

## License

See [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Android: Netrunner and other cyberpunk media

## Running the Game

The terminal-based version of Neon Dominance can be run directly from the web directory:

```bash
cd web
npm run terminal-game
```

This will launch the game in your terminal with all default settings.
