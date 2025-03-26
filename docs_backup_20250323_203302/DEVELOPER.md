# ASCII Game Board Renderer - Developer Guide

This guide is for developers who want to extend or modify the ASCII game board renderer for the Neon Dominance card game.

## Code Structure

The game board renderer is organized into several key components:

### Core Components

- **Card Data Model**: The `card_data.py` module contains the unified card data model with card attributes and ASCII art.
- **ASCII Art Definitions**: The `CARD_ASCII_ART` and `SPECIFIC_CARD_ART` dictionaries in `card_data.py` contain all the ASCII art for different card types and specific cards.
- **Card Rendering**: The `display_mini_card()` function renders individual cards with appropriate styling.
- **Layout Functions**: Functions like `merge_horizontally()` handle arranging multiple elements.
- **Section Renderers**: Functions like `display_servers()`, `display_runner_area()`, etc., render specific sections.
- **Main Display**: The `display_board()` function orchestrates the entire display process.
- **Integration Script**: The `integrate_board_renderer.py` script connects the renderer with the terminal game.

### Key Functions

Here's a breakdown of the most important functions:

```
display_board(options)         # Main entry point that renders the entire board
display_mini_card(card, width) # Renders a single card with ASCII art
get_card_color(card_type)      # Returns the ANSI color for a card type
display_servers(servers)       # Renders the corporate server section
display_runner_area(cards)     # Renders the runner's installed cards
display_hand(hand_cards)       # Renders the player's hand
display_run_progress(...)      # Shows visual progress through a run
display_ice_encounter(ice)     # Shows ICE encounter during a run
display_run_success(server)    # Shows run success animation
```

## Unified Card Data Model

The card data module (`card_data.py`) provides a unified model for cards that includes:

- Card attributes (name, type, subtype, cost, etc.)
- Card abilities and effects
- Card flavor text
- ASCII art representations

Each card in the model has an `ascii_art` field that contains the ASCII art for rendering. This art is determined by:

1. First checking for specific art for that card name in `SPECIFIC_CARD_ART`
2. Then falling back to the card type art from `CARD_ASCII_ART`

Example card data structure:
```python
{
    "name": "Icebreaker.exe",
    "type": "Program",
    "subtype": "Icebreaker",
    "cost": 2,
    "mu": 1,
    "strength": 3,
    "description": "Break ICE subroutines at a cost of 1 credit each.",
    "flavor_text": "Sometimes the simplest solution is the best.",
    "ascii_art": [
        # ASCII art lines here
    ]
}
```

## Extending the Renderer

### Adding a New Card Type

1. Add ASCII art for the new card type to the `CARD_ASCII_ART` dictionary in `card_data.py`:

```python
CARD_ASCII_ART["new_card_type"] = [
    r"   /---\   ",
    r"  |     |  ",
    r"  |     |  ",
    r"  |     |  ",
    r"   \---/   "
]
```

2. Add a color mapping in the `get_card_color()` function in `game_board_render.py`:

```python
def get_card_color(card_type):
    # ... existing mappings
    elif card_type.lower() == "new_card_type":
        type_color = Colors.BRIGHT_BLUE  # Choose appropriate color
    return type_color
```

3. Update the card data module to include sample cards of this new type:

```python
{
    "name": "New Card Example",
    "type": "New_Card_Type",
    "cost": 3,
    "description": "Example of a new card type",
    "flavor_text": "Innovation takes many forms."
}
```

### Adding Specific Card Art

To create unique ASCII art for a specific card:

```python
SPECIFIC_CARD_ART["Unique Card Name"] = [
    r"  ╭─────╮  ",
    r"  │ ╭─╮ │  ",
    r"  │ ╰─╯ │  ",
    r"  ╰─────╯  "
]
```

The renderer will automatically use this art when displaying cards with the matching name.

### Custom Board Layouts

To create a custom board layout:

1. Create a new function that calls the section renderers in your desired order:

```python
def display_custom_board(options=None):
    """Display a custom board layout"""
    if not options:
        options = {}
    
    clear_screen()
    
    # Display only what you need
    display_logo()
    display_status_bar(
        credits=options.get('credits', 5),
        memory=options.get('memory', [3, 4]),
        clicks=options.get('clicks', 2)
    )
    
    # Maybe display servers in a different order
    # or only display certain sections
    # ...
```

