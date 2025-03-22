#!/bin/bash

# Terminal mode integration test runner
echo "========================================"
echo "  Running Terminal Mode System Test"
echo "========================================"

# Stop on first error
set -e

echo "Running test with Godot..."
godot --headless --script game/tests/integration/terminal_interface_test.gd

echo "========================================"
echo "  Terminal Mode Test Complete!"
echo "========================================"
