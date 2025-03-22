# ASCII Game Board Renderer for Neon Dominance

This is an ASCII art-based game board renderer for the Neon Dominance terminal card game. It provides a visual representation of the game state using ASCII characters and ANSI color codes.

## Features

- Visual representation of game cards, servers, and runs
- Card display with appropriate ASCII art based on card type
- Color-coded elements based on card types
- Run progress visualization
- ICE encounter visualization
- Run success animation

## Usage

### Running the Demo with ASCII Game Board Renderer

To run the demo with the ASCII game board renderer:

```bash
./demo.sh --ascii
```

This will run the full test scenario with a 2-second delay between actions, displaying the ASCII game board at key moments.

### Running without the ASCII Game Board Renderer

To run the demo without the ASCII renderer (text-only mode):

```bash
./demo.sh
```

### Integration Script Options

The `integrate_board_renderer.py` script can be run directly with these options:

```bash
python3 integrate_board_renderer.py [OPTIONS]
```

Available options:
- `--scenario SCENARIO`: Choose test scenario (basic, full, custom)
- `--delay SECONDS`: Set delay between game actions in seconds
- `--seed NUMBER`: Set random seed for reproducible runs

Example:
```bash
python3 integrate_board_renderer.py --scenario=full --delay=1
```

## Game Board Features

### Card Display

Cards are displayed with:
- Border and card name
- Card type and subtype (if applicable)
- ASCII art based on card type
- Key stats (cost, memory usage, strength)

### Server Display

Servers display:
- Server name
- ICE protecting the server (with ASCII art)
- Number of cards in the server

### Run Visualization

When running on a server:
- Run progress indicator showing passed, current, and upcoming ICE
- ICE encounter display showing the current ICE being faced
- Run success animation upon successful completion

## Development

### Adding New Card Types

To add a new card type with custom ASCII art:

1. Update the `card_data.py` module to include the new card type
2. Add appropriate ASCII art for the new card type in the `CARD_ASCII_ART` dictionary
3. For specific cards with unique ASCII art, add them to the `SPECIFIC_CARD_ART` dictionary

### Customizing Colors

The color scheme can be modified in the `Colors` class within `game_board_render.py`.

## Technical Details

- Uses ANSI color codes for terminal coloring
- Detects terminal width for optimal display
- Modular code organization with separate concerns for card data and rendering

## Requirements

- Terminal with ANSI color support
- Python 3.6+
- Linux/macOS (may work on Windows with appropriate terminal) 