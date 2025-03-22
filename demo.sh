#!/bin/bash

# Demo script for Neon Dominance with ASCII Game Board Renderer
# Runs a full test scenario with various delay options between actions

# Default delay
DELAY=2

# Check if we should run with no delay
if [ "$1" == "--fast" ] || [ "$1" == "-f" ]; then
    DELAY=0
    shift
fi

# Check if we should use the ASCII game board renderer
if [ "$1" == "--ascii" ] || [ "$1" == "-a" ]; then
    echo "Running with ASCII Game Board Renderer (delay: ${DELAY}s)..."
    python3 cmd/terminal_game/integrate_board_renderer.py --scenario=full --delay=$DELAY --seed=123
else
    # Run the original terminal game without the ASCII renderer
    echo "Running without ASCII Game Board Renderer (delay: ${DELAY}s)..."
    ./run_game.sh --test --scenario full --delay $DELAY --seed 123
fi

# Usage information
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Usage: ./demo.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --fast, -f    Run with no delay between commands (for fast iteration)"
    echo "  --ascii, -a   Use the ASCII game board renderer"
    echo "  --help, -h    Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./demo.sh              # Run with standard terminal output (2s delay)"
    echo "  ./demo.sh --ascii      # Run with ASCII game board (2s delay)"
    echo "  ./demo.sh --fast       # Run with no delay (standard output)"
    echo "  ./demo.sh --fast --ascii # Run with no delay (ASCII output)"
    exit 0
fi 