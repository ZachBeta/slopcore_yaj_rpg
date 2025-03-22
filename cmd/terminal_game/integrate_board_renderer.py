#!/usr/bin/env python3
"""
Integrate the ASCII Game Board Renderer with the Terminal Game
This script acts as a bridge between the terminal game and the ASCII board renderer
"""

import os
import sys
import time
import subprocess
import argparse
import re

# Import the game board renderer
import game_board_render

def clean_ansi(text):
    """Remove ANSI escape codes from text"""
    ansi_escape = re.compile(r'\x1b[^m]*m')
    return ansi_escape.sub('', text)

def run_game_with_renderer(scenario='basic', delay=1, seed=None):
    """
    Run the terminal game with the ASCII board renderer integrated
    
    Args:
        scenario: The test scenario to run ('basic', 'full', 'custom')
        delay: Delay between game actions in seconds
        seed: Random seed for reproducible runs
    """
    # First display the ASCII game board in its initial state
    game_board_render.display_board()
    
    # Build the command to run the game
    cmd = ['../../run_game.sh', '--test']
    cmd.append(f'--scenario')
    cmd.append(scenario)
    cmd.append(f'--delay')
    cmd.append(str(delay))
    
    # Add seed if specified
    if seed:
        cmd.append('--seed')
        cmd.append(str(seed))
    
    # Run the game process with real-time output capture
    process = subprocess.Popen(
        cmd, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )
    
    # Track game state
    current_server = None
    ice_index = 0
    credits = 5
    memory = [0, 4]
    clicks = 4
    runner_cards = []
    
    # Process output line by line
    for line in iter(process.stdout.readline, ''):
        print(line, end='')  # Echo to console
        
        # Parse game state from output
        if "Credits:" in line and "MU:" in line and "Clicks:" in line:
            parts = line.split('|')
            for part in parts:
                if "Credits:" in part:
                    try:
                        credits = int(part.split(':')[1].strip())
                    except:
                        pass
                if "MU:" in part:
                    try:
                        mu_parts = part.split(':')[1].strip().split('/')
                        memory = [int(mu_parts[0]), int(mu_parts[1])]
                    except:
                        pass
                if "Clicks:" in part:
                    try:
                        click_parts = part.split(':')[1].strip().split('/')
                        clicks = int(click_parts[0])
                    except:
                        pass
        
        # Detect run initiation
        if "INITIATING RUN ON" in line:
            parts = line.split("INITIATING RUN ON")
            if len(parts) > 1:
                server_name = clean_ansi(parts[1].strip().rstrip('.'))
                
                # Standard server mapping
                server_map = {
                    'HQ': 'HQ',
                    'R&D': 'R&D',
                    'ARCHIVES': 'Archives',
                    'SERVER 1': 'Server 1',
                    'SERVER1': 'Server 1'
                }
                
                current_server = server_map.get(server_name.upper(), server_name)
                ice_index = 0
                
                # Update game board for run
                try:
                    game_board_render.display_board({
                        'run_server': current_server,
                        'ice_index': ice_index,
                        'credits': credits,
                        'memory': memory,
                        'clicks': clicks
                    })
                    time.sleep(1)  # Pause to show the board
                except Exception as e:
                    print(f"Error updating board: {e}")
        
        # Detect ICE encounters
        if "ICE ENCOUNTERED:" in line:
            if current_server:
                # Update game board to show ice encounter
                try:
                    game_board_render.display_board({
                        'run_server': current_server,
                        'ice_index': ice_index,
                        'ice_encounter': True,
                        'credits': credits,
                        'memory': memory,
                        'clicks': clicks
                    })
                    time.sleep(1)  # Pause to show the encounter
                    ice_index += 1  # Move to next ice
                except Exception as e:
                    print(f"Error updating ice encounter: {e}")
        
        # Detect successful run
        if "RUN SUCCESSFUL" in line:
            # Show run success animation
            try:
                game_board_render.display_board({
                    'run_server': current_server,
                    'run_success': True,
                    'credits': credits,
                    'memory': memory,
                    'clicks': clicks
                })
                time.sleep(1)  # Pause to show success
                current_server = None
            except Exception as e:
                print(f"Error showing run success: {e}")
        
        # Detect card installation or other major game state changes
        if "Installing" in line and "for" in line and "credits" in line:
            # Update game board to reflect installed card
            try:
                game_board_render.display_board({
                    'credits': credits,
                    'memory': memory,
                    'clicks': clicks
                })
                time.sleep(0.5)  # Brief pause
            except Exception as e:
                print(f"Error updating after installation: {e}")
    
    # Wait for process to complete
    process.wait()
    return process.returncode

def parse_arguments():
    """Parse command-line arguments"""
    parser = argparse.ArgumentParser(description='Run the terminal game with ASCII game board visualization')
    parser.add_argument('--scenario', choices=['basic', 'full', 'custom'], default='basic',
                       help='Test scenario to run')
    parser.add_argument('--delay', type=float, default=2,
                       help='Delay between game actions (seconds)')
    parser.add_argument('--seed', type=int, help='Random seed for reproducible runs')
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_arguments()
    run_game_with_renderer(args.scenario, args.delay, args.seed) 