# ASCII Game Board Renderer - Developer Guide

This guide is for developers who want to extend or modify the ASCII game board renderer for the Neon Dominance card game.

## Code Structure

The game board renderer is organized into several key components:

### Core Components

- **ASCII Art Definitions**: The `ascii_art` dictionary contains all the ASCII art for different card types and game elements.
- **Card Rendering**: The `display_mini_card()` function renders individual cards with appropriate styling.
- **Layout Functions**: Functions like `merge_horizontally()` handle arranging multiple elements.
- **Section Renderers**: Functions like `display_servers()`, `display_runner_area()`, etc., render specific sections.
- **Main Display**: The `display_board()` function orchestrates the entire display process.

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

## Extending the Renderer

### Adding a New Card Type

1. Add ASCII art for the new card type to the `ascii_art` dictionary:

```python
ascii_art = {
    # ... existing art
    "new_card_type": [
        r"   /---\   ",
        r"  |     |  ",
        r"  |     |  ",
        r"  |     |  ",
        r"   \---/   "
    ]
}
```

2. Add a color mapping in the `get_card_color()` function:

```python
def get_card_color(card_type):
    # ... existing mappings
    elif card_type.lower() == "new_card_type":
        type_color = Colors.BRIGHT_BLUE  # Choose appropriate color
    return type_color
```

3. Update the renderer to handle any special layouts needed for this card type.

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

### Adding New Game Elements

To add an entirely new game element:

1. Create the ASCII art for the element:

```python
ascii_art["new_element"] = [
    r"  /=======\  ",
    r" /         \ ",
    r"|  NEW ELEM  |",
    r" \         / ",
    r"  \=======/  "
]
```

2. Create a rendering function for the element:

```python
def display_new_element(data):
    """Display the new game element"""
    print(f"\n{Colors.BRIGHT_WHITE}{Colors.BOLD}NEW ELEMENT{Colors.RESET}")
    print(f"{Colors.BRIGHT_BLACK}{'=' * 80}{Colors.RESET}\n")
    
    # Render your element using the ASCII art
    for line in ascii_art["new_element"]:
        print(f"{Colors.BRIGHT_GREEN}{line}{Colors.RESET}")
    
    # Render any additional information
    # ...
```

3. Update the main `display_board()` function to include your new element:

```python
def display_board(options=None):
    # ... existing code
    
    # Display your new element when needed
    if options.get('show_new_element'):
        display_new_element(options.get('new_element_data'))
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

Then use this function to generate art when rendering cards:

```python
def display_mini_card(card, width=20):
    # ... existing code
    
    # Get dynamic art for certain card types
    if card_type.lower() == "special_type":
        art_lines = generate_dynamic_art(card)
    else:
        art_lines = ascii_art.get(card_type, [])
    
    # ... continue rendering
```

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

## Contributing

When contributing extensions:

1. Maintain the existing code style
2. Document your functions with docstrings
3. Keep the ASCII art consistent in style
4. Test your changes in different terminal environments
5. Consider backward compatibility with existing integrations 