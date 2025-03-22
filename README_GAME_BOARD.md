# ASCII Game Board Renderer

This ASCII game board renderer is designed to display a visual representation of the Neon Dominance card game in a terminal interface. It uses colored ASCII art to represent different cards, servers, and game states.

## Features

- Displays cards with appropriate ASCII art based on card type
- Shows corporate servers with ICE protection
- Renders the runner's installed cards organized by type
- Visualizes runs on servers with progress tracking
- Shows ICE encounters during runs
- Displays run success animation
- Provides command-line options to customize the display

## Usage

Basic usage:

```
python3 game_board_render.py
```

This will display the default game board with sample data.

### Command Line Options

You can customize the game board display with various command-line options:

- `--run <server>`: Show a run in progress on the specified server. Options: hq, r&d, archives, server1
- `--ice-index <index>`: Current ICE index in the run (0-based)
- `--credits <number>`: Number of credits the runner has
- `--memory <used> <total>`: Memory usage and capacity (e.g. `--memory 3 4`)
- `--clicks <number>`: Number of clicks remaining
- `--ice-encounter`: Show ice encounter dialog
- `--run-success`: Show run success animation

### Examples

Display a run on R&D, at the second ICE:
```
python3 game_board_render.py --run r&d --ice-index 1
```

Show an ICE encounter during a run:
```
python3 game_board_render.py --run hq --ice-index 0 --ice-encounter
```

Display a successful run:
```
python3 game_board_render.py --run archives --run-success
```

Customize player stats:
```
python3 game_board_render.py --credits 10 --memory 2 4 --clicks 3
```

## Card Visualization

The game board renderer uses color-coded ASCII art to represent different card types:

- **Programs**: Cyan
- **Icebreakers**: Blue
- **Hardware**: Yellow
- **Resources**: Green
- **Events**: Magenta
- **Virus**: Red
- **ICE**: Red
- **Operations**: Blue
- **Assets**: Yellow
- **Upgrades**: Green
- **Agendas**: Magenta

## Integration

This renderer can be integrated with the main game logic to provide a visual representation of the game state. The `display_board()` function accepts an options dictionary that can be populated with the current game state.

```python
options = {
    'credits': player.credits,
    'memory': [player.memory_used, player.memory_capacity],
    'clicks': player.clicks_remaining,
    'run_server': current_run.server_name if current_run else None,
    'ice_index': current_run.ice_index if current_run else 0,
    'ice_encounter': is_encountering_ice,
    'run_success': run_successful,
    'installed_cards': player.installed_cards,
    'hand_cards': player.hand
}

display_board(options)
```

## Requirements

- Python 3.6 or higher
- Terminal with ANSI color support
- Sufficient terminal width (80+ columns recommended) 