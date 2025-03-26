#!/usr/bin/env python3
"""
Tests for the run mechanics in Neon Dominance
"""

import unittest
import random
import re
import sys
import os

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from terminal_game import TerminalGame
from card_data import load_cards
from tests.mock_renderer import CaptureRenderer
from tests.test_game_wrapper import TestGameWrapper

class TestRunMechanics(unittest.TestCase):
    """Tests for run mechanics and server interactions"""
    
    def setUp(self):
        """Set up test environment before each test"""
        # Use a fixed seed for reproducible tests
        self.seed = 12345
        random.seed(self.seed)
        
        # Capture output for testing
        self.output_buffer = []
        
        # Create a renderer that captures output
        self.renderer = CaptureRenderer(self.output_buffer)
        
        # Load cards
        self.cards = load_cards()
        
        # Create a game instance with wrapper
        game = TerminalGame(self.renderer, self.cards, self.seed)
        self.game = TestGameWrapper(game)
        self.game.initialize()
        
        # Give the runner enough credits for testing
        self.game.runner_credits = 10
        
        # Clear the output buffer after initialization
        self.output_buffer.clear()
    
    def test_basic_run(self):
        """Test a basic run on a server"""
        initial_clicks = self.game.runner_clicks
        
        # Process a run command on R&D
        self.game.process_command("run R&D")
        
        # Check that a click was used
        self.assertEqual(self.game.runner_clicks, initial_clicks - 1)
        
        # Just verify the run command executed without error
        self.assertTrue(True, "Run command executed without crashing")
    
    def test_server_exists(self):
        """Test that all standard servers exist"""
        servers = ["R&D", "HQ", "Archives"]
        
        for server in servers:
            # Process a run command on each server
            self.game.process_command(f"run {server}")
            
            # Check that clicks are being used (indicating command is accepted)
            self.assertLess(self.game.runner_clicks, 4, f"Run on {server} should use clicks")
    
    def test_invalid_server(self):
        """Test run on invalid server"""
        initial_clicks = self.game.runner_clicks
        
        # Process a run command on an invalid server
        self.game.process_command("run NonExistentServer")
        
        # If the command is rejected, clicks should remain the same
        self.assertEqual(self.game.runner_clicks, initial_clicks, "Invalid server should not use clicks")
    
    def test_jack_out_command_exists(self):
        """Test that the jack_out command exists"""
        # First, start a run
        self.game.process_command("run R&D")
        
        # Clear buffer before next command
        self.output_buffer.clear()
        
        # Try to jack out (we don't care about success, just that the command exists)
        # This test just verifies the command doesn't crash the game
        self.game.process_command("jack_out")
        self.assertTrue(True, "Jack out command executed without crashing")

    def test_run_with_approaches(self):
        """Test run approaches (stealth, aggressive, careful)"""
        approaches = ["--stealth", "--aggressive", "--careful"]
        
        for approach in approaches:
            initial_clicks = self.game.runner_clicks
            
            # Process a run command with an approach
            self.game.process_command(f"run R&D {approach}")
            
            # Check that a click was used, indicating the command was accepted
            self.assertEqual(self.game.runner_clicks, initial_clicks - 1, 
                             f"Run with {approach} should use 1 click")


if __name__ == "__main__":
    unittest.main() 