#!/usr/bin/env python3
"""
Terminal Renderer - Handles all text output for the terminal game
"""

import os
import sys
import shutil

# ANSI color codes for terminal colors
class Colors:
    BLACK = "\033[30m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    BRIGHT_BLACK = "\033[90m"
    BRIGHT_RED = "\033[91m"
    BRIGHT_GREEN = "\033[92m"
    BRIGHT_YELLOW = "\033[93m"
    BRIGHT_BLUE = "\033[94m"
    BRIGHT_MAGENTA = "\033[95m"
    BRIGHT_CYAN = "\033[96m"
    BRIGHT_WHITE = "\033[97m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"
    RESET = "\033[0m"

class TerminalRenderer:
    def __init__(self):
        self.status_line = ""
        self.prompt_text = "> "
        self.terminal_width = shutil.get_terminal_size().columns
        self.terminal_height = shutil.get_terminal_size().lines
        self.header_text = "NEON DOMINANCE TERMINAL"
    
    def clear_screen(self):
        """Clear the terminal screen"""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def output(self, text):
        """Output regular text to the terminal"""
        print(text)
    
    def output_error(self, text):
        """Output error text to the terminal (in red)"""
        print(f"{Colors.BRIGHT_RED}ERROR: {text}{Colors.RESET}")
    
    def output_warning(self, text):
        """Output warning text to the terminal (in yellow)"""
        print(f"{Colors.BRIGHT_YELLOW}WARNING: {text}{Colors.RESET}")
    
    def output_success(self, text):
        """Output success text to the terminal (in green)"""
        print(f"{Colors.BRIGHT_GREEN}{text}{Colors.RESET}")
    
    def update_status(self, status_text):
        """Update the status line at the bottom of the terminal"""
        self.status_line = status_text
        
        # In a full implementation, we might use curses to keep this at the bottom
        # For now, we'll just print it
        print(f"\n{Colors.BRIGHT_BLACK}{'-' * self.terminal_width}{Colors.RESET}")
        print(f"{Colors.BRIGHT_CYAN}{status_text}{Colors.RESET}")
        print(f"{Colors.BRIGHT_BLACK}{'-' * self.terminal_width}{Colors.RESET}")
    
    def display_prompt(self):
        """Display the command prompt"""
        print(f"{Colors.BRIGHT_GREEN}{self.prompt_text}{Colors.RESET}", end="")
        sys.stdout.flush()
    
    def display_header(self):
        """Display the terminal header"""
        header = f" {self.header_text} "
        padding = (self.terminal_width - len(header)) // 2
        header_line = "=" * padding + header + "=" * padding
        
        # Adjust if the total length is off by one (due to integer division)
        if len(header_line) < self.terminal_width:
            header_line += "="
        
        print(f"{Colors.BRIGHT_CYAN}{header_line}{Colors.RESET}")
    
    def format_card(self, card, index=None):
        """Format a card for display"""
        card_type = card.get('type', 'Unknown')
        
        # Change color based on card type
        type_color = Colors.RESET
        if card_type.lower() == "program":
            type_color = Colors.BRIGHT_CYAN
        elif card_type.lower() == "hardware":
            type_color = Colors.BRIGHT_YELLOW
        elif card_type.lower() == "resource":
            type_color = Colors.BRIGHT_GREEN
        elif card_type.lower() == "event":
            type_color = Colors.BRIGHT_MAGENTA
        
        # Format the card info
        if index is not None:
            return (
                f"[{index}] {Colors.BOLD}{card.get('name', 'Unknown')}{Colors.RESET} - "
                f"{type_color}{card_type}{Colors.RESET} - "
                f"{card.get('cost', 0)}c {card.get('mu', 0)}mu"
            )
        else:
            return (
                f"{Colors.BOLD}{card.get('name', 'Unknown')}{Colors.RESET} - "
                f"{type_color}{card_type}{Colors.RESET} - "
                f"{card.get('cost', 0)}c {card.get('mu', 0)}mu"
            )
