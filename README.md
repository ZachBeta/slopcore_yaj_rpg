# Neon Dominance

A cyberpunk card game where you play as a hacker (Runner) breaking into corporate servers, while an AI opponent controls the Corporation trying to stop you.

## Current Version

**v0.6.0** - Terminal Implementation with Enhanced Card Abilities

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

## Getting Started

### Quick Start

Run the game directly from the root folder:

```bash
./run_game.sh
```

### Command-Line Options

```bash
./run_game.sh --help        # Show help
./run_game.sh --seed 12345  # Set a random seed for reproducible gameplay
./run_game.sh --test        # Run in automated test mode
./run_game.sh --scenario full --delay 1  # Run a full test scenario with 1s delay
```

### Alternative Launch Method

If you prefer to run the Python script directly:

```bash
python3 cmd/terminal_game/main.py
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

🔄 **IN PROGRESS**:
- [ ] Enhanced run approach options
- [ ] Visual improvements for server visualization
- [ ] Economic rebalancing

## Project Structure

```
cmd/terminal_game/    # GAME IMPLEMENTATION
├── main.py           # Entry point
├── terminal_game.py  # Core game logic
├── ai_opponent.py    # Corporation AI
└── game_renderer.py  # Terminal UI

docs/                 # DOCUMENTATION
├── gameplay_enhancements.md  # Planned improvements
└── implementation_plan.md    # Implementation roadmap
```

## For Developers

### Prerequisites

- [Python 3.x](https://www.python.org/downloads/) or newer

### Running Tests

The game includes a comprehensive test suite to verify game mechanics and functionality.

Run all tests with the test runner script:

```bash
./run_tests.sh
```

Additional options:
```bash
./run_tests.sh --verbose                  # Detailed test output
./run_tests.sh test_game_basics.py        # Run a specific test file
./run_tests.sh --help                     # Show all options
```

Alternative methods:
```bash
# Run using the Python unittest framework
python3 -m unittest discover -s cmd/terminal_game/tests

# Run a specific test file directly
python3 cmd/terminal_game/tests/test_game_basics.py
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
