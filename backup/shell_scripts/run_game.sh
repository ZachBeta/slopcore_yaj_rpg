#!/bin/bash

# Neon Dominance Terminal Game Launcher
# Version 0.5.1

# Display ASCII banner
echo -e "\033[36m"
cat << "EOF"
 _   _                     ____                  _                           
| \ | | ___  ___  _ __    |  _ \  ___  _ __ ___ (_)_ __   __ _ _ __   ___ ___  
|  \| |/ _ \/ _ \| '_ \   | | | |/ _ \| '_ ` _ \| | '_ \ / _` | '_ \ / __/ _ \ 
| |\  |  __/ (_) | | | |  | |_| | (_) | | | | | | | | | | (_| | | | | (_|  __/ 
|_| \_|\___|\___/|_| |_|  |____/ \___/|_| |_| |_|_|_| |_|\__,_|_| |_|\___\___| 
                                                                             
EOF
echo -e "\033[0m"

echo "Terminal Game Launcher - v0.5.1"
echo "-------------------------------"
echo

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not found."
    exit 1
fi

# Set working directory to the script location
cd "$(dirname "$0")"

# Create command to run the game directly
# RUN_CMD="python3 cmd/terminal_game/main.py"
RUN_CMD="cd web && npm run terminal-game"

# Process command line arguments
ARGS=""
TEST_MODE=false

# Help function
show_help() {
    echo "Usage: ./run_game.sh [OPTIONS]"
    echo
    echo "Options:"
    echo "  --help        Show this help message"
    echo "  --seed NUM    Set random seed for reproducible gameplay"
    echo "  --test        Run in test mode with automated commands"
    echo "  --scenario S  Test scenario to run (quick, install, run, full)"
    echo "  --delay NUM   Delay between automated commands in seconds"
    echo
    exit 0
}

# Process command line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --help)
            show_help
            ;;
        --seed|--scenario|--delay)
            ARGS="$ARGS $1 $2"
            shift 2
            ;;
        --test)
            TEST_MODE=true
            ARGS="$ARGS $1"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            ;;
    esac
done

# Add default test scenario if in test mode with no scenario specified
if $TEST_MODE && [[ ! "$ARGS" =~ "--scenario" ]]; then
    ARGS="$ARGS --scenario quick"
fi

# Run the game
echo "Launching Neon Dominance..."
echo "Command: $RUN_CMD $ARGS"
echo
eval "$RUN_CMD $ARGS"

exit $? 