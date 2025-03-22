# Neon Dominance

A Netrunner-inspired roguelike PvPvE deckbuilder-RPG hybrid with multiplayer territory control elements.

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

## Development

- Edit scenes in Godot editor
- Modify scripts in `scripts/` directory
- Test changes with F5
- Export to Web/Mobile using the export templates

## Requirements

- Godot 4.4 or later
- macOS with Apple Silicon (M1 or later)
- 4GB RAM minimum
- OpenGL 3.3+ compatible graphics

## License

See [LICENSE](LICENSE) file for details.