### Integration with Terminal Game

The `integrate_board_renderer.py` script connects the ASCII renderer with the terminal game. To extend it:

1. Add event handlers for new game events:

```python
# In run_game_with_renderer function
if "NEW_GAME_EVENT" in line:
    # Parse relevant information
    event_data = parse_event_data(line)
    
    # Update the board to reflect the event
    try:
        game_board_render.display_board({
            'event_type': 'new_event',
            'event_data': event_data,
            'credits': credits,
            'memory': memory,
            'clicks': clicks
        })
        time.sleep(0.5)  # Brief pause to show the event
    except Exception as e:
        print(f"Error handling event: {e}")
```

2. Add new command-line options if needed:

```python
def parse_arguments():
    parser = argparse.ArgumentParser(description='Run the terminal game with ASCII game board visualization')
    # ... existing arguments
    parser.add_argument('--new-option', type=str, help='Description of new option')
    return parser.parse_args()
```

## Advanced Customization

### Custom Card Renderers

You can create custom card renderers for special card types:

```python
def display_special_card(card, width=20):
    """Render a special card with unique styling"""
    # Custom rendering logic here
    # ...
    return card_lines
```

Then update the relevant section renderer to use your custom renderer for specific cards.

### Dynamic ASCII Art

You can make ASCII art that adapts to card data:

```python
def generate_dynamic_art(card):
    """Generate ASCII art based on card properties"""
    strength = card.get('strength', 1)
    
    # Example: create a bar that shows strength
    strength_bar = '[' + '=' * strength + ' ' * (5 - strength) + ']'
    
    art = [
        r"    _____    ",
        f"   |{strength_bar}|   ",
        r"   |     |   ",
        r"   |_____|   "
    ]
    
    return art
```

Then use this function to generate art when rendering cards.

### Adding Animations

You can add simple animations by using time delays:

```python
import time

def display_animated_effect():
    """Display an animated effect"""
    frames = [
        ["Frame 1 Line 1", "Frame 1 Line 2", "Frame 1 Line 3"],
        ["Frame 2 Line 1", "Frame 2 Line 2", "Frame 2 Line 3"],
        ["Frame 3 Line 1", "Frame 3 Line 2", "Frame 3 Line 3"]
    ]
    
    for frame in frames:
        clear_screen()
        for line in frame:
            print(line)
        time.sleep(0.3)  # Delay between frames
```

## Technical Details

### ANSI Color Codes

The renderer uses ANSI escape sequences for colors:

- `\033[XXm` - Format where XX is the color code
- Color codes: 30-37 for foreground, 40-47 for background
- Bright colors: 90-97 for foreground, 100-107 for background
- Styles: 0 (reset), 1 (bold), 4 (underline)

### Terminal Size Considerations

The renderer attempts to adapt to different terminal sizes:

```python
terminal_width = shutil.get_terminal_size().columns
terminal_height = shutil.get_terminal_size().lines
```

You can use these values to adjust rendering for different terminal sizes.

### ANSI Escape Code Handling

When parsing terminal output that contains ANSI codes, use the `clean_ansi` function:

```python
def clean_ansi(text):
    """Remove ANSI escape codes from text"""
    ansi_escape = re.compile(r'\x1b[^m]*m')
    return ansi_escape.sub('', text)
```

This is important when processing output from the terminal game that contains colored text.

## Performance Optimization

For better performance:

1. Minimize unnecessary screen redraws
2. Use string concatenation instead of multiple print statements where possible
3. Compute card layouts once and reuse them
4. For large boards, consider lazy rendering (only render visible parts)

## Testing

When extending the renderer, test on different terminal sizes and configurations:

```python
def test_rendering():
    """Test rendering under different conditions"""
    # Test with different terminal sizes
    # Test with different card combinations
    # Test with all card types
    # Test with edge cases (empty sections, maximum cards, etc.)
```

## Contribution Guidelines

When contributing to the ASCII game board renderer:

1. Follow the existing code style and conventions
2. Document all new functions and parameters
3. Test your changes with different terminal sizes and configurations
4. Update the README and DEVELOPER.md when adding new features
5. Ensure backward compatibility when modifying existing features 