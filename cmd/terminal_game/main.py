#!/usr/bin/env python3
"""
Neon Dominance - Terminal Game Mode
A terminal-based implementation of the game for testing gameplay mechanics
"""

import sys
import os
import random
import time
import argparse
from terminal_game import TerminalGame
from game_renderer import TerminalRenderer
from card_data import load_cards

def parse_arguments():
    parser = argparse.ArgumentParser(description='Neon Dominance Terminal Game')
    parser.add_argument('--seed', type=int, default=None, help='Random seed for reproducible gameplay')
    parser.add_argument('--test', action='store_true', help='Run in test mode with automated commands')
    parser.add_argument('--scenario', type=str, default='quick', 
                      choices=['quick', 'install', 'run', 'full'], 
                      help='Test scenario to run')
    parser.add_argument('--delay', type=float, default=0.5, 
                      help='Delay between automated commands in seconds')
    return parser.parse_args()

def main():
    # Parse command line arguments
    args = parse_arguments()
    
    # Set random seed if provided
    seed_value = args.seed if args.seed is not None else random.randint(1, 100000)
    random.seed(seed_value)
    print(f"Using random seed: {seed_value}")
    
    # Initialize terminal renderer
    renderer = TerminalRenderer()
    
    # Load card data
    cards = load_cards()
    
    # Create and initialize the game
    game = TerminalGame(renderer, cards, seed_value)
    game.initialize()
    
    # If in test mode, run the test scenario
    if args.test:
        run_test_scenario(game, renderer, args.scenario, args.delay)
    else:
        # Interactive game loop
        run_interactive_game(game, renderer)
    
    print("\nThanks for playing Neon Dominance Terminal Game!")
    return 0

def run_interactive_game(game, renderer):
    """Run the game in interactive mode with user input"""
    while not game.game_over:
        try:
            # Display prompt
            renderer.display_prompt()
            
            # Get user input
            command = input().strip()
            
            # Handle special commands
            if command.lower() == 'exit' or command.lower() == 'quit':
                break
                
            # Process the command
            game.process_command(command)
            
        except KeyboardInterrupt:
            print("\nGame terminated by user.")
            break
        except Exception as e:
            print(f"\nError: {e}")
            # In a real game, we might want to continue despite errors

def run_test_scenario(game, renderer, scenario_name, delay):
    """Run a predefined test scenario with automated commands"""
    # Define test scenarios
    scenarios = {
        'quick': [
            "hand",
            "draw",
            "install 1",
            "run R&D",
            "end"
        ],
        'install': [
            "hand",
            "draw",
            "install 1",
            "installed",
            "memory",
            "credits",
            "draw",
            "install 2",
            "installed",
            "memory"
        ],
        'run': [
            "hand",
            "draw",
            "install 1",
            "run R&D",
            "run HQ",
            "run Archives",
            "end"
        ],
        'full': [
            # Turn 1 - Installation and basic actions
            "help",         # Start with basic help to see available commands
            "system",       # Check system status
            "hand",         # Check initial hand
            "credits",      # Check credits
            "memory",       # Check memory status
            "draw",         # Draw a card (+1 click)
            "hand",         # Check updated hand after drawing
            "install 1",    # Install first card (+3 click)
            "installed",    # Check installed programs
            "memory",       # Check memory status after installation
            "run R&D",      # Run on R&D server (+4 click)
            "end",          # End turn to see corporation's turn
            
            # Turn 2 - More installations and runs
            "hand",         # Check hand after corp turn
            "draw",         # Draw a card (+1 click)
            "install 2",    # Install second card (+2 click)
            "install 3",    # Install third card (+3 click)
            "run HQ",       # Run on HQ server (+4 click)
            "end",          # End turn
            
            # Turn 3 - Economic actions and server run
            "credits",      # Check credit status
            "draw",         # Draw a card (+1 click)
            "draw",         # Draw another card (+2 click)
            "hand",         # Check hand
            "run Archives", # Run archives (+3 click)
            "run R&D",      # Run R&D (+4 click)
            "end"           # End final turn
        ]
    }
    
    # Get the commands for the selected scenario
    commands = scenarios.get(scenario_name, scenarios['quick'])
    
    print(f"\n========== RUNNING TEST SCENARIO: {scenario_name.upper()} ==========")
    print(f"Will execute {len(commands)} commands with {delay}s delay between commands")
    time.sleep(1)  # Brief pause before starting
    
    # Execute each command
    for i, cmd in enumerate(commands):
        print(f"\n>> EXECUTING COMMAND {i+1}/{len(commands)}: '{cmd}'")
        
        # Display the command as if the user typed it
        renderer.display_prompt()
        print(cmd)
        
        # Process the command
        game.process_command(cmd)
        
        # Wait before executing next command
        time.sleep(delay)
    
    print("\n========== TEST SCENARIO COMPLETED ==========")

if __name__ == "__main__":
    sys.exit(main())
