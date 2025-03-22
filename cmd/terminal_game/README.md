# Neon Dominance Terminal Game

A terminal-based implementation of the Neon Dominance card game with a complete game loop and AI opponent.

## Overview

This implementation provides a fully playable version of the Neon Dominance game in a terminal environment, featuring:

- Complete runner gameplay with card drawing, installation, and action mechanics
- Advanced Corporation AI opponent with strategic decision-making
- Server runs with ICE encounters and varying success rates
- Full agenda scoring system with win conditions for both sides
- Interactive turn-based gameplay

The terminal implementation serves multiple purposes:
- Testing core gameplay logic without rendering dependencies
- Easier automated testing and integration testing
- Quick prototyping of gameplay changes
- Debugging gameplay mechanics in isolation

## Usage

Run the terminal game in interactive mode with:

```
python cmd/terminal_game/main.py -i
```

### Command Line Options

- `-i, --interactive`: Run in interactive mode (default if no other options provided)
- `--seed NUMBER`: Set a specific random seed for reproducible gameplay
- `--test`: Run in automated test mode with predefined commands
- `--scenario [quick|install|run|full]`: Choose a test scenario (used with --test)
- `--delay SECONDS`: Set delay between automated commands (default: 0.5s)

### Examples

Run the game interactively:
```
python cmd/terminal_game/main.py -i
```

Run with a specific random seed:
```
python cmd/terminal_game/main.py -i --seed 12345
```

Run a full gameplay test:
```
python cmd/terminal_game/main.py --test --scenario full
```

## Game Commands

During gameplay, the following commands are available:

- `help`: Display available commands
- `status`: Show current game status (credits, memory, etc.)
- `draw`: Draw a card (costs 1 click)
- `hand`: Display cards in your hand
- `play`: Display installed programs
- `install <card_number>`: Install a program from your hand (costs 1 click)
- `run <server>`: Run against a server (costs 1 click)
- `discard <card_number>`: Discard a card from your hand
- `system`: Display system status
- `end`: End your turn and let the Corporation take its turn

## AI Opponent

The game features a Corporation AI opponent with multiple strategic approaches:

- The AI can adopt different strategies (Balanced, Aggressive, Defensive, Economic)
- It maintains its own game state with credits, ICE, servers, and agendas
- It makes decisions based on its current situation and strategic objectives
- The AI can install ICE, create remote servers, and advance agendas

## Integration with Godot

The terminal game uses similar gameplay logic to the Godot implementation, ensuring consistent behavior between both versions. This allows testing gameplay mechanics separately from rendering concerns.

## Code Structure

- `main.py`: Entry point and argument handling
- `terminal_game.py`: Core game logic and command processing
- `ai_opponent.py`: Corporation AI implementation
- `game_renderer.py`: Terminal UI and output formatting
- `card_data.py`: Card data management
