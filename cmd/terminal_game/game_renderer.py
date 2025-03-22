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
            ],
            # Card type ASCII art
            "program": [
                r"    _____",
                r"   /    /|",
                r"  /____/ |",
                r" |    |  |",
                r" |____|/   "
            ],
            "icebreaker": [
                r"   /|  /|",
                r"  /_|_/ |",
                r" |     /|",
                r" |__/|/ |",
                r" |  ||  |",
                r" |__|/   "
            ],
            "hardware": [
                r"  _______",
                r" /       \\",
                r"|  o   o  |",
                r"|    |    |",
                r"|___|___|_|"
            ],
            "resource": [
                r"    $$$    ",
                r"   $   $   ",
                r"   $   $   ",
                r"   $   $   ",
                r"    $$$    "
            ],
            "event": [
                r"    /\\    ",
                r"   /  \\   ",
                r"  /    \\  ",
                r" +------+ ",
                r" |      | "
            ],
            "virus": [
                r"    ()    ",
                r"   /\\/\\   ",
                r"  <(  )>  ",
                r"   \\\\//   ",
                r"    \\/    "
            ],
            "operation": [
                r"   __/\\__   ",
                r"  /      \\  ",
                r" |   >>   | ",
                r"  \\______/  ",
                r"    |  |    "
            ],
            "asset": [
                r"    _____    ",
                r"   |     |   ",
                r"   |  █  |   ",
                r"   |_____|   ",
                r"   /  |  \\   "
            ],
            "upgrade": [
                r"     /\\     ",
                r"    /||\\    ",
                r"   /||||\\   ",
                r"  /||||||\\  ",
                r" /_|_||_|_\\ "
            ],
            "agenda": [
                r"   _   _   ",
                r"  / \\ / \\  ",
                r" |  ■ ■  | ",
                r"  \\_/ \\_/  ",
                r"    | |    "
            ],
            # Server types
            "rd_server": [
                r"╔═══════════════════╗",
                r"║ R&D SERVER ACCESS ║",
                r"╠═══════════════════╣",
                r"║ ┌─────┐ ┌─────┐   ║",
                r"║ │DATA │ │DATA │   ║",
                r"║ │FILES│ │FILES│   ║",
                r"║ └─────┘ └─────┘   ║",
                r"║ ┌─────┐           ║",
                r"║ │DATA │           ║",
                r"║ │FILES│           ║",
                r"║ └─────┘           ║",
                r"╚═══════════════════╝"
            ],
            "hq_server": [
                r"╔═══════════════════╗",
                r"║  HQ SERVER ACCESS ║",
                r"╠═══════════════════╣",
                r"║      ┌─────┐      ║",
                r"║     /│CORP │\     ║",
                r"║    / │ HQ  │ \    ║",
                r"║   /  └─────┘  \   ║",
                r"║  /     ___     \  ║",
                r"║ │     /   \     │ ║",
                r"║ │    │     │    │ ║",
                r"║ └────╲___/─────┘ ║",
                r"╚═══════════════════╝"
            ],
            "archives_server": [
                r"╔═══════════════════╗",
                r"║ ARCHIVES ACCESS   ║",
                r"╠═══════════════════╣",
                r"║    ┌─────────┐    ║",
                r"║   /│ARCHIVES │\   ║",
                r"║  / └─────────┘ \  ║",
                r"║ │  ┌┐ ┌┐ ┌┐ ┌┐  │ ║",
                r"║ │  └┘ └┘ └┘ └┘  │ ║",
                r"║ │  ┌┐ ┌┐ ┌┐ ┌┐  │ ║",
                r"║ │  └┘ └┘ └┘ └┘  │ ║",
                r"║ └───────────────┘ ║",
                r"╚═══════════════════╝"
            ],
            "remote_server": [
                r"╔═══════════════════╗",
                r"║  REMOTE{} ACCESS   ║",
                r"╠═══════════════════╣",
                r"║       ╱───╲       ║",
                r"║      │     │      ║",
                r"║     /│     │\     ║",
                r"║    / │     │ \    ║",
                r"║   │  │     │  │   ║",
                r"║   │  │     │  │   ║",
                r"║   \   ─────   /   ║",
                r"║    ╲_________╱    ║",
                r"╚═══════════════════╝"
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
        icon = "◆"  # Default icon
        
        if card_type.lower() == "program":
            type_color = Colors.BRIGHT_CYAN
            icon = "⟨⟩"
        elif card_type.lower() == "icebreaker":
            type_color = Colors.BRIGHT_BLUE
            icon = "⚒"
        elif card_type.lower() == "hardware":
            type_color = Colors.BRIGHT_YELLOW
            icon = "⚙"
        elif card_type.lower() == "resource":
            type_color = Colors.BRIGHT_GREEN
            icon = "$"
        elif card_type.lower() == "event":
            type_color = Colors.BRIGHT_MAGENTA
            icon = "⚡"
        elif card_type.lower() == "virus":
            type_color = Colors.BRIGHT_RED
            icon = "⌘"
        elif card_type.lower() == "ice":
            type_color = Colors.BRIGHT_RED
            icon = "■"
        elif card_type.lower() == "operation":
            type_color = Colors.BRIGHT_BLUE
            icon = "▶"
        elif card_type.lower() == "asset":
            type_color = Colors.BRIGHT_YELLOW
            icon = "♦" 
        elif card_type.lower() == "upgrade":
            type_color = Colors.BRIGHT_GREEN
            icon = "▲"
        elif card_type.lower() == "agenda":
            type_color = Colors.BRIGHT_MAGENTA
            icon = "★"
        
        # Format the card info
        if index is not None:
            return (
                f"[{index}] {type_color}{icon} {Colors.BOLD}{card.get('name', 'Unknown')}{Colors.RESET} - "
                f"{type_color}{card_type}{Colors.RESET} - "
                f"{card.get('cost', 0)}c {card.get('mu', 0)}mu"
            )
        else:
            return (
                f"{type_color}{icon} {Colors.BOLD}{card.get('name', 'Unknown')}{Colors.RESET} - "
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
        elif card_type.lower() == "virus":
            type_color = Colors.BRIGHT_RED
            box_color = Colors.BRIGHT_RED
        elif card_type.lower() == "icebreaker":
            type_color = Colors.BRIGHT_BLUE
            box_color = Colors.BRIGHT_BLUE
        elif card_type.lower() == "ice":
            type_color = Colors.BRIGHT_RED
            box_color = Colors.BRIGHT_RED
        elif card_type.lower() == "operation":
            type_color = Colors.BRIGHT_BLUE
            box_color = Colors.BRIGHT_BLUE
        elif card_type.lower() == "asset":
            type_color = Colors.BRIGHT_YELLOW
            box_color = Colors.BRIGHT_YELLOW
        elif card_type.lower() == "upgrade":
            type_color = Colors.BRIGHT_GREEN
            box_color = Colors.BRIGHT_GREEN
        elif card_type.lower() == "agenda":
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
        
        # Card ASCII art (if available)
        art_key = card_type.lower()
        if art_key in self.ascii_art:
            print(f"{box_color}├{'─' * (width - 2)}┤{Colors.RESET}")
            art_lines = self.ascii_art[art_key]
            for line in art_lines:
                line_padding = (width - 2 - len(line)) // 2
                print(f"{box_color}│{Colors.RESET}{' ' * line_padding}{type_color}{line}{Colors.RESET}{' ' * (width - 2 - len(line) - line_padding)}{box_color}│{Colors.RESET}")
        
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
        print(f"\n{Colors.BRIGHT_MAGENTA}INITIATING RUN ON {Colors.BOLD}{target_server}{Colors.RESET}{Colors.BRIGHT_MAGENTA}...{Colors.RESET}")
        
        # Show the run animation
        self.output_ascii_art("run")
        
        # Show server visualization based on target
        if target_server == "R&D":
            server_art = self.ascii_art["rd_server"]
            color = Colors.BRIGHT_CYAN
        elif target_server == "HQ": 
            server_art = self.ascii_art["hq_server"]
            color = Colors.BRIGHT_BLUE
        elif target_server == "ARCHIVES":
            server_art = self.ascii_art["archives_server"]
            color = Colors.BRIGHT_GREEN
        elif target_server.startswith("REMOTE"):
            # Get the remote server number
            try:
                server_num = target_server[6:]
                # Create a copy of the template and format with server number
                server_art = self.ascii_art["remote_server"].copy()
                server_art[1] = server_art[1].format(server_num)
                color = Colors.BRIGHT_YELLOW
            except:
                # Fallback
                server_art = None
                color = Colors.RESET
        else:
            server_art = None
            color = Colors.RESET
            
        # Print the server visualization
        if server_art:
            print()  # Add spacing
            for line in server_art:
                print(f"{color}{line}{Colors.RESET}")
        
        print()  # Add spacing after visualization
    
    def display_ice_encounter(self, ice_card):
        """Display a visual representation of encountering ICE"""
        print(f"\n{Colors.BRIGHT_RED}ICE ENCOUNTERED:{Colors.RESET}")
        self.display_mini_card(ice_card, f"{Colors.BRIGHT_RED}> You must deal with this ICE to continue{Colors.RESET}")
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

    # Add a new method for displaying a mini card representation during play
    def display_mini_card(self, card, action_text=None):
        """Display a compact visual representation of a card being played or encountered"""
        card_type = card.get('type', 'Unknown')
        name = card.get('name', 'Unknown')
        
        # Determine card color
        type_color = Colors.RESET
        if card_type.lower() == "program":
            type_color = Colors.BRIGHT_CYAN
        elif card_type.lower() == "hardware":
            type_color = Colors.BRIGHT_YELLOW
        elif card_type.lower() == "resource":
            type_color = Colors.BRIGHT_GREEN
        elif card_type.lower() == "event":
            type_color = Colors.BRIGHT_MAGENTA
        elif card_type.lower() == "virus":
            type_color = Colors.BRIGHT_RED
        elif card_type.lower() == "icebreaker":
            type_color = Colors.BRIGHT_BLUE
        elif card_type.lower() == "ice":
            type_color = Colors.BRIGHT_RED
        elif card_type.lower() == "operation":
            type_color = Colors.BRIGHT_BLUE
        elif card_type.lower() == "asset":
            type_color = Colors.BRIGHT_YELLOW
        elif card_type.lower() == "upgrade":
            type_color = Colors.BRIGHT_GREEN
        elif card_type.lower() == "agenda":
            type_color = Colors.BRIGHT_MAGENTA
            
        # Get card art if available
        art_key = card_type.lower()
        art_lines = []
        if art_key in self.ascii_art:
            art_lines = self.ascii_art[art_key]
        
        # Calculate card width based on name length (minimum 20)
        card_width = max(20, len(name) + 4)
        
        # Top of card
        print(f"{type_color}╔{'═' * card_width}╗{Colors.RESET}")
        
        # Card name
        print(f"{type_color}║{Colors.BOLD} {name}{' ' * (card_width - len(name) - 1)}{Colors.RESET}{type_color}║{Colors.RESET}")
        
        # Card type
        print(f"{type_color}║ {card_type}{' ' * (card_width - len(card_type) - 1)}║{Colors.RESET}")
        
        # Display mini ASCII art if available
        if art_lines:
            # Use up to 3 lines of art to keep it compact
            art_sample = art_lines[:min(3, len(art_lines))]
            for line in art_sample:
                padding = (card_width - len(line)) // 2
                print(f"{type_color}║{' ' * padding}{line}{' ' * (card_width - len(line) - padding)}║{Colors.RESET}")
        
        # Bottom of card
        print(f"{type_color}╚{'═' * card_width}╝{Colors.RESET}")
        
        # Display action text if provided
        if action_text:
            print(f"{Colors.BRIGHT_WHITE}{action_text}{Colors.RESET}")
            
    def display_run_progress(self, ice_encountered, current_ice_index, server_name):
        """Display a visual representation of the progress through a run"""
        total_ice = len(ice_encountered)
        if total_ice == 0:
            # No ICE on this server
            print(f"{Colors.BRIGHT_GREEN}No ICE protecting {server_name}. Direct access!{Colors.RESET}")
            return
            
        # Calculate progress
        passed_ice = current_ice_index
        remaining_ice = total_ice - passed_ice
        
        # Header
        print(f"\n{Colors.BRIGHT_BLUE}RUN PROGRESS: {Colors.RESET}{passed_ice}/{total_ice} ICE passed")
        
        # Create the progress visualization
        progress_width = min(60, self.terminal_width - 10)
        
        # Print the starting point (Runner)
        print(f"{Colors.BRIGHT_MAGENTA}[RUNNER]", end="")
        
        # Print passed ICE
        for i in range(passed_ice):
            ice_color = Colors.BRIGHT_GREEN
            print(f"{Colors.BRIGHT_BLACK}==={Colors.RESET}{ice_color}[X]{Colors.RESET}", end="")
            
        # Print current ICE (if any)
        if current_ice_index < total_ice:
            ice = ice_encountered[current_ice_index]
            ice_str = f"[!]"  # Default representation
            ice_color = Colors.BRIGHT_RED
            print(f"{Colors.BRIGHT_BLACK}==={Colors.RESET}{ice_color}{ice_str}{Colors.RESET}", end="")
            
            # Print remaining ICE
            for i in range(current_ice_index + 1, total_ice):
                print(f"{Colors.BRIGHT_BLACK}===[ ]{Colors.RESET}", end="")
        
        # Print the server
        print(f"{Colors.BRIGHT_BLACK}==={Colors.RESET}{Colors.BRIGHT_CYAN}[{server_name}]{Colors.RESET}")
        
        # Show legend
        print(f"\n{Colors.BRIGHT_GREEN}[X]{Colors.RESET} = Passed ICE   " +
              f"{Colors.BRIGHT_RED}[!]{Colors.RESET} = Current ICE   " +
              f"{Colors.BRIGHT_BLACK}[ ]{Colors.RESET} = Upcoming ICE\n")
            
