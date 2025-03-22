#!/bin/bash

# Terminal Game Test Scenario Runner
# This script allows running different test scenarios with a specific seed

# Default values
SCENARIO="FULL_GAME"
SEED=12345

# Display usage information
function show_usage {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -s, --scenario SCENARIO  Specify test scenario (QUICK_TEST, INSTALLATION_FOCUS, SERVER_RUN_FOCUS, FULL_GAME)"
  echo "  -r, --seed SEED          Set random seed for reproducible results"
  echo "  -h, --help               Show this help message"
  echo ""
  echo "Example: $0 --scenario QUICK_TEST --seed 54321"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -s|--scenario)
      SCENARIO="$2"
      shift 2
      ;;
    -r|--seed)
      SEED="$2"
      shift 2
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Validate scenario
if [[ ! "$SCENARIO" =~ ^(QUICK_TEST|INSTALLATION_FOCUS|SERVER_RUN_FOCUS|FULL_GAME)$ ]]; then
  echo "Error: Invalid scenario '$SCENARIO'"
  show_usage
  exit 1
fi

# Run the test with the specified parameters
echo "========================================"
echo "  Running Terminal Game Test Scenario"
echo "========================================"
echo "Scenario: $SCENARIO"
echo "Random Seed: $SEED"
echo "========================================"

# Use the in-project launcher script with command line arguments
godot --path . --script game/tests/gameplay/test_launcher.gd -- --scenario $SCENARIO --seed $SEED | tee terminal_test_${SCENARIO}_${SEED}.log

echo "========================================"
echo "  Test Complete! Results saved to terminal_test_${SCENARIO}_${SEED}.log"
echo "========================================"
