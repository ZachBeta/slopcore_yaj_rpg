# ASCII Game Board Renderer Tutorial

This tutorial will guide you through using the ASCII game board renderer for the Neon Dominance card game.

## Quick Start

1. First, make sure you have Python 3.6 or higher installed on your system.
2. Clone or download the repository containing the game_board_render.py file.
3. Open a terminal and navigate to the directory containing the file.
4. Run the basic command to see the default game board:

```bash
python3 game_board_render.py
```

## Understanding the Game Board

When you run the renderer, you'll see a game board divided into several sections:

```
  _   _                   ____                 _                           
 | \ | | ___  ___  _ __  |  _ \  ___  _ __ ___(_)_ __   __ _ _ __   ___ ___
 |  \| |/ _ \/ _ \| '_ \ | | | |/ _ \| '_ \_  / | '_ \ / _` | '_ \ / __/ _ \
 | |\  |  __/ (_) | | | || |_| | (_) | | | / /| | | | | (_| | | | | (_|  __/
 |_| \_|\___|\___/|_| |_||____/ \___/|_| |/_/ |_|_| |_|\__,_|_| |_|\___\___|
                                                                          

                        Credits: 5 │ Memory: 3/4 MU │ Clicks: 2                        


CORPORATE SERVERS
================================================================================

[ HQ ]
... (server cards display here)

[ R&D ]
... (server cards display here)

[ Archives ]
... (server cards display here)


RUNNER'S RIG
================================================================================

PROGRAMS & ICEBREAKERS:
... (installed program cards display here)

HARDWARE:
... (installed hardware cards display here)

RESOURCES:
... (installed resource cards display here)


YOUR HAND:
================================================================================
... (hand cards display here)
```

## The Game State Elements

- **Game Logo**: Neon Dominance title art
- **Status Bar**: Shows Credits, Memory Units, and Clicks
- **Corporate Servers**: Each server with its ICE protection
- **Runner's Rig**: All installed runner cards, sorted by type
- **Hand**: Cards in your hand

## Visualizing a Run

To visualize a run on a server, use the `--run` option along with the server name:

```bash
python3 game_board_render.py --run r&d
```

This will highlight the R&D server and show a run in progress.

To show a run that's encountering ICE:

```bash
python3 game_board_render.py --run r&d --ice-index 0 --ice-encounter
```

This will display the ICE encounter dialog for the first ICE on R&D.

To show a successful run:

```bash
python3 game_board_render.py --run r&d --run-success
```

This will display the successful run animation.

## Step-by-Step Examples

### Example 1: Basic Game State

```bash
python3 game_board_render.py --credits 7 --memory 2 4 --clicks 3
```

This shows a game state where the runner has:
- 7 credits
- 2 memory units used out of 4 available
- 3 clicks remaining

### Example 2: Run in Progress

```bash
python3 game_board_render.py --run hq --ice-index 0 --ice-encounter --clicks 1
```

This shows:
- A run in progress on HQ
- Currently encountering the first ICE
- Runner has 1 click remaining

### Example 3: Successful Run

```bash
python3 game_board_render.py --run archives --run-success --credits 3 --clicks 0
```

This shows:
- A successful run on Archives
- Runner has 3 credits and 0 clicks remaining

## Integrating with Your Game

If you want to integrate the game board renderer with your own game implementation:

1. Import the necessary functions:

```python
from game_board_render import display_board
```

2. Create options dictionaries based on your game state:

```python
options = {
    'credits': my_game.runner.credits,
    'memory': [my_game.runner.memory_used, my_game.runner.memory_max],
    'clicks': my_game.runner.clicks,
    'installed_cards': my_game.runner.installed_cards,
    'hand_cards': my_game.runner.hand
}
```

3. Call the display_board function with your options:

```python
display_board(options)
```

4. For runs, add run-specific options:

```python
options['run_server'] = 'HQ'
options['ice_index'] = 1  # Second ICE (0-indexed)
options['ice_encounter'] = True  # Show ICE encounter
display_board(options)
```

## Common Issues and Solutions

- **Text appears misaligned**: Your terminal window may be too narrow. Try expanding it or using a terminal with at least 80 columns.
- **No colors appear**: Your terminal may not support ANSI color codes. Try using a different terminal.
- **Unicode characters don't display properly**: Your terminal or font may not support all the Unicode characters used. Try switching to a terminal with better Unicode support.

## Next Steps

- Check the README_GAME_BOARD.md file for complete documentation
- Explore the integrate_board_renderer.py example to see how to integrate with game logic
- Try modifying the ASCII art in the game_board_render.py file to customize the look of your cards 