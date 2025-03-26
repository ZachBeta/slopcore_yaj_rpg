#!/usr/bin/env python3
"""
Terminal Game - Core game logic for the terminal-based mode
"""

import random
from enum import Enum
from ai_opponent import AIOpponent
from game_renderer import Colors

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
        self.corp_cards_remaining = 30  # Initialize to a reasonable number of cards
        self.game_over = False
        self.win_message = ""
        
        # Card data
        self.player_deck = []
        self.hand_cards = []
        self.played_cards = []
        self.selected_card_index = -1
        
        # Special gameplay flags
        self.bypass_next_ice = 0
        self.next_run_untraceable = False
        self.current_run = None  # Track the current run state
        
        # Command history
        self.command_history = []
        self.command_history_index = -1

        # AI opponent
        self.ai_opponent = None

        # Map of valid commands to their descriptions
        self.valid_commands = {
            "help": "Display available commands and usage information",
            "draw": "Draw a card from your deck",
            "hand": "List all cards in your hand",
            "install": "Install a program from your hand",
            "run": "Initiate a run on a corporate server",
            "jack_out": "Attempt to abort the current run",
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
                "SYNOPSIS": "run <server> [--stealth|--aggressive|--careful]",
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
            },
            "jack_out": {
                "NAME": "jack_out - attempt to abort the current run",
                "SYNOPSIS": "jack_out",
                "DESCRIPTION": "Attempts to safely disconnect from the current run. " +
                              "Success chance depends on ICE type and installed programs. " +
                              "Failing to jack out may result in taking damage or other consequences.",
                "EXAMPLES": "jack_out",
                "SEE ALSO": "run"
            },
        }

    def initialize(self):
        """Initialize the game state and display welcome message"""
        # Set the random seed for consistent behavior
        random.seed(self.random_seed)
        
        # Initialize AI opponent with the same seed
        self.ai_opponent = AIOpponent(self.random_seed)
        
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
        # Make sure cards are initialized
        if not hasattr(self, 'cards_data'):
            self._initialize_cards()
            
        # Use the cards defined in _initialize_cards
        self.player_deck = self.cards_data.copy()
        
        # Shuffle the deck
        random.seed(self.random_seed)
        random.shuffle(self.player_deck)
        
        # Set number of cards for status tracking
        self.runner_cards_remaining = len(self.player_deck)

    def _draw_starting_hand(self):
        """Draw the initial hand of cards"""
        starting_hand_size = 5
        for _ in range(starting_hand_size):
            if self.player_deck:
                self.hand_cards.append(self.player_deck.pop(0))
                self.runner_cards_remaining -= 1

    def _display_welcome(self):
        """Display the welcome message for the terminal game"""
        self.renderer.display_welcome()
        self.renderer.display_command_help(self.valid_commands)

    def _process_card_ability(self, card, trigger=None, context=None):
        """
        Process a card's ability based on its type and the current trigger
        
        Args:
            card: The card whose ability should be processed
            trigger: The event that triggered this ability check (e.g. 'turn_start', 'successful_run')
            context: Additional context for the ability (e.g. targeted server)
            
        Returns:
            str: A message describing what happened, or None if no ability was triggered
        """
        # Skip if card has no ability
        if 'ability' not in card:
            # For our terminal implementation, we'll handle some special cases even without formal ability definitions
            
            # Check for cards that might give credits on successful runs
            if trigger == 'successful_run' and card.get('type', '').lower() == 'resource':
                if 'data mining' in card.get('name', '').lower():
                    self.player_credits += 1
                    return f"Gained 1 credit from {card['name']}"
                    
            # No other special cases to handle
            return None
            
        ability = card['ability']
        ability_type = ability.get('type')
        
        # Break ice ability specific handling
        if ability_type == 'break_ice' and trigger == 'encounter_ice':
            if not context or 'ice' not in context:
                return None
                
            ice = context['ice']
            ice_types = ability.get('ice_types', [])
            max_strength = ability.get('max_strength', 0)
            strength_bonus = context.get('strength_bonus', 0)
            
            # Check if this breaker can handle the encountered ICE
            ice_subtype = ice.get('subtype', '').lower()
            ice_strength = ice.get('strength', 0)
            
            can_break = ('all' in [t.lower() for t in ice_types] or 
                        ice_subtype in [t.lower() for t in ice_types])
                        
            effective_strength = max_strength + strength_bonus
            
            if can_break and effective_strength >= ice_strength:
                return f"Used {card['name']} to successfully break {ice['name']} subroutines"
            else:
                if not can_break:
                    return f"{card['name']} can't break {ice_subtype} ICE"
                else:
                    return f"{card['name']} strength ({effective_strength}) is not enough for {ice['name']} ({ice_strength})"
            
        # Handle permanent abilities
        elif ability_type == 'permanent':
            # These are handled at installation time and don't need trigger checks
            if trigger == 'install':
                effects = ability.get('effects', [])
                if not effects:  # Single effect
                    effect = ability.get('effect')
                    value = ability.get('value', 0)
                    if effect == 'increase_memory':
                        self.memory_units_available += value
                        return f"Memory capacity increased by {value} units"
                    elif effect == 'increase_hand_size':
                        # Implement hand size increase
                        return f"Hand size increased by {value}"
                else:  # Multiple effects
                    messages = []
                    for effect_data in effects:
                        effect = effect_data.get('effect')
                        value = effect_data.get('value', 0)
                        if effect == 'increase_memory':
                            self.memory_units_available += value
                            messages.append(f"Memory capacity increased by {value} units")
                        elif effect == 'increase_hand_size':
                            # Implement hand size increase
                            messages.append(f"Hand size increased by {value}")
                    return "; ".join(messages) if messages else None
                    
        # Handle triggered abilities
        elif ability_type == 'trigger':
            ability_trigger = ability.get('trigger')
            
            # Only process if the trigger matches
            if ability_trigger != trigger:
                return None
                
            effect = ability.get('effect')
            value = ability.get('value', 0)
            
            # Handle different effect types
            if effect == 'gain_credits':
                self.player_credits += value
                return f"Gained {value} credits from {card['name']}"
            elif effect == 'draw_cards':
                # Not implementing card drawing in this demo terminal version
                return f"Drew {value} cards from {card['name']}"
                
        # Handle resource usage (like spending counters)
        elif ability_type == 'resource' and trigger == 'use':
            usage_type = ability.get('usage')
            if not context or 'action' not in context:
                return None
                
            if usage_type == context['action'] and card.get('counters', 0) > 0:
                card['counters'] = card.get('counters', 0) - 1
                return f"Used {card['name']} to assist with {context['action']}"
        
        return None

    def process_command(self, command_text):
        """Process a command from the terminal"""
        # Add to command history
        self.command_history.append(command_text)
        self.command_history_index = -1
        
        # Check if game is over
        if self.game_over:
            self.renderer.output("Game is over. Type 'exit' to quit.")
            return
            
        # Parse the command
        parts = command_text.strip().split()
        if not parts:
            return
            
        cmd = parts[0].lower()
        args = parts[1:]
        
        # Check if command is valid
        if cmd not in self.valid_commands:
            self.renderer.output_error(f"Unknown command: {cmd}")
            self.renderer.output("Type 'help' for a list of commands")
            return
            
        # Execute the command
        command_method = getattr(self, f"_cmd_{cmd}")
        command_method(args)
        
        # Check win conditions after command
        self._check_win_conditions()
        
        # If game is over, display the game over message
        if self.game_over:
            self._display_game_over()

    def _check_win_conditions(self):
        """Check if any win conditions have been met"""
        # Runner agenda points win
        if self.runner_agenda_points >= self.agenda_points_to_win:
            self.game_over = True
            self.win_message = f"Runner wins by collecting {self.agenda_points_to_win} agenda points!"
            return True
            
        # Corp agenda points win
        if self.corp_agenda_points >= self.agenda_points_to_win:
            self.game_over = True
            self.win_message = f"Corporation wins by scoring {self.agenda_points_to_win} agenda points!"
            return True
            
        # Runner deck empty
        if self.runner_cards_remaining <= 0 and len(self.player_deck) == 0:
            self.game_over = True
            self.win_message = "Corporation wins! Runner's deck is empty."
            return True
            
        # Corp deck empty
        if self.corp_cards_remaining <= 0:
            self.game_over = True
            self.win_message = "Runner wins! Corporation's R&D is empty."
            return True
            
        return False
        
    def _display_game_over(self):
        """Display the game over screen"""
        winner = "runner" if "Runner wins" in self.win_message else "corp"
        self.renderer.display_game_over(winner, self.win_message)
        self.current_phase = GamePhase.GAME_OVER

    def start_turn(self):
        """Start a new turn for the current player"""
        self.turn_number += 1
        self.current_phase = GamePhase.START_TURN
        
        if self.active_player == "runner":
            self.clicks_remaining = self.max_clicks
            
            # Display turn start banner
            self.renderer.display_turn_start(self.turn_number, "runner")
            self.renderer.output(f"You have {self.clicks_remaining} clicks available.")
            
            # Process turn start abilities
            turn_start_effects = []
            for card in self.played_cards:
                # Reset per-turn flags
                if 'ability' in card and card['ability'].get('type') == 'trigger' and card['ability'].get('frequency') == 'per_turn':
                    card['used_this_turn'] = False
                
                # Trigger "turn_start" abilities
                result = self._process_card_ability(card, trigger='turn_start')
                if result:
                    turn_start_effects.append(result)
            
            # Display any triggered abilities
            if turn_start_effects:
                self.renderer.output("\nTurn start effects:")
                for effect in turn_start_effects:
                    self.renderer.output_success(f"• {effect}")
                print()
                
            self._update_status()
            self.current_phase = GamePhase.ACTION
        else:
            # Corporation's turn
            self._process_ai_turn()
            
            # After Corp turn, immediately start Runner's turn
            self.active_player = "runner"
            self.start_turn()

    def _process_ai_turn(self):
        """Process the AI opponent's turn"""
        # Display a more visually distinct Corporation turn banner
        self.renderer.output_ascii_art("corp")
        self.renderer.output(f"\n{Colors.BRIGHT_RED}CORPORATION PHASE{Colors.RESET}")
        self.renderer.output(f"{Colors.BRIGHT_RED}{'=' * 50}{Colors.RESET}")
        
        # Let the AI opponent start its turn
        start_message = self.ai_opponent.start_turn()
        self.renderer.output(f"{Colors.BRIGHT_RED}{start_message}{Colors.RESET}")
        
        # Let AI take actions and get a log of what it did
        game_state = self._get_game_state_for_ai()
        action_log = self.ai_opponent.take_turn(game_state)
        
        # Display AI actions with visual distinction
        for action in action_log:
            self.renderer.output(f"{Colors.BRIGHT_RED}> {action}{Colors.RESET}")
        
        self.renderer.output(f"{Colors.BRIGHT_RED}{'=' * 50}{Colors.RESET}")
        self.renderer.output(f"{Colors.BRIGHT_RED}CORPORATION PHASE COMPLETE{Colors.RESET}\n")
        
        # Update corp agenda points
        self.corp_agenda_points = self.ai_opponent.get_agenda_points()
        
        # Check for corp win
        if self.corp_agenda_points >= self.agenda_points_to_win:
            self.game_over = True
            self.win_message = "Corporation wins by advancing agendas!"
            self._display_game_over()
            return
            
        # Back to runner's turn
        self.active_player = self.player_side

    def _get_game_state_for_ai(self):
        """Prepare a game state object to pass to the AI"""
        return {
            "turn_number": self.turn_number,
            "runner_agenda_points": self.runner_agenda_points,
            "runner_credits": self.player_credits,
            "runner_programs": len(self.played_cards),
            "runner_cards": len(self.hand_cards),
        }

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
        if not args:
            self.renderer.output_error("What do you want to install?")
            self.renderer.output("Usage: install <card_number>")
            return
            
        # Validate we're in the correct phase
        if self.current_phase != GamePhase.ACTION:
            self.renderer.output_error("Can only install during action phase")
            return
            
        # Check if player has any clicks remaining
        if self.clicks_remaining <= 0:
            self.renderer.output_error("You don't have any clicks remaining.")
            return
            
        try:
            # Get the card index
            card_index = int(args[0]) - 1
            if card_index < 0 or card_index >= len(self.hand_cards):
                raise ValueError("Invalid card index")
                
            # Reference the card
            card = self.hand_cards[card_index]
            
            # Check if player has enough credits
            cost = card.get('cost', 0)
            if self.player_credits < cost:
                self.renderer.output_error(f"Not enough credits to install {card['name']}. Costs {cost} credits, you have {self.player_credits}.")
                return
                
            # Check if player has enough memory
            memory_required = card.get('mu', 0)
            memory_available = self.memory_units_available - self.memory_units_used
            if memory_required > memory_available:
                self.renderer.output_error(f"Not enough memory to install {card['name']}. Requires {memory_required} MU, you have {memory_available} available.")
                return
                
            # Pay the cost
            self.player_credits -= cost
            
            # Consume memory if it's a program
            if card.get('type', '').lower() in ['program', 'icebreaker', 'virus']:
                self.memory_units_used += card.get('mu', 0)
                
            # Remove from hand and add to played cards
            self.hand_cards.remove(card)
            self.played_cards.append(card)
            
            # Display mini card visualization
            self.renderer.display_mini_card(card, f"Installing {card['name']} for {cost} credits")
            
            # Process card abilities on installation
            ability_result = self._process_card_ability(card, trigger='install')
            if ability_result:
                self.renderer.output_success(ability_result)
                
            # Use up a click
            self.clicks_remaining -= 1
            
            # Update status display
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
        """Run a server and face ICE"""
        if not args:
            self.renderer.output_error("Which server do you want to run?")
            self.renderer.output("Usage: run <server> [--stealth|--aggressive|--careful]")
            return

        # Check if player has any clicks remaining
        if self.clicks_remaining <= 0:
            self.renderer.output_error("You don't have any clicks remaining.")
            return

        # Parse approach option
        approach = "standard"
        target_server = args[0].upper()
        
        if len(args) > 1:
            if args[1] == "--stealth":
                approach = "stealth"
            elif args[1] == "--aggressive":
                approach = "aggressive"
            elif args[1] == "--careful":
                approach = "careful"
        
        # Handle server validation
        valid_servers = ["R&D", "HQ", "ARCHIVES"]
        
        # Handle remote servers
        if target_server.startswith("REMOTE"):
            try:
                remote_num = int(target_server[6:])
                # Check if this remote server exists
                if remote_num < 1 or remote_num > 3:  # Limit for simplicity in terminal mode
                    self.renderer.output_error(f"Remote server {remote_num} doesn't exist.")
                    return
                target_server = f"REMOTE{remote_num}"
            except ValueError:
                self.renderer.output_error("Invalid remote server. Use format 'Remote1', 'Remote2', etc.")
                return
        elif target_server not in valid_servers:
            self.renderer.output_error(f"Invalid server. Valid targets: {', '.join(valid_servers)}, Remote1, Remote2, Remote3")
            return
        
        # Apply approach-specific effects
        approach_message = ""
        if approach == "stealth":
            self.player_credits -= 1
            approach_message = "You take a stealthy approach, spending 1 credit on masking your signal."
            # 50% chance to bypass first ICE
            self.bypass_next_ice += random.randint(0, 1)
        elif approach == "aggressive":
            approach_message = "You take an aggressive approach, focusing on power over subtlety."
            # Will be handled during ICE encounters
        elif approach == "careful":
            approach_message = "You take a careful approach, focusing on safety."
            # Will make jack_out easier
            
        # Show visual running animation
        self.renderer.display_running_animation(target_server)
        if approach_message:
            self.renderer.output(approach_message)
        
        # Use up a click
        self.clicks_remaining -= 1
        
        # Initialize the run state
        self.current_run = {
            'server': target_server,
            'approach': approach,
            'state': 'initiated',
            'ice_index': 0,
            'current_ice': None,
            'ice_encountered': []
        }
        
        # Determine if there's ICE to encounter
        ice_encountered = self._generate_ice_for_server(target_server)
        self.current_run['ice_encountered'] = ice_encountered
        
        # Flag for tracking run success
        run_successful = True
        
        # If there's ICE, handle the encounter
        if ice_encountered:
            # Process each ICE in sequence
            self.current_run['state'] = 'approaching_ice'
            self._process_next_ice()
        else:
            self.renderer.output("No ICE encountered.")
            self._complete_run(True)
        
        # Update status display
        self._update_status()
        
    def _process_next_ice(self):
        """Process the next ICE in the run sequence"""
        if self.current_run is None or self.current_run['state'] not in ['approaching_ice', 'encountering_ice']:
            return
            
        # Get current ICE index
        ice_index = self.current_run.get('ice_index', 0)
        ice_list = self.current_run.get('ice_encountered', [])
        server_name = self.current_run.get('server', "Unknown")
        
        # Show run progress
        self.renderer.display_run_progress(ice_list, ice_index, server_name)
        
        # If we've gone through all ICE, access the server
        if ice_index >= len(ice_list):
            self._complete_run(True)
            return
            
        # Get the current ICE
        ice = ice_list[ice_index]
        self.current_run['current_ice'] = ice
        
        # Check if we should bypass this ICE (e.g., stealth approach effect)
        if self.bypass_next_ice > 0:
            self.bypass_next_ice -= 1
            self.renderer.output_success(f"Your stealth approach allows you to bypass the {ice['name']}!")
            
            # Move to the next ICE
            self.current_run['ice_index'] += 1
            self._process_next_ice()
            return
            
        # Display the ICE encounter
        self.renderer.display_ice_encounter(ice)
        
        # Change run state
        self.current_run['state'] = 'encountering_ice'
        
        # Check if player has appropriate icebreaker
        breakers = self._get_installed_breakers()
        can_break = False
        
        for breaker in breakers:
            if 'ability' in breaker and breaker['ability'].get('type') == 'break_ice':
                ice_types = breaker['ability'].get('ice_types', [])
                max_strength = breaker['ability'].get('max_strength', 0)
                
                # Check if the breaker can handle this ICE
                if (ice.get('subtype', '').lower() in [t.lower() for t in ice_types] or 'all' in [t.lower() for t in ice_types]) and max_strength >= ice.get('strength', 0):
                    can_break = True
                    
                    # Show that the breaker can handle this ICE
                    self.renderer.output_success(f"Your {breaker['name']} can break this ICE.")
                    self.renderer.display_mini_card(breaker, f"This icebreaker can handle {ice['name']}")
                    break
        
        if not can_break:
            # Player doesn't have appropriate breaker
            # In a real game, this would be where subroutines fire
            # For the terminal version, just damage the player and continue
            damage = ice.get('strength', 1)
            self.renderer.output_error(f"No appropriate icebreaker found! {ice['name']} deals {damage} damage.")
            
            # Apply damage based on approach
            if self.current_run['approach'] == 'aggressive':
                damage = max(1, damage - 1)  # Aggressive reduces damage
                self.renderer.output("Your aggressive approach reduces the damage!")
            elif self.current_run['approach'] == 'careful':
                self.renderer.output("Your careful approach allows you to jack out safely.")
                self._complete_run(False)
                return
                
            # Move to the next ICE
            self.current_run['ice_index'] += 1
            self._process_next_ice()
        else:
            # Move to the next ICE
            self.current_run['ice_index'] += 1
            self._process_next_ice()

    def _complete_run(self, success):
        """Complete the current run with success or failure"""
        server_name = self.current_run['server']
        ice_list = self.current_run.get('ice_encountered', [])
        
        if success:
            # Show final run progress with all ICE passed
            if ice_list:
                self.renderer.display_run_progress(ice_list, len(ice_list), server_name)
                
            self.renderer.output_success("Accessing server...")
            server_result = self._access_server(self.current_run['server'])
            
            # Trigger any "successful_run" abilities
            for card in self.played_cards:
                result = self._process_card_ability(card, trigger='successful_run')
                if result:
                    self.renderer.output_success(result)
        else:
            self.renderer.output_error("Run failed!")
            
            # Show partial progress
            if ice_list:
                ice_index = self.current_run.get('ice_index', 0)
                self.renderer.display_run_progress(ice_list, ice_index, server_name)
            
            # Apply approach-specific consequences on failure
            if self.current_run['approach'] == 'aggressive':
                damage = 1
                self.renderer.output_error(f"Your aggressive approach resulted in {damage} neural damage!")
                # Apply damage logic would go here
        
        # Clear the current run
        self.current_run = None

    def _generate_ice_for_server(self, server_name):
        """Generate ICE for a server based on the server type and difficulty"""
        # In a real implementation, the Corporation player would install ICE
        # For the terminal version, we'll generate ICE based on the turn number
        
        # For simplicity, central servers have more ICE than remotes in this demo
        is_central = server_name in ["R&D", "HQ", "ARCHIVES"]
        ice_count = 0
        
        # Determine number of ICE based on turn number and server
        if self.turn_number < 3:
            ice_count = 0 if not is_central else 1
        elif self.turn_number < 6:
            ice_count = 1 if not is_central else 2
        else:
            ice_count = 2 if not is_central else 3
            
        # For testing, limit the ice to make runs possible early game
        # ice_count = min(2, ice_count)  # Allow up to 2 ICE for more interesting runs
        
        # If no ICE, return empty list
        if ice_count == 0:
            return []
            
        # Create ICE with various subtypes to test our breakers
        ice_pool = [
            {
                'name': 'Ice Wall',
                'type': 'Ice',
                'subtype': 'Barrier',
                'cost': 1,
                'strength': 1,
                'description': 'End the run.'
            },
            {
                'name': 'Enigma',
                'type': 'Ice',
                'subtype': 'Code Gate',
                'cost': 3,
                'strength': 2,
                'description': 'The Runner loses 1 click. End the run.'
            },
            {
                'name': 'Rototurret',
                'type': 'Ice', 
                'subtype': 'Sentry',
                'cost': 4,
                'strength': 0,
                'description': 'Trash 1 program. End the run.'
            },
            {
                'name': 'Neural Katana',
                'type': 'Ice',
                'subtype': 'Sentry',
                'cost': 4,
                'strength': 3,
                'description': 'Do 3 net damage. End the run.'
            },
            {
                'name': 'Wall of Static',
                'type': 'Ice',
                'subtype': 'Barrier',
                'cost': 3,
                'strength': 3,
                'description': 'End the run.'
            },
            {
                'name': 'Tollbooth',
                'type': 'Ice',
                'subtype': 'Code Gate',
                'cost': 8,
                'strength': 5,
                'description': 'The Runner loses 3 credits, if able. End the run if the Runner cannot pay 3 credits.'
            }
        ]
        
        # Generate a mix of ICE
        # Use deterministic selection for reproducibility in testing
        selected_ice = []
        for i in range(ice_count):
            # Determine a "slot" for each position in the server
            if i == 0:  # Outermost ICE is often a barrier
                candidates = [ice for ice in ice_pool if ice['subtype'] == 'Barrier']
            elif i == 1:  # Second ICE is often a code gate
                candidates = [ice for ice in ice_pool if ice['subtype'] == 'Code Gate']
            else:  # Innermost ICE is often a sentry
                candidates = [ice for ice in ice_pool if ice['subtype'] == 'Sentry']
                
            # If no candidates of the right type, use any type
            if not candidates:
                candidates = ice_pool
                
            # Select an ICE using a deterministic method based on turn number and server
            index = (self.turn_number + ord(server_name[0]) + i) % len(candidates)
            selected_ice.append(candidates[index])
            
        return selected_ice
    
    def _get_installed_breakers(self):
        """Get all installed icebreaker programs"""
        # Let's simplify this to just return installed cards that are icebreaker type
        breakers = []
        for card in self.played_cards:
            if card.get('type', '').lower() == 'icebreaker':
                # Add basic icebreaker ability if not present
                if 'ability' not in card:
                    card['ability'] = {
                        'type': 'break_ice',
                        'ice_types': ['all'],
                        'max_strength': card.get('strength', 2)
                    }
                breakers.append(card)
                
        return breakers
                
    def _access_server(self, server_name):
        """Access a server and get its contents"""
        self.renderer.output_success(f"Accessing server: {server_name}")
        
        # Each server has different content to access
        accessed_cards = []
        
        if server_name == "R&D":
            # In a simulation, create dummy cards instead of accessing corp_deck
            dummy_card = {
                'name': "Priority Directive",
                'type': "Agenda",
                'advancement_requirement': 3,
                'agenda_points': 2,
                'description': "When you score this agenda, you may rez a piece of ice ignoring all costs."
            }
            accessed_cards = [dummy_card]
            self.renderer.output(f"You access the top card of R&D.")
                
        elif server_name == "HQ":
            # Create a dummy card for HQ
            dummy_card = {
                'name': "Corporate Strategy",
                'type': "Operation",
                'cost': 2,
                'description': "Gain 5 credits."
            }
            accessed_cards = [dummy_card]
            self.renderer.output("You access a random card from HQ.")
                
        elif server_name == "ARCHIVES":
            # Create dummy cards for Archives
            dummy_cards = [
                {
                    'name': "Hedge Fund",
                    'type': "Operation",
                    'cost': 5,
                    'description': "Gain 9 credits."
                },
                {
                    'name': "Ice Wall",
                    'type': "Ice",
                    'subtype': "Barrier",
                    'cost': 1,
                    'strength': 1,
                    'description': "End the run."
                }
            ]
            accessed_cards = dummy_cards
            self.renderer.output(f"You access {len(accessed_cards)} cards from Archives.")
                
        elif server_name.startswith("REMOTE"):
            # Access cards in a remote server
            server_num = int(server_name[6:])
            if server_num > 0 and server_num <= 3:
                # Generate a random card for this remote server
                card_types = ["Asset", "Upgrade", "Agenda"]
                card_type = random.choice(card_types)
                
                if card_type == "Agenda":
                    # Create a random agenda
                    agenda = {
                        'name': f"Priority Requisition {server_num}",
                        'type': "Agenda",
                        'advancement_requirement': 3,
                        'agenda_points': 2,
                        'description': "When you score this agenda, you may rez a piece of ice ignoring all costs."
                    }
                    accessed_cards = [agenda]
                    self.renderer.output("You've found an agenda!")
                    
                    # Award agenda points
                    self.player_agenda_points += agenda['agenda_points']
                    self.renderer.output_success(f"You score {agenda['agenda_points']} agenda points!")
                    
                elif card_type == "Asset":
                    # Create a random asset
                    asset = {
                        'name': f"Adonis Campaign {server_num}",
                        'type': "Asset",
                        'cost': 4,
                        'trash_cost': 3,
                        'description': "Place 12 credits on Adonis Campaign. When it is rezzed. Take 3 credits from Adonis Campaign at the start of your turn. Trash it if there are no credits left."
                    }
                    accessed_cards = [asset]
                    self.renderer.output("You've found an asset.")
                    
                    # Option to trash
                    if self.player_credits >= asset['trash_cost']:
                        self.renderer.output(f"You can spend {asset['trash_cost']} credits to trash it.")
                
                elif card_type == "Upgrade":
                    # Create a random upgrade
                    upgrade = {
                        'name': f"Red Herrings {server_num}",
                        'type': "Upgrade",
                        'cost': 2,
                        'trash_cost': 1,
                        'description': "The Runner must pay 5 credits as an additional cost to steal an agenda from this server."
                    }
                    accessed_cards = [upgrade]
                    self.renderer.output("You've found an upgrade.")
                    
                    # Option to trash
                    if self.player_credits >= upgrade['trash_cost']:
                        self.renderer.output(f"You can spend {upgrade['trash_cost']} credits to trash it.")
        
        # Display all accessed cards
        if accessed_cards:
            self.renderer.output(f"You accessed {len(accessed_cards)} card(s):")
            for card in accessed_cards:
                # Display the accessed card with our mini card visual
                self.renderer.display_mini_card(card, "Accessed from server")
        else:
            self.renderer.output("No cards were accessed.")
            
        return accessed_cards

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
        self.renderer.output_success("Runner turn ended.")
        
        # Provide visual separation before Corp turn
        self.renderer.output(f"\n{Colors.BRIGHT_BLACK}{'=' * 50}{Colors.RESET}")
        self.renderer.output(f"{Colors.BRIGHT_CYAN}Transitioning to Corporation's turn...{Colors.RESET}")
        self.renderer.output(f"{Colors.BRIGHT_BLACK}{'=' * 50}{Colors.RESET}\n")
        
        # Switch to AI opponent's turn
        self.active_player = "corp"
        self.start_turn()

    def _cmd_jack_out(self, args):
        """Attempt to abort the current run"""
        if not self.current_run:
            self.renderer.output_error("You are not currently on a run.")
            return
            
        # Only allow jack out during ICE encounter
        if self.current_run.get('state') != 'ice_encountered':
            self.renderer.output_error("You can only jack out during an ICE encounter.")
            return
            
        ice = self.current_run.get('current_ice')
        if not ice:
            self.renderer.output_error("No ICE detected in the current run.")
            return
            
        # Calculate success chance based on ICE type and installed programs
        base_success = 0.5  # 50% base chance
        
        # ICE type modifiers
        ice_type = ice.get('type', '').lower()
        if ice_type == 'code gate':
            base_success -= 0.1  # Harder to jack out from code gates
        elif ice_type == 'sentry':
            base_success -= 0.2  # Much harder to jack out from sentries
        elif ice_type == 'barrier':
            base_success += 0.1  # Easier to jack out from barriers
            
        # Check for cards that help with jacking out
        for card in self.played_cards:
            if 'ability' in card and card['ability'].get('type') == 'jack_out_assist':
                base_success += 0.2
                self.renderer.output_success(f"Using {card['name']} to assist with jacking out.")
                
        # Apply run approach modifier
        if self.current_run.get('approach') == 'careful':
            base_success += 0.3  # Much easier to jack out with careful approach
                
        # Roll for success
        success_roll = random.random()
        self.renderer.output(f"Attempting to jack out... (Success chance: {int(base_success*100)}%)")
        
        if success_roll <= base_success:
            # Jack out successful
            self.renderer.output_success("Jack out successful! You have safely disconnected from the run.")
            self.current_run = None
        else:
            # Jack out failed
            self.renderer.output_error("Jack out failed!")
            
            # Apply consequences based on ICE type
            if ice_type == 'sentry':
                damage = 1
                self.renderer.output_error(f"The sentry traced your exit attempt and dealt {damage} neural damage!")
                # Apply damage logic would go here
            elif ice_type == 'code gate':
                credit_loss = 2
                self.renderer.output_error(f"The code gate scrambled your exit protocol, costing you {credit_loss} credits!")
                self.player_credits = max(0, self.player_credits - credit_loss)
            else:
                self.renderer.output_error("You remain connected and must deal with the ICE.")
                
            # Continue with the run, still facing the same ICE
            
        # Update status display
        self._update_status()

    def _initialize_cards(self):
        """Initialize the card data for the game"""
        # These would normally be loaded from a JSON file or similar
        # For this example, we'll create some basic cards
        self.cards_data = [
            {
                'name': 'Corroder',
                'type': 'Icebreaker',
                'subtype': 'Fracter',
                'cost': 2,
                'mu': 1,
                'strength': 2,
                'description': 'Break barrier subroutines. 1 credit: +1 strength for the remainder of this run.'
            },
            {
                'name': 'Data Mining',
                'type': 'Resource',
                'cost': 2,
                'mu': 0,
                'description': 'Gain 1 credit whenever you make a successful run.'
            },
            {
                'name': 'Gordian Blade',
                'type': 'Icebreaker',
                'subtype': 'Decoder',
                'cost': 4,
                'mu': 1,
                'strength': 2,
                'description': 'Break code gate subroutines. 1 credit: +1 strength for the remainder of this run.'
            },
            {
                'name': 'Diesel',
                'type': 'Event',
                'cost': 0,
                'mu': 0,
                'description': 'Draw 3 cards.'
            },
            {
                'name': 'Magnum Opus',
                'type': 'Program',
                'cost': 5,
                'mu': 2,
                'description': 'Click: Gain 2 credits.'
            },
            {
                'name': 'Sure Gamble',
                'type': 'Event',
                'cost': 5,
                'mu': 0,
                'description': 'Gain 9 credits.'
            },
            {
                'name': 'Akamatsu Mem Chip',
                'type': 'Hardware',
                'cost': 1,
                'mu': 0,
                'description': '+1 memory unit.'
            },
            {
                'name': 'The Personal Touch',
                'type': 'Hardware',
                'cost': 2,
                'mu': 0,
                'description': 'Install on an icebreaker. Host icebreaker has +1 strength.'
            },
            {
                'name': 'Ninja',
                'type': 'Icebreaker',
                'subtype': 'Killer',
                'cost': 4,
                'mu': 1,
                'strength': 3,
                'description': 'Break sentry subroutines. 1 credit: +1 strength for the remainder of this run.'
            },
            {
                'name': 'Net Shield',
                'type': 'Hardware',
                'cost': 2,
                'mu': 0,
                'description': 'Prevent up to 1 net damage each turn.'
            }
        ]
        
        # Add abilities to icebreakers
        for card in self.cards_data:
            if card['type'] == 'Icebreaker':
                subtype = card.get('subtype', 'AI')
                ice_types = []
                
                if subtype == 'Fracter':
                    ice_types = ['Barrier']
                elif subtype == 'Decoder':
                    ice_types = ['Code Gate']
                elif subtype == 'Killer':
                    ice_types = ['Sentry']
                elif subtype == 'AI':
                    ice_types = ['all']
                    
                card['ability'] = {
                    'type': 'break_ice',
                    'ice_types': ice_types,
                    'max_strength': card.get('strength', 2)
                }
