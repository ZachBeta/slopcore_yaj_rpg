#!/usr/bin/env python3
"""
Terminal Game - Core game logic for the terminal-based mode
"""

import random
from enum import Enum

class GamePhase(Enum):
    SETUP = 0
    START_TURN = 1
    ACTION = 2
    DISCARD = 3
    END_TURN = 4
    GAME_OVER = 5

class TerminalGame:
    def __init__(self, renderer, cards, random_seed=0):
        # Game dependencies
        self.renderer = renderer
        self.cards_data = cards
        self.random_seed = random_seed
        
        # Game state
        self.player_credits = 5
        self.memory_units_available = 4
        self.memory_units_used = 0
        self.player_side = "runner"  # or "corp"
        self.opponent_side = "corp"  # or "runner"
        
        # Game phases and turns
        self.current_phase = GamePhase.SETUP
        self.clicks_remaining = 0
        self.max_clicks = 4
        self.turn_number = 0
        self.active_player = None  # Will be set to player_side during init
        
        # Win conditions
        self.runner_agenda_points = 0
        self.corp_agenda_points = 0
        self.agenda_points_to_win = 7
        self.runner_cards_remaining = 0
        self.corp_cards_remaining = 0
        self.game_over = False
        self.win_message = ""
        
        # Card data
        self.player_deck = []
        self.hand_cards = []
        self.played_cards = []
        self.selected_card_index = -1
        
        # Command history
        self.command_history = []
        self.command_history_index = -1

        # Map of valid commands to their descriptions
        self.valid_commands = {
            "help": "Display available commands and usage information",
            "draw": "Draw a card from your deck",
            "hand": "List all cards in your hand",
            "install": "Install a program from your hand",
            "run": "Initiate a run on a corporate server",
            "end": "End your current turn",
            "info": "Display game state information",
            "discard": "Discard a card from your hand",
            "system": "Display system status",
            "installed": "List all installed programs",
            "credits": "Display credit account information",
            "memory": "Display memory allocation information",
            "man": "Display manual page for a command"
        }

        # Comprehensive command documentation (BSD-style)
        self.command_man_pages = {
            "help": {
                "NAME": "help - display help information about available commands",
                "SYNOPSIS": "help [command]",
                "DESCRIPTION": "Display a list of available commands or specific information about a command. " +
                              "When invoked without arguments, help displays a list of all available commands. " +
                              "When invoked with a command name as an argument, displays detailed help for that command.",
                "EXAMPLES": "help\nhelp install\nhelp run",
                "SEE ALSO": "man"
            },
            "man": {
                "NAME": "man - display manual page for commands",
                "SYNOPSIS": "man <command>",
                "DESCRIPTION": "Display the manual page for the specified command. " +
                              "Provides detailed information about command usage, options, and functionality.",
                "EXAMPLES": "man draw\nman install\nman run",
                "SEE ALSO": "help"
            },
            "draw": {
                "NAME": "draw - draw a card from your deck",
                "SYNOPSIS": "draw",
                "DESCRIPTION": "Retrieves one file from your data stack and adds it to your hand. " +
                              "This operation costs 1 click during the action phase.",
                "EXAMPLES": "draw",
                "SEE ALSO": "hand, discard"
            },
            "hand": {
                "NAME": "hand - list all cards in your hand",
                "SYNOPSIS": "hand",
                "DESCRIPTION": "Displays a list of all files currently in your hand. " +
                              "Each entry includes the card name, type, and relevant stats.",
                "EXAMPLES": "hand",
                "SEE ALSO": "draw, install, discard"
            },
            "install": {
                "NAME": "install - install a program from your hand",
                "SYNOPSIS": "install <card_number>",
                "DESCRIPTION": "Installs a program from your hand onto your rig. " +
                              "This operation costs 1 click plus the program's credit cost. " +
                              "Programs also consume memory units which are limited by your available MU.",
                "EXAMPLES": "install 2",
                "SEE ALSO": "hand, installed, memory"
            },
            "run": {
                "NAME": "run - initiate a run on a corporate server",
                "SYNOPSIS": "run <server>",
                "DESCRIPTION": "Initiates a run against a specified corporate server. " +
                              "This operation costs 1 click. During a run, you will " +
                              "encounter ICE that must be broken using installed programs.",
                "EXAMPLES": "run R&D\nrun HQ\nrun Archives",
                "SEE ALSO": "installed"
            },
            "end": {
                "NAME": "end - end your current turn",
                "SYNOPSIS": "end",
                "DESCRIPTION": "Ends your current turn and passes to the next player. " +
                              "You must discard down to your maximum hand size (5) before ending your turn.",
                "EXAMPLES": "end",
                "SEE ALSO": "discard"
            },
            "info": {
                "NAME": "info - display game state information",
                "SYNOPSIS": "info",
                "DESCRIPTION": "Displays information about the current game state, " +
                              "including turn number, phase, active player, and score.",
                "EXAMPLES": "info",
                "SEE ALSO": "system, credits, memory"
            },
            "discard": {
                "NAME": "discard - discard a card from your hand",
                "SYNOPSIS": "discard <card_number>",
                "DESCRIPTION": "Discards a specified card from your hand. " +
                              "During the action phase, this operation costs 1 click. " +
                              "During the discard phase (end of turn), this operation is free.",
                "EXAMPLES": "discard 3",
                "SEE ALSO": "hand, draw"
            },
            "system": {
                "NAME": "system - display system status",
                "SYNOPSIS": "system",
                "DESCRIPTION": "Displays information about your system status, " +
                              "including neural interface integrity, trace detection, " +
                              "and connection encryption status.",
                "EXAMPLES": "system",
                "SEE ALSO": "info, memory, credits"
            },
            "installed": {
                "NAME": "installed - list all installed programs",
                "SYNOPSIS": "installed",
                "DESCRIPTION": "Displays a list of all programs currently installed on your rig. " +
                              "Each entry includes the program name, type, and relevant stats.",
                "EXAMPLES": "installed",
                "SEE ALSO": "install, memory"
            },
            "credits": {
                "NAME": "credits - display credit account information",
                "SYNOPSIS": "credits",
                "DESCRIPTION": "Displays information about your current credit balance, " +
                              "income rate, and available credit-related actions.",
                "EXAMPLES": "credits",
                "SEE ALSO": "info, memory"
            },
            "memory": {
                "NAME": "memory - display memory allocation information",
                "SYNOPSIS": "memory",
                "DESCRIPTION": "Displays information about your current memory usage, " +
                              "including total available memory units (MU), used MU, " +
                              "and a breakdown of memory usage by installed program.",
                "EXAMPLES": "memory",
                "SEE ALSO": "installed, info, system"
            }
        }

    def initialize(self):
        """Initialize the game state and display welcome message"""
        # Set the random seed for consistent behavior
        random.seed(self.random_seed)
        
        # Set up the initial deck, shuffle, and draw starting hand
        self._initialize_deck()
        self._draw_starting_hand()
        
        # Set initial game phase and active player
        self.current_phase = GamePhase.SETUP
        self.active_player = self.player_side
        
        # Display welcome message and help
        self._display_welcome()
        self.process_command("help")
        
        # Start the game
        self.start_turn()

    def _initialize_deck(self):
        """Initialize the player deck with cards"""
        # In a real implementation, we would load card data from a file
        # For now, we'll create some sample cards
        self.player_deck = self.cards_data.copy()
        random.shuffle(self.player_deck)
        self.runner_cards_remaining = len(self.player_deck)

    def _draw_starting_hand(self):
        """Draw the initial hand of cards"""
        starting_hand_size = 5
        for _ in range(starting_hand_size):
            if self.player_deck:
                self.hand_cards.append(self.player_deck.pop(0))
                self.runner_cards_remaining -= 1

    def _display_welcome(self):
        """Display the welcome message"""
        welcome_text = [
            "================================",
            "    NEON DOMINANCE TERMINAL",
            "================================",
            "Neural Interface Active...",
            "Establishing secure connection...",
            "Connection established.",
            "Welcome, runner. Jack in to begin.",
            "================================",
            ""
        ]
        self.renderer.output("\n".join(welcome_text))

    def process_command(self, command_text):
        """Process a command from the user"""
        # Add to command history
        self.command_history.append(command_text)
        self.command_history_index = len(self.command_history)
        
        # Split command into parts
        parts = command_text.strip().split()
        if not parts:
            return
            
        # Extract command and arguments
        cmd = parts[0].lower()
        args = parts[1:] if len(parts) > 1 else []
        
        # Check if command is valid
        if cmd in self.valid_commands:
            # Call the corresponding command method
            method_name = f"_cmd_{cmd}"
            if hasattr(self, method_name):
                getattr(self, method_name)(args)
            else:
                self.renderer.output_error(f"Command '{cmd}' is recognized but not implemented yet.")
        else:
            self.renderer.output_error(f"Unknown command: '{cmd}'. Type 'help' for a list of commands.")

    def start_turn(self):
        """Start a new turn"""
        self.turn_number += 1
        self.current_phase = GamePhase.START_TURN
        
        # Reset clicks
        self.clicks_remaining = self.max_clicks
        
        # Update status
        self._update_status()
        
        # Output turn start message
        self.renderer.output(f"\nTurn {self.turn_number} - {self.active_player.capitalize()}'s turn")
        self.renderer.output(f"You have {self.clicks_remaining} clicks available.")
        
        # Move to action phase
        self.current_phase = GamePhase.ACTION

    def _update_status(self):
        """Update the status bar with current game information"""
        status = (
            f"Turn: {self.turn_number} | "
            f"Phase: {self._get_phase_name(self.current_phase)} | "
            f"Player: {self.active_player} | "
            f"Credits: {self.player_credits} | "
            f"Clicks: {self.clicks_remaining}/{self.max_clicks} | "
            f"MU: {self.memory_units_used}/{self.memory_units_available}"
        )
        self.renderer.update_status(status)

    def _get_phase_name(self, phase):
        """Convert phase enum to readable name"""
        return phase.name.replace('_', ' ').title()

    # Command implementations
    def _cmd_help(self, args):
        """Implement the help command"""
        if args:
            # Show help for specific command
            cmd = args[0].lower()
            if cmd in self.valid_commands:
                self.renderer.output(f"\n{cmd.upper()} - {self.valid_commands[cmd]}")
                if cmd in self.command_man_pages:
                    self.renderer.output(f"Usage: {self.command_man_pages[cmd]['SYNOPSIS']}")
                    self.renderer.output(f"For more details, try: man {cmd}")
            else:
                self.renderer.output_error(f"No help available for '{cmd}'. Type 'help' for a list of commands.")
        else:
            # Show general help
            self.renderer.output("\nTERMINAL COMMANDS:")
            self.renderer.output("=================")
            for cmd, desc in self.valid_commands.items():
                self.renderer.output(f"{cmd.ljust(10)} - {desc}")
            self.renderer.output("\nFor detailed information on a command, type 'help <command>' or 'man <command>'.")

    def _cmd_man(self, args):
        """Implement the man command"""
        if not args:
            self.renderer.output_error("'man' requires a command name")
            self.renderer.output("Usage: man <command>")
            return
            
        cmd = args[0].lower()
        if cmd in self.command_man_pages:
            man_page = self.command_man_pages[cmd]
            self.renderer.output(f"\nMANUAL: {cmd}")
            self.renderer.output("=" * (8 + len(cmd)))
            for section, content in man_page.items():
                self.renderer.output(f"\n{section}")
                self.renderer.output(f"    {content}")
        else:
            self.renderer.output_error(f"No manual entry for '{cmd}'")

    def _cmd_draw(self, args):
        """Implement the draw command"""
        if self.current_phase != GamePhase.ACTION:
            self.renderer.output_error("Can only draw during action phase")
            return
            
        if self.clicks_remaining < 1:
            self.renderer.output_error("Not enough clicks remaining")
            return
            
        if not self.player_deck:
            self.renderer.output_error("Your deck is empty")
            return
            
        # Draw a card
        drawn_card = self.player_deck.pop(0)
        self.hand_cards.append(drawn_card)
        self.runner_cards_remaining -= 1
        self.clicks_remaining -= 1
        
        # Show the drawn card
        self.renderer.output(f"Drew: {drawn_card['name']} - {drawn_card['type']}")
        
        # Update status
        self._update_status()

    def _cmd_hand(self, args):
        """Implement the hand command"""
        if not self.hand_cards:
            self.renderer.output("Your hand is empty.")
            return
            
        self.renderer.output("\nHAND CARDS:")
        self.renderer.output("===========")
        for i, card in enumerate(self.hand_cards):
            self.renderer.output(f"[{i+1}] {card['name']} - {card['type']} - {card.get('cost', 0)}c {card.get('mu', 0)}mu")

    def _cmd_install(self, args):
        """Implement the install command"""
        if self.current_phase != GamePhase.ACTION:
            self.renderer.output_error("Can only install during action phase")
            return
            
        if self.clicks_remaining < 1:
            self.renderer.output_error("Not enough clicks remaining")
            return
            
        if not args:
            self.renderer.output_error("Must specify a card number to install")
            self.renderer.output("Usage: install <card_number>")
            return
            
        try:
            card_index = int(args[0]) - 1  # Convert to 0-based index
            if card_index < 0 or card_index >= len(self.hand_cards):
                self.renderer.output_error(f"Invalid card number: {args[0]}")
                return
                
            card = self.hand_cards[card_index]
            
            # Check if we have enough credits
            if self.player_credits < card.get('cost', 0):
                self.renderer.output_error(f"Not enough credits to install {card['name']}")
                return
                
            # Check if we have enough memory
            if self.memory_units_available - self.memory_units_used < card.get('mu', 0):
                self.renderer.output_error(f"Not enough memory units to install {card['name']}")
                return
                
            # Install the card
            self.played_cards.append(card)
            self.hand_cards.pop(card_index)
            self.player_credits -= card.get('cost', 0)
            self.memory_units_used += card.get('mu', 0)
            self.clicks_remaining -= 1
            
            self.renderer.output(f"Installed {card['name']}")
            
            # Update status
            self._update_status()
                
        except ValueError:
            self.renderer.output_error(f"Invalid card number: {args[0]}")

    def _cmd_installed(self, args):
        """Implement the installed command"""
        if not self.played_cards:
            self.renderer.output("No programs installed.")
            return
            
        self.renderer.output("\nINSTALLED PROGRAMS:")
        self.renderer.output("==================")
        for i, card in enumerate(self.played_cards):
            self.renderer.output(f"[{i+1}] {card['name']} - {card['type']} - {card.get('mu', 0)}mu")

    def _cmd_memory(self, args):
        """Implement the memory command"""
        self.renderer.output("\nMEMORY STATUS:")
        self.renderer.output("=============")
        self.renderer.output(f"Total Memory Units: {self.memory_units_available}")
        self.renderer.output(f"Used Memory Units:  {self.memory_units_used}")
        self.renderer.output(f"Free Memory Units:  {self.memory_units_available - self.memory_units_used}")
        
        if self.played_cards:
            self.renderer.output("\nMemory Usage by Program:")
            for card in self.played_cards:
                if card.get('mu', 0) > 0:
                    self.renderer.output(f"  {card['name']}: {card.get('mu', 0)}mu")

    def _cmd_credits(self, args):
        """Implement the credits command"""
        self.renderer.output("\nCREDIT ACCOUNT:")
        self.renderer.output("==============")
        self.renderer.output(f"Available Credits: {self.player_credits}")
        
        # Show credit costs for cards in hand
        if self.hand_cards:
            self.renderer.output("\nInstallation Costs:")
            for i, card in enumerate(self.hand_cards):
                if 'cost' in card:
                    self.renderer.output(f"  [{i+1}] {card['name']}: {card['cost']}c")

    def _cmd_run(self, args):
        """Implement the run command"""
        if self.current_phase != GamePhase.ACTION:
            self.renderer.output_error("Can only run during action phase")
            return
            
        if self.clicks_remaining < 1:
            self.renderer.output_error("Not enough clicks remaining")
            return
            
        if not args:
            self.renderer.output_error("Must specify a server to run")
            self.renderer.output("Usage: run <server>")
            self.renderer.output("Valid servers: R&D, HQ, Archives")
            return
            
        server = args[0]
        if server.upper() in ["R&D", "HQ", "ARCHIVES"]:
            self.renderer.output(f"\nInitiating run on {server}...")
            self.renderer.output("Accessing server...")
            self.renderer.output("No ICE encountered.")
            self.renderer.output("Run successful!")
            
            # Simulate accessing cards
            if random.random() < 0.3:  # 30% chance of success
                self.renderer.output("You found a valuable file!")
                self.runner_agenda_points += 1
                self.renderer.output(f"Runner agenda points: {self.runner_agenda_points}/{self.agenda_points_to_win}")
                
                # Check for win condition
                if self.runner_agenda_points >= self.agenda_points_to_win:
                    self.game_over = True
                    self.win_message = "Runner wins by collecting agenda points!"
                    self.renderer.output("\n" + "=" * 50)
                    self.renderer.output(self.win_message)
                    self.renderer.output("=" * 50)
            else:
                self.renderer.output("No valuable data found.")
            
            self.clicks_remaining -= 1
            self._update_status()
        else:
            self.renderer.output_error(f"Invalid server: {server}")
            self.renderer.output("Valid servers: R&D, HQ, Archives")

    def _cmd_system(self, args):
        """Implement the system command"""
        self.renderer.output("\nSYSTEM STATUS:")
        self.renderer.output("=============")
        self.renderer.output("Neural Interface: Online")
        self.renderer.output("Connection Status: Secure")
        self.renderer.output("Trace Detection: None")
        self.renderer.output("System Integrity: 100%")
        
        # Add some randomized "hacker flavor" stats
        firewall_status = random.choice(["Active", "Standby", "Enhanced", "Minimal"])
        encryption_level = random.choice(["Standard", "Military-grade", "Quantum", "Polymorphic"])
        self.renderer.output(f"Firewall Status: {firewall_status}")
        self.renderer.output(f"Encryption Level: {encryption_level}")

    def _cmd_info(self, args):
        """Implement the info command"""
        self.renderer.output("\nGAME INFORMATION:")
        self.renderer.output("================")
        self.renderer.output(f"Turn Number: {self.turn_number}")
        self.renderer.output(f"Active Player: {self.active_player.capitalize()}")
        self.renderer.output(f"Current Phase: {self._get_phase_name(self.current_phase)}")
        self.renderer.output(f"Runner Agenda Points: {self.runner_agenda_points}/{self.agenda_points_to_win}")
        self.renderer.output(f"Corp Agenda Points: {self.corp_agenda_points}/{self.agenda_points_to_win}")
        self.renderer.output(f"Cards in Runner's Deck: {self.runner_cards_remaining}")

    def _cmd_discard(self, args):
        """Implement the discard command"""
        if not self.hand_cards:
            self.renderer.output_error("No cards in hand to discard")
            return
            
        if not args:
            self.renderer.output_error("Must specify a card number to discard")
            self.renderer.output("Usage: discard <card_number>")
            return
            
        try:
            card_index = int(args[0]) - 1  # Convert to 0-based index
            if card_index < 0 or card_index >= len(self.hand_cards):
                self.renderer.output_error(f"Invalid card number: {args[0]}")
                return
                
            # Discard the card
            card = self.hand_cards.pop(card_index)
            
            # Only spend a click if it's the action phase
            if self.current_phase == GamePhase.ACTION:
                if self.clicks_remaining < 1:
                    self.renderer.output_error("Not enough clicks remaining")
                    # Put the card back
                    self.hand_cards.insert(card_index, card)
                    return
                self.clicks_remaining -= 1
                
            self.renderer.output(f"Discarded: {card['name']}")
            self._update_status()
                
        except ValueError:
            self.renderer.output_error(f"Invalid card number: {args[0]}")

    def _cmd_end(self, args):
        """Implement the end command"""
        if self.current_phase != GamePhase.ACTION and self.current_phase != GamePhase.DISCARD:
            self.renderer.output_error("Can only end turn during action or discard phase")
            return
            
        # Check if player needs to discard
        max_hand_size = 5
        if len(self.hand_cards) > max_hand_size:
            self.current_phase = GamePhase.DISCARD
            self.renderer.output(f"You must discard down to {max_hand_size} cards before ending your turn.")
            self.renderer.output(f"You have {len(self.hand_cards)} cards and need to discard {len(self.hand_cards) - max_hand_size}.")
            self.renderer.output("Use the 'discard <card_number>' command.")
            return
            
        # End the turn
        self.current_phase = GamePhase.END_TURN
        self.renderer.output("Turn ended.")
        
        # Corp's turn simulation
        if self.active_player == self.player_side:
            self.renderer.output("\nCorporation's turn...")
            self.renderer.output("Corporation is taking actions...")
            
            # Simulate corp drawing and playing cards
            corp_actions = random.randint(3, 5)
            for _ in range(corp_actions):
                action = random.choice(["draw", "install", "advance", "play operation"])
                self.renderer.output(f"Corporation performs action: {action}")
                
            # Simulate the corp potentially scoring an agenda
            if random.random() < 0.2:  # 20% chance
                self.corp_agenda_points += 1
                self.renderer.output(f"Corporation scores an agenda! Corp points: {self.corp_agenda_points}/{self.agenda_points_to_win}")
                
                # Check for corp win
                if self.corp_agenda_points >= self.agenda_points_to_win:
                    self.game_over = True
                    self.win_message = "Corporation wins by advancing agendas!"
                    self.renderer.output("\n" + "=" * 50)
                    self.renderer.output(self.win_message)
                    self.renderer.output("=" * 50)
            
            self.renderer.output("Corporation ends turn.")
            
            # Back to runner's turn
            self.active_player = self.player_side
            self.start_turn()
        else:
            # If it's already the runner's turn after corp, start a new turn
            self.active_player = self.player_side
            self.start_turn()
