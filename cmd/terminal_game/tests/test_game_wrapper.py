#!/usr/bin/env python3
"""
Test wrapper for TerminalGame that exposes attributes in the expected format for tests
"""

import sys
import os

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from terminal_game import TerminalGame

class TestGameWrapper:
    """Wrapper for TerminalGame that maps internal attribute names to test-expected names"""
    
    def __init__(self, game):
        """Initialize with a TerminalGame instance"""
        self.game = game
    
    def initialize(self):
        """Initialize the game"""
        self.game.initialize()
    
    def process_command(self, command):
        """Process a command"""
        return self.game.process_command(command)
    
    @property
    def runner_hand(self):
        """Return the player's hand cards"""
        return self.game.hand_cards
    
    @property
    def runner_installed(self):
        """Return the player's installed cards"""
        return self.game.played_cards
    
    @property
    def runner_credits(self):
        """Return the player's credits"""
        return self.game.player_credits
    
    @runner_credits.setter
    def runner_credits(self, value):
        """Set the player's credits"""
        self.game.player_credits = value
    
    @property
    def runner_memory_units(self):
        """Return the player's total memory units"""
        return self.game.memory_units_available
    
    @runner_memory_units.setter
    def runner_memory_units(self, value):
        """Set the player's total memory units"""
        self.game.memory_units_available = value
    
    @property
    def runner_memory_used(self):
        """Return the player's used memory units"""
        return self.game.memory_units_used
    
    @property
    def runner_clicks(self):
        """Return the player's remaining clicks"""
        return self.game.clicks_remaining
    
    @property
    def corp_turn(self):
        """Return whether it's the corporation's turn"""
        return self.game.active_player == "corp"
    
    @property
    def game_over(self):
        """Return whether the game is over"""
        return self.game.game_over 