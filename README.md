# Neon Dominance

A Netrunner-inspired roguelike PvPvE deckbuilder-RPG built with Godot Engine.

## Current Version

**v0.1.0** - Testing Framework and Project Setup

## Overview

Neon Dominance is an asymmetric deckbuilder where players can take on the role of either Runners or Corporations in a cyberpunk setting. The game features:

- **Asymmetric Gameplay**: Play as a Runner with modular decks and hack-based mechanics, or as a Corporation with server infrastructure and ICE defense systems
- **Roguelike Elements**: Progress through temporary upgrades with cooldowns and face permanent consequences through the Neural Burnout system
- **Territory Control**: Establish safehouses as a Runner or strongholds as a Corporation to control the digital landscape

## Development Status

- [x] Project setup with Godot 4.4
- [x] Main menu and basic navigation
- [x] Comprehensive testing framework
- [ ] Card system implementation
- [ ] Game board layout
- [ ] Core game logic

## Tech Stack

- **Game Engine**: Godot 4.4 with GDScript
- **3D Assets**: Blender
- **Platforms**: Web (HTML5/WebGL) and Mobile
- **Web3**: Planned integration with Espresso EVM rollup (non-pay-to-win)

## Quick Start (macOS M1)

1. Install Godot 4.4:
   ```bash
   brew install --cask godot
   ```
   Or download Godot 4.4 for macOS (Apple Silicon) from https://godotengine.org/download
   
   Note: Make sure you have Godot 4.4 or later, as the project uses features from this version.

2. Open project:
   - Launch Godot
   - Click "Import"
   - Select the `game` folder in this repository
   - Click "Import & Edit"
   - Press F5 or click the Play button to run or cmd + b

3. Troubleshooting:
   - If you see errors about missing files, the project structure might need repair
   - Make sure you're importing the `game` folder, not the root repository folder
   - Check that Godot 4.4+ is properly installed for Apple Silicon

## Project Structure

```
game/
├── project.godot       # Project configuration
├── icon.svg           # Application icon
├── scenes/            # Game scenes
│   ├── main_menu.gd   # Main menu logic
│   ├── main_menu.tscn # Main menu scene
│   └── card_ui.tscn   # Card UI template
└── scripts/           # Will contain game logic
    ├── autoload/      # Global scripts
    │   └── game_state.gd
    └── classes/       # Base classes
        └── card.gd
```

## Getting Started

### Prerequisites

- [Godot 4.4](https://godotengine.org/download) or newer

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ZachBeta/slopcore_yaj_rpg.git
   ```

2. Open the project in Godot:
   - Launch Godot Engine
   - Click "Import"
   - Navigate to the cloned repository and select the `game/project.godot` file
   - Click "Import & Edit"

### Running Tests

To run the test suite:

```bash
godot --headless --path /path/to/slopcore_yaj_rpg/game --script tests/run_tests.gd
```

## Development Roadmap

See the [ROADMAP.md](docs/ROADMAP.md) file for the complete development plan.

See the [NEXT_STEPS.md](docs/NEXT_STEPS.md) file for immediate development tasks.

## License

See [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Android: Netrunner and other cyberpunk media
