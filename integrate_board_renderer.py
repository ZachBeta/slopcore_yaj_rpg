#!/usr/bin/env python3
"""
Integration Example - Demonstrates how to integrate the game board renderer with the terminal game
"""

import sys
import os
import importlib.util
import time

# Path to the terminal game and game renderer modules
terminal_game_path = "cmd/terminal_game"

# Attempt to import the terminal game modules
sys.path.append(os.path.abspath(terminal_game_path))

try:
    from terminal_game import TerminalGame, GamePhase
    from game_renderer import TerminalRenderer
    from card_data import load_cards
    from game_board_render import display_board, display_run_success, display_ice_encounter
    
    print("Successfully imported game modules")
except ImportError as e:
    print(f"Error importing game modules: {e}")
    sys.exit(1)

def map_card_type(original_type):
    """Map the original card type to the type used in the board renderer"""
    type_map = {
        "Program": "program",
        "Hardware": "hardware",
        "Resource": "resource",
        "Event": "event",
        "ICE": "ice",
        "Agenda": "agenda",
        "Asset": "asset",
        "Upgrade": "upgrade",
        "Operation": "operation",
        "Virus": "virus"
    }
    return type_map.get(original_type, original_type.lower())

def get_game_board_options(game):
    """
    Extract the current game state from the TerminalGame object
    and convert it to options for the board renderer
    """
    options = {
        'credits': game.player_credits,
        'memory': [game.memory_units_used, game.memory_units_available],
        'clicks': game.clicks_remaining,
        'installed_cards': [],
        'hand_cards': []
    }
    
    # Convert hand cards to the format expected by the board renderer
    for card in game.hand_cards:
        card_copy = card.copy()
        card_copy['type'] = map_card_type(card.get('type', 'Unknown'))
        options['hand_cards'].append(card_copy)
    
    # Convert installed cards to the format expected by the board renderer
    for card in game.played_cards:
        card_copy = card.copy()
        card_copy['type'] = map_card_type(card.get('type', 'Unknown'))
        options['installed_cards'].append(card_copy)
    
    # If there's an active run, add run info
    if game.current_run:
        options['run_server'] = game.current_run.get('server')
        options['ice_index'] = game.current_run.get('ice_index', 0)
        
        # Set ice_encounter flag if the runner is currently facing ICE
        if game.current_run.get('encountering_ice'):
            options['ice_encounter'] = True
        
        # Set run_success flag if the run was successful
        if game.current_run.get('successful'):
            options['run_success'] = True
    
    return options

def create_sample_game_state():
    """
    Create a sample game state for demonstration purposes
    This simulates what would be extracted from an actual game instance
    """
    # Sample cards from the game's card data
    cards = load_cards()
    
    # Create a sample game state
    sample_state = {
        'player_credits': 7,
        'memory_units_used': 3,
        'memory_units_available': 4,
        'clicks_remaining': 2,
        'hand_cards': [
            {
                'name': 'Run Exploit',
                'type': 'Event',
                'cost': 2,
                'mu': 0,
                'description': 'Bypass the first piece of ice encountered during a run',
            },
            {
                'name': 'Memory Chip',
                'type': 'Hardware',
                'cost': 1,
                'mu': 0,
                'description': '+1 Memory Unit',
            },
            {
                'name': 'Crypto Cache',
                'type': 'Resource',
                'cost': 2,
                'mu': 0,
                'description': 'Gain 1 credit at the start of your turn',
            }
        ],
        'played_cards': [
            {
                'name': 'Icebreaker.exe',
                'type': 'Program',
                'cost': 3,
                'mu': 1,
                'strength': 2,
                'description': 'Break ice subroutines with strength <= 2',
            },
            {
                'name': 'Neural Matrix',
                'type': 'Hardware',
                'cost': 2,
                'mu': 0,
                'description': '+2 Memory Units',
            },
            {
                'name': 'Quantum Protocol',
                'type': 'Program',
                'cost': 4,
                'mu': 2,
                'strength': 4,
                'description': 'Break up to 3 subroutines on a single piece of ice',
            }
        ],
        'current_run': {
            'server': 'R&D',
            'ice_index': 1,
            'encountering_ice': True,
            'successful': False
        }
    }
    
    return sample_state

def simulate_run_progress(options):
    """Simulate a run progress for demonstration"""
    print("\nSimulating a run on R&D server...\n")
    time.sleep(1)
    
    # Start the run
    options['run_server'] = 'R&D'
    options['ice_index'] = 0
    options['ice_encounter'] = True
    options['run_success'] = False
    display_board(options)
    time.sleep(2)
    
    # Break through first ICE
    print("\nBreaking through first ICE...\n")
    time.sleep(1)
    options['ice_index'] = 1
    options['ice_encounter'] = True
    display_board(options)
    time.sleep(2)
    
    # Break through second ICE
    print("\nBreaking through second ICE...\n")
    time.sleep(1)
    options['ice_index'] = 2
    options['ice_encounter'] = False
    display_board(options)
    time.sleep(2)
    
    # Run successful
    print("\nRun successful! Accessing server...\n")
    time.sleep(1)
    options['run_success'] = True
    display_board(options)
    time.sleep(2)

def main():
    print("Demonstrating integration of game board renderer with terminal game")
    print("================================================================\n")
    
    # Create a sample game state
    sample_state = create_sample_game_state()
    
    # Convert the sample state to board renderer options
    options = {
        'credits': sample_state['player_credits'],
        'memory': [sample_state['memory_units_used'], sample_state['memory_units_available']],
        'clicks': sample_state['clicks_remaining'],
        'hand_cards': [card.copy() for card in sample_state['hand_cards']],
        'installed_cards': [card.copy() for card in sample_state['played_cards']]
    }
    
    # Map card types to the format expected by the board renderer
    for card in options['hand_cards']:
        card['type'] = map_card_type(card['type'])
    
    for card in options['installed_cards']:
        card['type'] = map_card_type(card['type'])
    
    # If there's an active run, add run info
    if sample_state.get('current_run'):
        options['run_server'] = sample_state['current_run']['server']
        options['ice_index'] = sample_state['current_run']['ice_index']
        options['ice_encounter'] = sample_state['current_run']['encountering_ice']
        options['run_success'] = sample_state['current_run']['successful']
    
    # Display the initial game board
    display_board(options)
    
    # Simulate a run for demonstration
    simulate_run_progress(options)
    
    print("\nDemo complete!")

if __name__ == "__main__":
    main() 