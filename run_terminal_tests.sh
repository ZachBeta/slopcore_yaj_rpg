#!/bin/bash
# ========================================================================
# NEON DOMINANCE - TERMINAL INTERFACE TEST RUNNER
# ========================================================================
# This script runs the terminal interface tests for the Netrunner-inspired
# cyberpunk card game, providing clear feedback on test success/failure

# ANSI color codes for cyberpunk-themed output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
BLUE='\033[0;34m'
RESET='\033[0m'

# Simple box-drawing header that works in all terminals
echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════════════════════╗"
echo "  ║                    NEON DOMINANCE                        ║"
echo "  ║             TERMINAL INTERFACE TEST SUITE                ║"
echo "  ╚══════════════════════════════════════════════════════════╝"
echo -e "${RESET}"

# Check if we're in the right directory (project root)
if [ ! -d "game" ] || [ ! -d "game/tests" ]; then
    echo -e "${RED}[ERROR]${RESET} This script must be run from the project root directory."
    echo "Current directory: $(pwd)"
    echo "Please change to the project root directory and try again."
    exit 1
fi

# Check if Godot is installed and available
if ! command -v godot &> /dev/null; then
    echo -e "${RED}[ERROR]${RESET} Godot engine not found in PATH."
    echo "Please make sure Godot is installed and accessible from the command line."
    echo "Download Godot from: https://godotengine.org/download"
    exit 1
fi

# Check Godot version (optional but helpful)
GODOT_VERSION=$(godot --version 2>/dev/null || echo "Unknown")
echo -e "${BLUE}[INFO]${RESET} Using Godot version: ${GODOT_VERSION}"

# Initialize test options
RUN_ALL=false
RUN_UNIT=false
RUN_INTEGRATION=false
VERBOSE=false

# Parse command line arguments
if [ $# -eq 0 ]; then
    # Default to running all tests
    RUN_ALL=true
else
    for arg in "$@"; do
        case $arg in
            --all)
                RUN_ALL=true
                ;;
            --unit)
                RUN_UNIT=true
                ;;
            --integration)
                RUN_INTEGRATION=true
                ;;
            --verbose)
                VERBOSE=true
                ;;
            --help)
                echo -e "${CYAN}[HELP]${RESET} Terminal Interface Test Runner"
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --all          Run all tests (default if no options specified)"
                echo "  --unit         Run only unit tests"
                echo "  --integration  Run only integration tests"
                echo "  --verbose      Show detailed test output"
                echo "  --help         Display this help message"
                exit 0
                ;;
            *)
                echo -e "${YELLOW}[WARNING]${RESET} Unknown option: $arg"
                ;;
        esac
    done
fi

# If no specific test type was selected, run all
if [ "$RUN_ALL" = true ] || ([ "$RUN_UNIT" = false ] && [ "$RUN_INTEGRATION" = false ]); then
    RUN_UNIT=true
    RUN_INTEGRATION=true
fi

echo -e "${PURPLE}[SYSTEM]${RESET} Initializing test sequence at $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${PURPLE}[SYSTEM]${RESET} Runner identity verified. Jacking in..."

# Print test configuration
echo -e "${BLUE}[CONFIG]${RESET} Test configuration:"
echo -e "  Unit tests: $([ "$RUN_UNIT" = true ] && echo "${GREEN}ENABLED${RESET}" || echo "${RED}DISABLED${RESET}")"
echo -e "  Integration tests: $([ "$RUN_INTEGRATION" = true ] && echo "${GREEN}ENABLED${RESET}" || echo "${RED}DISABLED${RESET}")"
echo -e "  Verbose mode: $([ "$VERBOSE" = true ] && echo "${GREEN}ENABLED${RESET}" || echo "${RED}DISABLED${RESET}")"

# Create a temporary directory for test results
TEMP_DIR=$(mktemp -d)
UNIT_TEST_LOG="${TEMP_DIR}/unit_test.log"
INTEGRATION_TEST_LOG="${TEMP_DIR}/integration_test.log"

# Function to run a test with proper output handling
run_test() {
    local test_type=$1
    local test_path=$2
    local log_file=$3
    
    echo -e "${CYAN}[TEST]${RESET} Running ${test_type} tests..."
    
    # Run the test and capture output
    if [ "$VERBOSE" = true ]; then
        godot --headless --script "${test_path}" | tee "${log_file}"
        TEST_RESULT=${PIPESTATUS[0]}
    else
        godot --headless --script "${test_path}" > "${log_file}" 2>&1
        TEST_RESULT=$?
    fi
    
    # Check result and show appropriate message
    if [ $TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}[SUCCESS]${RESET} ${test_type} tests completed successfully!"
        return 0
    else
        echo -e "${RED}[FAILURE]${RESET} ${test_type} tests failed with exit code ${TEST_RESULT}"
        
        # Always show log on failure (even in non-verbose mode)
        if [ "$VERBOSE" = false ]; then
            echo -e "${YELLOW}[LOG]${RESET} Test output:"
            cat "${log_file}"
        fi
        
        return 1
    fi
}

# Keep track of overall test status
OVERALL_STATUS=0

# Run terminal unit tests if enabled
if [ "$RUN_UNIT" = true ]; then
    echo -e "\n${PURPLE}[SYSTEM]${RESET} Accessing terminal unit test modules...\n"
    if run_test "Terminal unit" "game/tests/unit/terminal_game_test.gd" "${UNIT_TEST_LOG}"; then
        echo -e "${GREEN}[✓]${RESET} Terminal command parsing verified"
        echo -e "${GREEN}[✓]${RESET} BSD-style documentation tests passed"
        echo -e "${GREEN}[✓]${RESET} Help system functionality confirmed"
    else
        OVERALL_STATUS=1
        echo -e "${RED}[!]${RESET} Unit test failures detected - see log above"
    fi
fi

# Run terminal integration tests if enabled
if [ "$RUN_INTEGRATION" = true ]; then
    echo -e "\n${PURPLE}[SYSTEM]${RESET} Initializing integration test sequence...\n"
    if run_test "Terminal integration" "game/tests/integration/terminal_interface_test.gd" "${INTEGRATION_TEST_LOG}"; then
        echo -e "${GREEN}[✓]${RESET} Terminal interface loads correctly"
        echo -e "${GREEN}[✓]${RESET} Command input/output systems operational"
        echo -e "${GREEN}[✓]${RESET} User interaction tests verified"
    else
        OVERALL_STATUS=1
        echo -e "${RED}[!]${RESET} Integration test failures detected - see log above"
    fi
fi

# Clean up temp files
rm -rf "${TEMP_DIR}"

# Print final summary
echo -e "\n${CYAN}╔════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║           TEST SEQUENCE COMPLETE        ║${RESET}"
echo -e "${CYAN}╚════════════════════════════════════════╝${RESET}\n"

if [ $OVERALL_STATUS -eq 0 ]; then
    echo -e "${GREEN}[SUCCESS]${RESET} All terminal interface tests passed!"
    echo -e "${BLUE}[INFO]${RESET} The terminal interface is fully operational."
    echo -e "${PURPLE}[SYSTEM]${RESET} Neural connection terminated successfully."
else
    echo -e "${RED}[FAILURE]${RESET} Some terminal interface tests failed."
    echo -e "${YELLOW}[INFO]${RESET} Please fix the issues highlighted above."
    echo -e "${PURPLE}[SYSTEM]${RESET} Neural connection closed with errors."
fi

exit $OVERALL_STATUS
