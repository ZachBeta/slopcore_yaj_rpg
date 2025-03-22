#!/bin/bash

# Demo script for Neon Dominance with ASCII Game Board Renderer
# Runs a full test scenario with 2 second delay between actions

# Check if we should use the ASCII game board renderer
if [ "$1" == "--ascii" ] || [ "$1" == "-a" ]; then
    echo "Running with ASCII Game Board Renderer..."
    python3 integrate_board_renderer.py --scenario=full --delay=2 --seed=123
else
    # Run the original terminal game without the ASCII renderer
    echo "Running without ASCII Game Board Renderer (use --ascii for visual mode)..."
    ./run_game.sh --test --scenario full --delay 2 --seed 123
fi 