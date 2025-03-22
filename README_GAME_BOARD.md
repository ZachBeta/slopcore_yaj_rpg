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

## Game Board Sections

The game board is divided into several sections:

1. **Game Logo** - At the top of the board, displaying the Neon Dominance title
2. **Status Bar** - Shows player credits, memory usage, and remaining clicks
3. **Corporate Servers** - Displays servers (HQ, R&D, Archives, and remote servers) with their ICE protection
4. **Runner's Rig** - Shows installed runner cards organized by type (programs, hardware, resources)
5. **Hand Cards** - Displays the cards in the runner's hand
6. **Run Information** - Shows run progress, ICE encounters, or run success when applicable

## Run Visualization

During a run, the game board will display:

- The server being run on is highlighted
- A visual progress track showing passed ICE, current ICE, and upcoming ICE
- When encountering ICE, a detailed view of the ICE card with its ASCII art
- Upon successful run, a celebratory animation

## Integration Example

An integration example is provided in `integrate_board_renderer.py`. This demonstrates how to:

1. Extract game state from the main game logic
2. Map data to the format expected by the board renderer
3. Display the game board at different stages of gameplay
4. Simulate a run from start to completion

To run the integration example:

```
python3 integrate_board_renderer.py
```

### Integration API

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

For complete integration, you'll need to:

1. Import the necessary functions from `game_board_render.py`
2. Map your game's card type names to the renderer's expected format (see `map_card_type()` in integration example)
3. Extract the current game state and convert it to board options
4. Call `display_board()` with these options at appropriate points in your game logic

## Customizing the Renderer

To add new card types or modify existing ASCII art:

1. Add new entries to the `ascii_art` dictionary in `game_board_render.py`
2. Update the `get_card_color()` function to handle the new card type
3. Ensure your card data includes a 'type' field that matches the keys in the `ascii_art` dictionary

## Troubleshooting

### Display Issues

- **Overlapping or misaligned cards**: Ensure your terminal is wide enough (80+ columns)
- **Missing colors**: Check that your terminal supports ANSI color codes
- **Broken ASCII art**: Some terminals may not display certain Unicode characters properly

### Integration Issues

- **Card type mismatch**: Ensure you're mapping card types correctly between your game and the renderer
- **Card data format**: Cards must have at minimum 'name' and 'type' fields
- **Import errors**: Check that path to game_board_render.py is correctly specified

## Requirements

- Python 3.6 or higher
- Terminal with ANSI color support
- Sufficient terminal width (80+ columns recommended)
- For integration: compatible game state format 