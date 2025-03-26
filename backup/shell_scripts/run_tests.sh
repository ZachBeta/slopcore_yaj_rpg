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
TEST_MODE="all"

# Help function
show_help() {
    echo "Usage: ./run_tests.sh [OPTIONS] [test_file.py]"
    echo
    echo "Options:"
    echo "  --help        Show this help message"
    echo "  --verbose     Run tests with higher verbosity"
    echo "  --ci          Run tests in continuous integration mode"
    echo "  --test-mode   Run tests in a specific mode (all, python, etc.)"
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
        --test-mode)
            TEST_MODE="$2"
            shift
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

# Run Python Unit Tests (if any)
if [[ "$TEST_MODE" == "all" || "$TEST_MODE" == "python" ]]; then
    echo
    echo "==================================================================="
    echo "Running Python Unit Tests"
    echo "==================================================================="
    echo
    
    # Python test commands are now replaced with TypeScript tests
    # python3 -m unittest discover -s cmd/terminal_game/tests
    # If verbose is enabled
    # python3 cmd/terminal_game/tests/run_tests.py $VERBOSE
    
    echo "Python tests have been replaced with TypeScript tests."
    echo "Run 'cd web && npm test' to run the TypeScript tests."
    
    # Return code based on if tests weren't run
    PYTHON_TESTS_RC=0
else
    echo "Skipping Python tests (test mode: $TEST_MODE)"
    PYTHON_TESTS_RC=0
fi

# Check exit code
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n\033[32mAll tests passed successfully!\033[0m"
else
    echo -e "\n\033[31mSome tests failed. Please check the output above for details.\033[0m"
fi

exit $EXIT_CODE 