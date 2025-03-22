#!/usr/bin/env python3
"""
Mock renderer for testing that captures or suppresses output
"""

import sys
import os

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from game_renderer import TerminalRenderer

class SilentRenderer(TerminalRenderer):
    """A renderer that suppresses all output for quiet testing"""
    
    def __init__(self):
        """Initialize the renderer but override methods to suppress output"""
        # Create minimum required attributes
        self.status_line = ""
        self.prompt_text = "> "
        self.terminal_width = 80
        self.terminal_height = 24
        self.header_text = "TEST MODE"
        # Mock ASCII art
        self.ascii_art = {
            "logo": ["TEST LOGO"],
            "ice": ["TEST ICE"],
            "runner": ["TEST RUNNER"],
            "server": ["TEST SERVER"]
        }
    
    def display(self, text, color=None):
        """Suppress display output"""
        pass
    
    def display_prompt(self):
        """Suppress prompt display"""
        pass
    
    def clear_screen(self):
        """Suppress screen clearing"""
        pass
    
    def display_header(self):
        """Suppress header display"""
        pass
    
    def display_welcome(self):
        """Suppress welcome display"""
        pass
    
    def output_ascii_art(self, art_name):
        """Mock ASCII art output"""
        pass

class CaptureRenderer(TerminalRenderer):
    """A renderer that captures output for assertion testing"""
    
    def __init__(self, output_buffer):
        """Initialize with an output buffer"""
        # Create minimum required attributes
        self.status_line = ""
        self.prompt_text = "> "
        self.terminal_width = 80
        self.terminal_height = 24
        self.header_text = "TEST MODE"
        self.output_buffer = output_buffer
        # Mock ASCII art
        self.ascii_art = {
            "logo": ["TEST LOGO"],
            "ice": ["TEST ICE"],
            "runner": ["TEST RUNNER"],
            "server": ["TEST SERVER"]
        }
    
    def display(self, text, color=None):
        """Capture displayed text"""
        # Break text into lines and append each line to the buffer
        for line in text.split('\n'):
            if line.strip():  # Only capture non-empty lines
                self.output_buffer.append(line.strip())
    
    def display_prompt(self):
        """Capture prompt display"""
        self.output_buffer.append(self.prompt_text)
    
    def clear_screen(self):
        """Suppress screen clearing"""
        pass
    
    def display_header(self):
        """Suppress header display"""
        pass
    
    def display_welcome(self):
        """Capture welcome message"""
        self.output_buffer.append("WELCOME TO NEON DOMINANCE")
    
    def output_ascii_art(self, art_name):
        """Mock ASCII art output"""
        if art_name in self.ascii_art:
            for line in self.ascii_art[art_name]:
                self.output_buffer.append(line) 