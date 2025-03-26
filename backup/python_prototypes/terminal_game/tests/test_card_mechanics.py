#!/usr/bin/env python3
"""
Tests for card mechanics in Neon Dominance
"""

import unittest
import random
import sys
import os

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from terminal_game import TerminalGame
from card_data import load_cards
from tests.mock_renderer import SilentRenderer
from tests.test_game_wrapper import TestGameWrapper

class TestCardMechanics(unittest.TestCase):
    """Tests for card installation and usage"""
    
    def setUp(self):
        """Set up test environment before each test"""
        # Use a fixed seed for reproducible tests
        self.seed = 12345
        random.seed(self.seed)
        
        # Create a silent renderer for testing
        self.renderer = SilentRenderer()
        
        # Load cards
        self.cards = load_cards()
        
        # Create a game instance with wrapper
        game = TerminalGame(self.renderer, self.cards, self.seed)
        self.game = TestGameWrapper(game)
        self.game.initialize()
        
        # Give the runner plenty of credits for testing
        self.game.runner_credits = 20
    
    def test_card_installation(self):
        """Test installing a card from hand"""
        # Get the initial state
        initial_hand_size = len(self.game.runner_hand)
        initial_installed = len(self.game.runner_installed)
        initial_credits = self.game.runner_credits
        
        # Make sure we have cards to install
        self.assertGreater(initial_hand_size, 0)
        
        # Get the install cost of the first card
        card_to_install = self.game.runner_hand[0]
        install_cost = card_to_install.get('cost', 0)
        
        # Process the install command
        self.game.process_command("install 1")
        
        # Check that the card was installed
        self.assertEqual(len(self.game.runner_hand), initial_hand_size - 1)
        self.assertEqual(len(self.game.runner_installed), initial_installed + 1)
        
        # Check that credits were spent
        self.assertEqual(self.game.runner_credits, initial_credits - install_cost)
    
    def test_memory_usage(self):
        """Test that card installation uses memory correctly"""
        # Install several cards that use memory
        initial_memory = self.game.runner_memory_used
        
        # Install first card
        first_card = self.game.runner_hand[0]
        first_card_mu = first_card.get('memory_cost', 0)
        self.game.process_command("install 1")
        
        # Check memory usage increased appropriately
        if first_card_mu > 0:
            self.assertEqual(self.game.runner_memory_used, initial_memory + first_card_mu)
    
    def test_install_with_insufficient_credits(self):
        """Test installing a card with insufficient credits"""
        # Find a card with a cost
        for i, card in enumerate(self.game.runner_hand):
            if card.get('cost', 0) > 0:
                # Set credits below the card's cost
                self.game.runner_credits = card.get('cost', 0) - 1
                
                # Try to install the card
                self.game.process_command(f"install {i+1}")
                
                # Check that card wasn't installed
                self.assertEqual(len(self.game.runner_installed), 0)
                break
    
    def test_memory_limit(self):
        """Test memory limit enforcement"""
        # Set memory units to a known value
        self.game.runner_memory_units = 4
        
        # Find a card with high memory cost
        high_mu_card = None
        for i, card in enumerate(self.game.runner_hand):
            if card.get('memory_cost', 0) > 3:
                high_mu_card = (i+1, card)
                break
        
        if high_mu_card:
            index, card = high_mu_card
            # Try to install the card
            self.game.process_command(f"install {index}")
            
            # Check that the memory limit is enforced
            self.assertLessEqual(self.game.runner_memory_used, self.game.runner_memory_units)

if __name__ == "__main__":
    unittest.main() 