# ASCII Game Board Renderer for Neon Dominance

This is an ASCII art-based game board renderer for the Neon Dominance terminal card game. It provides a visual representation of the game state using ASCII characters and ANSI color codes.

## Features

- Visual representation of game cards, servers, and runs
- Card display with appropriate ASCII art based on card type
- Custom ASCII art for specific cards
- Unified card data model with visuals and mechanics
- Color-coded elements based on card types
- Run progress visualization
- ICE encounter visualization
- Run success animation
- Terminal-compatible display that adapts to different window sizes

## Usage

### Demo Options

```bash
# Visual options
./demo.sh --ascii        # Run with ASCII game board (2s delay)
./demo.sh                # Run with text-only display (2s delay)

# Speed options
./demo.sh --fast --ascii # Run with ASCII board and no delay
./demo.sh --fast         # Run with text-only and no delay

# Help
./demo.sh --help         # Show all options
```

### Key Game Commands

While playing, use these commands:

```
help       - Display available commands
draw       - Draw a card from your deck
hand       - List all cards in your hand
install N  - Install card number N from your hand
run SERVER - Initiate a run on a server (R&D, HQ, etc.)
jack_out   - Abort the current run
end        - End your current turn
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

### Running the Renderer Directly

You can also run the renderer directly to see a static display:

```bash
python3 game_board_render.py
```

## Game Board Features

### Card Display

Cards are displayed with:
- Border and card name
- Card type and subtype (if applicable)
- ASCII art based on card type or specific card
- Key stats (cost, memory usage, strength)
- Flavor text and mechanics (when viewed in detail)

### Server Display

Servers display:
- Server name
- ICE protecting the server (with ASCII art)
- Number of cards in the server
- Visual indicators for run progress

### Run Visualization

When running on a server:
- Run progress indicator showing passed, current, and upcoming ICE
- ICE encounter display showing the current ICE being faced
- Run success animation upon successful completion
- Visual feedback for successes and failures

## Unified Card Data Model

The ASCII renderer uses a unified card data model where:

- All card information lives in `card_data.py`
- Each card includes both game mechanics and visual representation
- ASCII art is assigned based on card type or specific card name
- Card attributes, subtypes, flavor text, and abilities are fully integrated

## Development

### Adding New Card Types

To add a new card type with custom ASCII art:

1. Update the `card_data.py` module to include the new card type
2. Add appropriate ASCII art for the new card type in the `CARD_ASCII_ART` dictionary
3. For specific cards with unique ASCII art, add them to the `SPECIFIC_CARD_ART` dictionary

Example:
```python
# Add a new card type
CARD_ASCII_ART["console"] = [
    r"  _______  ",
    r" /       \ ",
    r"|  [===]  |",
    r"|  |   |  |",
    r"|_________|"
]

# Add specific card art
SPECIFIC_CARD_ART["Quantum Console"] = [
    r"  _/===\_  ",
    r" /       \ ",
    r"|  [Q=Q]  |",
    r"|  |###|  |",
    r"|_________|"
]
```

### Customizing Colors

The color scheme can be modified in the `Colors` class within `game_board_render.py`.

Example:
```python
class Colors:
    # Modify these color codes
    BRIGHT_CYAN = "\033[96m"     # Programs
    BRIGHT_YELLOW = "\033[93m"   # Hardware
    BRIGHT_RED = "\033[91m"      # ICE
    # ...
```

## Technical Details

- Uses ANSI color codes for terminal coloring
- Detects terminal width for optimal display
- Modular code organization with separate concerns for card data and rendering
- Integration script connects with the terminal game for real-time updates

## Requirements

- Terminal with ANSI color support
- Python 3.6+
- Linux/macOS (may work on Windows with appropriate terminal)

## For Developers

For detailed information on extending the ASCII renderer, please see the `DEVELOPER.md` file. 