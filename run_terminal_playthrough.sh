#!/bin/bash

# Terminal Game Playthrough Test Runner
echo "========================================"
echo "  Running Terminal Game Playthrough"
echo "========================================"

echo "Starting full terminal game test with fixed seed..."
godot --script game/tests/gameplay/terminal_game_playthrough.gd | tee terminal_playthrough_output.log

echo "========================================"
echo "  Test Complete! Results saved to terminal_playthrough_output.log"
echo "========================================"
