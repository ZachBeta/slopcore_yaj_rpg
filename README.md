# Neon Dominance

A Netrunner-inspired roguelike PvPvE deckbuilder-RPG built with Python, featuring a full gameplay loop in the terminal implementation with future plans for a Godot-based GUI.

## Current Version

**v0.3.0** - Terminal Game Implementation with Strategic AI Opponent

> **CURRENT STATUS**: The Python terminal implementation is the primary playable version with complete gameplay and AI. The Godot GUI implementation is still being compiled in the grid - check back when the render matrices are stabilized.

## Overview

Neon Dominance is an asymmetric deckbuilder where players can take on the role of either Runners or Corporations in a cyberpunk setting. The game features:

- **Asymmetric Gameplay**: Play as a Runner with modular decks and hack-based mechanics, or as a Corporation with server infrastructure and ICE defense systems
- **Roguelike Elements**: Progress through temporary upgrades with cooldowns and face permanent consequences through the Neural Burnout system
- **Strategic AI**: Face off against a Corporation AI with various strategic approaches (Economic, Aggressive, Defensive)
- **Multiple Implementations**: 
  - **ACTIVE**: Python-based terminal version with complete gameplay and AI opponent
  - **IN DEVELOPMENT**: Godot-based GUI version (currently in beta testing phase)

## Development Status

✅ **STABLE IMPLEMENTATIONS**:
- [x] Terminal game with full command interface
- [x] Advanced AI opponent for Corporation side
- [x] Complete game loop with turn structure
- [x] Win conditions and agenda scoring
- [x] Server run mechanics with ICE encounters

🔄 **IN PROGRESS**:
- [ ] Godot implementation with visual interface
- [ ] Advanced card mechanics
- [ ] Deck building system
- [ ] Campaign progression

## Tech Stack

- **Current Implementation**: Python 3.x terminal interface
- **Secondary Implementation**: Godot 4.4 with GDScript (still in development)
- **3D Assets**: Blender (for future Godot version)
- **Platforms**: Terminal (current), Web/Mobile (planned)
- **Web3**: Planned integration with Espresso EVM rollup (non-pay-to-win)

## Quick Start

### Python Terminal Implementation ⭐ (RECOMMENDED)

1. Make sure you have Python 3.x installed:
   ```bash
   python3 --version
   ```

2. Run the terminal game:
   ```bash
   cd /path/to/slopcore_yaj_rpg
   python3 cmd/terminal_game/main.py -i
   ```

3. Use the `-i` flag for interactive mode, or `--help` to see all available options.

### Godot Implementation 🚧 (UNDER CONSTRUCTION)

> **Note**: The Godot implementation is still being compiled. Some features may be unstable or incomplete.

1. Install Godot 4.4:
   ```bash
   brew install --cask godot
   ```
   Or download Godot 4.4 for macOS (Apple Silicon) from https://godotengine.org/download

2. Open project:
   - Launch Godot
   - Click "Import"
   - Select the `game` folder in this repository
   - Click "Import & Edit"
   - Press F5 or click the Play button to run or cmd + b

## Project Structure

```
cmd/terminal_game/    # PRIMARY IMPLEMENTATION
├── main.py           # Entry point
├── terminal_game.py  # Core game logic
├── ai_opponent.py    # Corporation AI
└── game_renderer.py  # Terminal UI

game/                 # SECONDARY IMPLEMENTATION (IN DEVELOPMENT)
├── project.godot     # Project configuration
├── scenes/           # Game scenes
├── scripts/          # Game logic
└── tests/            # Test suite
```

## Getting Started

### Prerequisites

- [Python 3.x](https://www.python.org/downloads/) or newer
- [Godot 4.4](https://godotengine.org/download) or newer (for Godot implementation)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ZachBeta/slopcore_yaj_rpg.git
   ```

2. Open the project in Godot (for Godot implementation):
   - Launch Godot Engine
   - Click "Import"
   - Navigate to the cloned repository and select the `game/project.godot` file
   - Click "Import & Edit"

### Running Tests

To run the test suite for the terminal implementation:

```bash
python3 -m unittest discover -s cmd/terminal_game/tests
```

## Development Roadmap

See the [ROADMAP.md](docs/ROADMAP.md) file for the complete development plan.

See the [NEXT_STEPS.md](docs/NEXT_STEPS.md) file for immediate development tasks.

## License

See [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Android: Netrunner and other cyberpunk media
