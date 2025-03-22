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
    BG_BLACK = "\033[40m"
    BG_RED = "\033[41m"
    BG_GREEN = "\033[42m"
    BG_YELLOW = "\033[43m"
    BG_BLUE = "\033[44m"
    BG_MAGENTA = "\033[45m"
    BG_CYAN = "\033[46m"
    BG_WHITE = "\033[47m"

class TerminalRenderer:
    def __init__(self):
        self.status_line = ""
        self.prompt_text = "> "
        self.terminal_width = shutil.get_terminal_size().columns
        self.terminal_height = shutil.get_terminal_size().lines
        self.header_text = "NEON DOMINANCE TERMINAL"
        self.ascii_art = {
            "logo": [
                r"  _   _                   ____                 _                           ",
                r" | \ | | ___  ___  _ __  |  _ \  ___  _ __ ___(_)_ __   __ _ _ __   ___ ___",
                r" |  \| |/ _ \/ _ \| '_ \ | | | |/ _ \| '_ \_  / | '_ \ / _` | '_ \ / __/ _ \\",
                r" | |\  |  __/ (_) | | | || |_| | (_) | | | / /| | | | | (_| | | | | (_|  __/",
                r" |_| \_|\___|\___/|_| |_||____/ \___/|_| |/_/ |_|_| |_|\__,_|_| |_|\___\___|",
                r"                                                                            "
            ],
            "runner": [
                r"  _____                            ",
                r" |  __ \                           ",
                r" | |__) |_   _ _ __  _ __   ___ _ __",
                r" |  _  /| | | | '_ \| '_ \ / _ \ '__|",
                r" | | \ \| |_| | | | | | | |  __/ |   ",
                r" |_|  \_\\__,_|_| |_|_| |_|\___|_|   ",
                r"                                    "
            ],
            "corp": [
                r"   _____                                    _   _             ",
                r"  / ____|                                  | | (_)            ",
                r" | |     ___  _ __ _ __   ___  _ __ __ _| |_ _  ___  _ __  ",
                r" | |    / _ \| '__| '_ \ / _ \| '__/ _` | __| |/ _ \| '_ \ ",
                r" | |___| (_) | |  | |_) | (_) | | | (_| | |_| | (_) | | | |",
                r"  \_____\___/|_|  | .__/ \___/|_|  \__,_|\__|_|\___/|_| |_|",
                r"                  | |                                       ",
                r"                  |_|                                       "
            ],
            "run": [
                r" _______ _______ _______ _______ _______ _______ _______ ",
                r" |\     /|\     /|\     /|\     /|\     /|\     /|\     /|",
                r" | +---+ | +---+ | +---+ | +---+ | +---+ | +---+ | +---+ |",
                r" | |   | | |   | | |   | | |   | | |   | | |   | | |   | |",
                r" | |R  | | |U  | | |N  | | |N  | | |I  | | |N  | | |G  | |",
                r" | +---+ | +---+ | +---+ | +---+ | +---+ | +---+ | +---+ |",
                r" |/_____\|/_____\|/_____\|/_____\|/_____\|/_____\|/_____\|",
                r"                                                          "
            ],
            "ice": [
                r" +-----------------+",
                r" |    FIREWALL     |",
                r" +-----------------+",
                r" | [====||====]    |",
                r" | [====||====]    |",
                r" | [====||====]    |",
                r" +-----------------+"
            ]
        }
    
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
    
    def output_ascii_art(self, art_name):
        """Display ASCII art from the collection"""
        if art_name in self.ascii_art:
            for line in self.ascii_art[art_name]:
                print(f"{Colors.BRIGHT_CYAN}{line}{Colors.RESET}")
        else:
            print(f"ASCII art '{art_name}' not found")
    
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
    
    def display_welcome(self):
        """Display an enhanced welcome message"""
        self.clear_screen()
        self.output_ascii_art("logo")
        print()
        welcome_text = [
            f"{Colors.BRIGHT_CYAN}================================{Colors.RESET}",
            f"{Colors.BRIGHT_CYAN}    NEON DOMINANCE TERMINAL{Colors.RESET}",
            f"{Colors.BRIGHT_CYAN}================================{Colors.RESET}",
            f"{Colors.BRIGHT_GREEN}Neural Interface Active...{Colors.RESET}",
            f"{Colors.BRIGHT_YELLOW}Establishing secure connection...{Colors.RESET}",
            f"{Colors.BRIGHT_CYAN}Connection established.{Colors.RESET}",
            f"{Colors.BRIGHT_MAGENTA}Welcome, runner. Jack in to begin.{Colors.RESET}",
            f"{Colors.BRIGHT_CYAN}================================{Colors.RESET}",
            ""
        ]
        for line in welcome_text:
            print(line)
    
    def display_command_help(self, valid_commands):
        """Display available commands in a nicely formatted way"""
        print(f"{Colors.BOLD}TERMINAL COMMANDS:{Colors.RESET}")
        print(f"{Colors.BRIGHT_BLACK}================={Colors.RESET}")
        
        # Calculate the longest command for padding
        longest_cmd = max(len(cmd) for cmd in valid_commands.keys())
        
        # Display commands in a columnar format
        for cmd, desc in valid_commands.items():
            padding = " " * (longest_cmd - len(cmd) + 3)
            print(f"{Colors.BRIGHT_GREEN}{cmd}{Colors.RESET}{padding}- {desc}")
        
        print(f"\nFor detailed information on a command, type '{Colors.BRIGHT_YELLOW}help <command>{Colors.RESET}' or '{Colors.BRIGHT_YELLOW}man <command>{Colors.RESET}'.")
        print()
    
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
    
    def display_card_details(self, card):
        """Display detailed information about a card in a box format"""
        card_type = card.get('type', 'Unknown')
        name = card.get('name', 'Unknown')
        cost = card.get('cost', 0)
        mu = card.get('mu', 0)
        description = card.get('description', 'No description')
        
        # Visual formatting
        width = min(60, self.terminal_width - 4)  # Limit box width
        
        # Type-specific colors
        type_color = Colors.RESET
        box_color = Colors.BRIGHT_BLACK
        if card_type.lower() == "program":
            type_color = Colors.BRIGHT_CYAN
            box_color = Colors.BRIGHT_CYAN
        elif card_type.lower() == "hardware":
            type_color = Colors.BRIGHT_YELLOW
            box_color = Colors.BRIGHT_YELLOW
        elif card_type.lower() == "resource":
            type_color = Colors.BRIGHT_GREEN
            box_color = Colors.BRIGHT_GREEN
        elif card_type.lower() == "event":
            type_color = Colors.BRIGHT_MAGENTA
            box_color = Colors.BRIGHT_MAGENTA
        
        # Create card box
        print(f"{box_color}┌{'─' * (width - 2)}┐{Colors.RESET}")
        
        # Card name
        name_padding = (width - 2 - len(name)) // 2
        print(f"{box_color}│{Colors.RESET}{' ' * name_padding}{Colors.BOLD}{name}{Colors.RESET}{' ' * (width - 2 - len(name) - name_padding)}{box_color}│{Colors.RESET}")
        
        # Card type
        print(f"{box_color}│{Colors.RESET} {type_color}{card_type}{Colors.RESET}{' ' * (width - 3 - len(card_type))}{box_color}│{Colors.RESET}")
        
        # Cost and MU
        stats = f"Cost: {cost}   MU: {mu}"
        print(f"{box_color}│{Colors.RESET} {stats}{' ' * (width - 3 - len(stats))}{box_color}│{Colors.RESET}")
        
        # Separator
        print(f"{box_color}├{'─' * (width - 2)}┤{Colors.RESET}")
        
        # Description - word wrap
        words = description.split()
        line = ""
        for word in words:
            if len(line) + len(word) + 1 <= width - 4:
                line += word + " "
            else:
                print(f"{box_color}│{Colors.RESET} {line}{' ' * (width - 3 - len(line))}{box_color}│{Colors.RESET}")
                line = word + " "
        if line:
            print(f"{box_color}│{Colors.RESET} {line}{' ' * (width - 3 - len(line))}{box_color}│{Colors.RESET}")
        
        # Ability details if available
        if 'ability' in card:
            ability_type = card['ability'].get('type', 'Unknown')
            print(f"{box_color}├{'─' * (width - 2)}┤{Colors.RESET}")
            print(f"{box_color}│{Colors.RESET} {Colors.BRIGHT_GREEN}Ability Type:{Colors.RESET} {ability_type}{' ' * (width - 15 - len(ability_type))}{box_color}│{Colors.RESET}")
            
            # Show relevant ability details based on type
            if ability_type == 'break_ice':
                ice_types = ', '.join(card['ability'].get('ice_types', ['Unknown']))
                max_strength = str(card['ability'].get('max_strength', 0))
                print(f"{box_color}│{Colors.RESET} {Colors.BRIGHT_GREEN}Ice Types:{Colors.RESET} {ice_types}{' ' * (width - 12 - len(ice_types))}{box_color}│{Colors.RESET}")
                print(f"{box_color}│{Colors.RESET} {Colors.BRIGHT_GREEN}Max Strength:{Colors.RESET} {max_strength}{' ' * (width - 15 - len(max_strength))}{box_color}│{Colors.RESET}")
            elif ability_type == 'permanent' or ability_type == 'trigger':
                effect = card['ability'].get('effect', 'Unknown')
                value = str(card['ability'].get('value', 0))
                print(f"{box_color}│{Colors.RESET} {Colors.BRIGHT_GREEN}Effect:{Colors.RESET} {effect}{' ' * (width - 9 - len(effect))}{box_color}│{Colors.RESET}")
                print(f"{box_color}│{Colors.RESET} {Colors.BRIGHT_GREEN}Value:{Colors.RESET} {value}{' ' * (width - 8 - len(value))}{box_color}│{Colors.RESET}")
        
        # Bottom of box
        print(f"{box_color}└{'─' * (width - 2)}┘{Colors.RESET}")
    
    def display_running_animation(self, target_server):
        """Display a visual representation of initiating a run"""
        self.output_ascii_art("run")
        print(f"\n{Colors.BRIGHT_MAGENTA}Initiating run on {Colors.BOLD}{target_server}{Colors.RESET}{Colors.BRIGHT_MAGENTA}...{Colors.RESET}")
    
    def display_ice_encounter(self, ice_card):
        """Display a visual representation of encountering ICE"""
        print(f"\n{Colors.BRIGHT_RED}ICE ENCOUNTERED:{Colors.RESET}")
        self.output_ascii_art("ice")
        print(f"\n{Colors.BRIGHT_RED}You encounter {Colors.BOLD}{ice_card.get('name', 'Unknown ICE')}{Colors.RESET}")
        if 'description' in ice_card:
            print(f"{Colors.BRIGHT_RED}> {ice_card['description']}{Colors.RESET}")
        print()
    
    def display_turn_start(self, turn_number, player_side):
        """Display a visually appealing turn start banner"""
        print(f"\n{Colors.BRIGHT_BLACK}{'=' * 42}{Colors.RESET}")
        print(f"{Colors.BOLD}Turn {turn_number} - {player_side.capitalize()}'s turn{Colors.RESET}")
        
        if player_side.lower() == "runner":
            self.output_ascii_art("runner")
        else:
            self.output_ascii_art("corp")
    
    def display_game_over(self, winner, message):
        """Display game over message with visual effects"""
        print(f"\n{Colors.BG_BLUE}{Colors.BRIGHT_WHITE}{'=' * 60}{Colors.RESET}")
        print(f"{Colors.BG_BLUE}{Colors.BRIGHT_WHITE}{'GAME OVER':^60}{Colors.RESET}")
        print(f"{Colors.BG_BLUE}{Colors.BRIGHT_WHITE}{'=' * 60}{Colors.RESET}\n")
        
        if winner == "runner":
            self.output_ascii_art("runner")
            print(f"\n{Colors.BRIGHT_CYAN}RUNNER WINS!{Colors.RESET}")
        else:
            self.output_ascii_art("corp")
            print(f"\n{Colors.BRIGHT_RED}CORPORATION WINS!{Colors.RESET}")
        
        print(f"\n{Colors.BOLD}{message}{Colors.RESET}\n")
        print(f"{Colors.BRIGHT_BLACK}{'=' * 60}{Colors.RESET}")
