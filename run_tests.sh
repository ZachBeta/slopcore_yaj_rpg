#!/bin/bash

# Neon Dominance Test Runner
# Version 0.5.1

# Set working directory to the script location
cd "$(dirname "$0")"

# Set PYTHONPATH to include project root
export PYTHONPATH="$PYTHONPATH:$(pwd)"

# Display banner
echo -e "\033[36m"
cat << "EOF"
 _   _                     ____                  _                           
| \ | | ___  ___  _ __    |  _ \  ___  _ __ ___ (_)_ __   __ _ _ __   ___ ___  
|  \| |/ _ \/ _ \| '_ \   | | | |/ _ \| '_ ` _ \| | '_ \ / _` | '_ \ / __/ _ \ 
| |\  |  __/ (_) | | | |  | |_| | (_) | | | | | | | | | | (_| | | | | (_|  __/ 
|_| \_|\___|\___/|_| |_|  |____/ \___/|_| |_| |_|_|_| |_|\__,_|_| |_|\___\___| 
                                                                             
EOF
echo -e "            TERMINAL GAME TEST SUITE\n"
echo -e "\033[0m"

# Process command line arguments
VERBOSE=""
SPECIFIC_TEST=""

# Help function
show_help() {
    echo "Usage: ./run_tests.sh [OPTIONS] [test_file.py]"
    echo
    echo "Options:"
    echo "  --help        Show this help message"
    echo "  --verbose     Run tests with higher verbosity"
    echo "  --ci          Run tests in continuous integration mode"
    echo
    echo "Examples:"
    echo "  ./run_tests.sh                            # Run all tests"
    echo "  ./run_tests.sh --verbose                  # Run all tests with detailed output"
    echo "  ./run_tests.sh test_game_basics.py        # Run only the specified test file"
    echo
    exit 0
}

# Process command line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --help)
            show_help
            ;;
        --verbose)
            VERBOSE="-v"
            shift
            ;;
        --ci)
            CI_MODE=true
            shift
            ;;
        *.py)
            SPECIFIC_TEST="cmd/terminal_game/tests/$1"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            ;;
    esac
done

# Run the appropriate test command
if [ -n "$SPECIFIC_TEST" ]; then
    echo "Running specific test file: $SPECIFIC_TEST"
    python3 $SPECIFIC_TEST $VERBOSE
elif [ "$CI_MODE" = true ]; then
    echo "Running tests in CI mode"
    python3 -m unittest discover -s cmd/terminal_game/tests
else
    echo "Running all tests"
    python3 cmd/terminal_game/tests/run_tests.py $VERBOSE
fi

# Check exit code
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n\033[32mAll tests passed successfully!\033[0m"
else
    echo -e "\n\033[31mSome tests failed. Please check the output above for details.\033[0m"
fi

exit $EXIT_CODE 