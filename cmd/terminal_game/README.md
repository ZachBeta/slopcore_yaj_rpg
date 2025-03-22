# Neon Dominance Terminal Game

A terminal-based implementation of the Neon Dominance card game for testing gameplay mechanics independently of Godot rendering.

## Overview

This implementation mirrors the gameplay mechanics of the Godot-based game but runs entirely in a terminal. It's designed for:

- Testing core gameplay logic without rendering dependencies
- Easier automated testing and integration testing
- Quick prototyping of gameplay changes
- Debugging gameplay mechanics in isolation

## Usage

Run the terminal game with:

```
python cmd/terminal_game/main.py
```

### Command Line Options

- `--seed NUMBER`: Set a specific random seed for reproducible gameplay
- `--test`: Run in automated test mode with predefined commands
- `--scenario [quick|install|run|full]`: Choose a test scenario (used with --test)
- `--delay SECONDS`: Set delay between automated commands (default: 0.5s)

### Examples

Run the game normally:
```
python cmd/terminal_game/main.py
```

Run with a specific random seed:
```
python cmd/terminal_game/main.py --seed 12345
```

Run a full gameplay test:
```
python cmd/terminal_game/main.py --test --scenario full
```

## Testing

This implementation makes it easy to run automated tests on gameplay mechanics. The test scenarios are defined in `main.py` and execute a sequence of commands to simulate different aspects of gameplay.

## Integration with Godot

The terminal game uses the same core gameplay logic as the Godot implementation, just with a different UI layer. This helps ensure that gameplay behavior is consistent between both implementations.
