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
            return None
            
        ability = card['ability']
        ability_type = ability.get('type')
        
        # Handle permanent abilities
        if ability_type == 'permanent':
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
            if trigger == ability_trigger:
                effect = ability.get('effect')
                value = ability.get('value', 0)
                frequency = ability.get('frequency', 'always')
                
                # Check if frequency limits are satisfied
                if frequency == 'per_turn' and card.get('used_this_turn', False):
                    return None
                    
                # Apply effect
                if effect == 'gain_credits':
                    self.player_credits += value
                    card['used_this_turn'] = True
                    return f"Gained {value} credits from {card['name']}"
                elif effect == 'draw':
                    card_drawn = self._draw_card(value)
                    card['used_this_turn'] = True
                    if card_drawn:
                        return f"Drew {value} card(s) from {card['name']}"
                        
        # Handle one-time effects (events)
        elif ability_type == 'one_time':
            if trigger == 'play':
                effect = ability.get('effect')
                if effect == 'bypass_ice':
                    # Store that the next ice should be bypassed
                    self.bypass_next_ice = ability.get('count', 1)
                    return f"Next {self.bypass_next_ice} ice will be bypassed"
                elif effect == 'untraceable_run':
                    # Store that the next run is untraceable
                    self.next_run_untraceable = True
                    return f"Next run this turn will be untraceable"
                elif effect == 'run':
                    # Implement direct run effect
                    target = ability.get('target', 'any')
                    success_effect = ability.get('success_effect')
                    success_value = ability.get('success_value', 0)
                    # Run logic would be implemented here
                    return f"Initiated a run on {target}"
                    
        # Handle ice breaking abilities
        elif ability_type == 'break_ice':
            if trigger == 'encounter_ice':
                ice = context.get('ice')
                if not ice:
                    return None
                    
                # Check if the breaker can handle this ice type
                ice_types = ability.get('ice_types', [])
                ice_type = ice.get('type', 'unknown')
                if 'all' not in ice_types and ice_type not in ice_types:
                    return f"{card['name']} cannot break {ice_type} ice"
                    
                # Check strength
                breaker_strength = card.get('strength', 0)
                ice_strength = ice.get('strength', 0)
                max_strength = ability.get('max_strength', 0)
                if ice_strength > max_strength:
                    return f"{card['name']} is not strong enough to break {ice['name']}"
                    
                # Check subroutine limits
                max_subroutines = ability.get('subroutines')
                ice_subroutines = ice.get('subroutines', [])
                if max_subroutines != 'unlimited' and len(ice_subroutines) > max_subroutines:
                    return f"{card['name']} can only break {max_subroutines} subroutines"
                    
                # Break the ice
                return f"{card['name']} successfully broke {ice['name']}"
                
        # Handle resource cards
        elif ability_type == 'resource':
            if trigger == 'install':
                resource_type = ability.get('resource_type')
                value = ability.get('value', 0)
                card['counters'] = value
                return f"Placed {value} {resource_type} on {card['name']}"
            elif trigger == 'use':
                resource_type = ability.get('resource_type')
                usage = ability.get('usage')
                if context and context.get('action') == usage:
                    if card.get('counters', 0) > 0:
                        card['counters'] -= 1
                        return f"Used 1 {resource_type} from {card['name']}"
                        
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
        """Install a card from the player's hand"""
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
            card_number = int(args[0])
            if card_number < 1 or card_number > len(self.hand_cards):
                self.renderer.output_error(f"Invalid card number: {card_number}")
                return

            # Get the card from hand
            card = self.hand_cards[card_number - 1]
            
            # Check if player has enough credits to install
            if self.player_credits < card.get('cost', 0):
                self.renderer.output_error(f"Not enough credits to install {card['name']} (need {card['cost']})")
                return
                
            # Check if player has enough memory for programs
            if card.get('type', '').lower() == 'program' and self.memory_units_used + card.get('mu', 0) > self.memory_units_available:
                self.renderer.output_error(f"Not enough memory to install {card['name']} (need {card['mu']} MU)")
                return
                
            # Check for special resource costs (e.g., from Credit Cache)
            special_payments = []
            for installed_card in self.played_cards:
                if ('ability' in installed_card and 
                    installed_card['ability'].get('type') == 'resource' and
                    installed_card['ability'].get('usage') == 'install_programs' and
                    card.get('type', '').lower() == 'program' and
                    installed_card.get('counters', 0) > 0):
                    special_payments.append(installed_card)
            
            # If there are special payment options, handle them
            credits_from_resources = 0
            if special_payments and card.get('type', '').lower() == 'program':
                for resource_card in special_payments:
                    result = self._process_card_ability(
                        resource_card, 
                        trigger='use',
                        context={'action': 'install_programs'}
                    )
                    if result:
                        self.renderer.output_success(result)
                        credits_from_resources += 1
                        if credits_from_resources >= card.get('cost', 0):
                            break
            
            # Deduct costs
            credit_cost = max(0, card.get('cost', 0) - credits_from_resources)
            self.player_credits -= credit_cost
            
            # Update memory if it's a program
            if card.get('type', '').lower() == 'program':
                self.memory_units_used += card.get('mu', 0)
                
            # Remove from hand and add to played cards
            self.hand_cards.remove(card)
            self.played_cards.append(card)
            
            self.renderer.output_success(f"Installed {card['name']}")
            
            # Process card abilities on installation
            ability_result = self._process_card_ability(card, trigger='install')
            if ability_result:
                self.renderer.output_success(ability_result)
                
            # Display detailed card information
            self.renderer.display_card_details(card)
            
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
        # Get the current ICE based on the index
        if self.current_run['ice_index'] >= len(self.current_run['ice_encountered']):
            # No more ICE, run is successful
            self._complete_run(True)
            return
            
        ice = self.current_run['ice_encountered'][self.current_run['ice_index']]
        self.current_run['current_ice'] = ice
        self.current_run['state'] = 'ice_encountered'
        
        # Check if we can bypass this ICE
        if hasattr(self, 'bypass_next_ice') and self.bypass_next_ice > 0:
            self.renderer.output_success(f"Bypassing {ice['name']} with exploit...")
            self.bypass_next_ice -= 1
            
            # Move to next ICE
            self.current_run['ice_index'] += 1
            self._process_next_ice()
            return
        
        # Display ICE encounter
        self.renderer.display_ice_encounter(ice)
        
        # Check for aggressive approach strength bonus
        strength_bonus = 0
        if self.current_run['approach'] == 'aggressive':
            strength_bonus = 1
            self.renderer.output("Your aggressive approach gives you +1 strength against this ICE.")
        
        # Check if player has any installed icebreakers that can handle this ICE
        breakers = self._get_installed_breakers()
        usable_breakers = []
        
        for breaker in breakers:
            result = self._process_card_ability(
                breaker, 
                trigger='encounter_ice', 
                context={'ice': ice, 'strength_bonus': strength_bonus}
            )
            if result and "successfully broke" in result:
                usable_breakers.append((breaker, result))
        
        if usable_breakers:
            # Player has at least one usable breaker
            # If multiple, let player choose or auto-select the best one
            best_breaker, message = usable_breakers[0]  # For simplicity, take the first one
            self.renderer.output_success(message)
            
            # Move to next ICE
            self.current_run['ice_index'] += 1
            self._process_next_ice()
        else:
            # No usable icebreakers for this ICE
            self.renderer.output("You need to decide how to proceed.")
            self.renderer.output("Options: 'jack_out' to abort the run, or press Enter to continue and face consequences.")
            
            # The command loop will handle the next action
            # If jack_out, that command will handle it
            # If they press Enter, we'll process the failure in _cmd_continue
    
    def _complete_run(self, success):
        """Complete the current run with success or failure"""
        if success:
            self.renderer.output_success("Accessing server...")
            server_result = self._access_server(self.current_run['server'])
            
            # Trigger any "successful_run" abilities
            for card in self.played_cards:
                result = self._process_card_ability(card, trigger='successful_run')
                if result:
                    self.renderer.output_success(result)
        else:
            self.renderer.output_error("Run failed!")
            
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
        ice_count = min(1, ice_count)  # Limit to at most 1 ice in early development
        
        # If no ICE, return empty list
        if ice_count == 0:
            return []
            
        # Sample ICE cards
        ice_templates = [
            {
                "name": "Enigma",
                "type": "Code Gate",
                "strength": 2,
                "description": "Runner loses 1 click if able",
                "subroutines": ["End the run", "Runner loses 1 click"]
            },
            {
                "name": "Ice Wall",
                "type": "Barrier",
                "strength": 1,
                "description": "Basic barrier protection",
                "subroutines": ["End the run"]
            },
            {
                "name": "Neural Katana",
                "type": "Sentry",
                "strength": 3,
                "description": "Deals 3 net damage",
                "subroutines": ["Do 3 net damage", "End the run"]
            },
            {
                "name": "Data Mine",
                "type": "Trap",
                "strength": 2,
                "description": "Do 1 net damage",
                "subroutines": ["Do 1 net damage", "End the run"]
            },
            {
                "name": "Ghost Walker",
                "type": "Stealth",
                "strength": 1,
                "description": "The runner loses 2 credits",
                "subroutines": ["Runner loses 2 credits", "End the run"]
            }
        ]
        
        # Select random ICE from templates
        ice_selection = []
        for i in range(ice_count):
            ice_index = (self.random_seed + i + hash(server_name)) % len(ice_templates)
            ice_selection.append(ice_templates[ice_index])
            
        return ice_selection
    
    def _get_installed_breakers(self):
        """Get all installed icebreaker programs"""
        return [card for card in self.played_cards 
                if card.get('type', '') == 'Program' and 
                'ability' in card and 
                card['ability'].get('type', '') == 'break_ice']
                
    def _access_server(self, server_name):
        """Access a server after a successful run"""
        # Different server types have different access mechanics
        if server_name == "R&D":
            # Access top card of R&D (Corp's deck)
            if self.corp_cards_remaining > 0:
                # In a real implementation, this would reveal the top card of R&D
                # For the terminal version, we'll simulate it
                found_agenda = (self.random_seed + self.turn_number) % 6 == 0
                if found_agenda:
                    self.runner_agenda_points += 1
                    self.renderer.output_success("Found an agenda! You score 1 agenda point.")
                    
                    # Check win condition
                    if self.runner_agenda_points >= self.agenda_points_to_win:
                        self.game_over = True
                        self.win_message = "Runner wins by scoring 7 agenda points!"
                    return "Agenda scored"
                else:
                    self.renderer.output("No valuable data found.")
                    return "No agenda"
            else:
                self.renderer.output("R&D is empty.")
                return "Empty server"
                
        elif server_name == "HQ":
            # Access a random card from HQ (Corp's hand)
            # In a real implementation, this would reveal a random card from the Corp's hand
            # For the terminal version, we'll simulate it
            found_agenda = (self.random_seed + self.turn_number + 1) % 5 == 0
            if found_agenda:
                self.runner_agenda_points += 1
                self.renderer.output_success("Found an agenda in HQ! You score 1 agenda point.")
                
                # Check win condition
                if self.runner_agenda_points >= self.agenda_points_to_win:
                    self.game_over = True
                    self.win_message = "Runner wins by scoring 7 agenda points!"
                return "Agenda scored"
            else:
                self.renderer.output("No valuable data found in HQ.")
                return "No agenda"
                
        elif server_name == "ARCHIVES":
            # Access all cards in Archives (Corp's discard pile)
            # In a real implementation, this would reveal all cards in the Corp's discard pile
            # For the terminal version, we'll simulate it
            found_agenda = (self.random_seed + self.turn_number + 2) % 7 == 0
            if found_agenda:
                self.runner_agenda_points += 1
                self.renderer.output_success("Found an agenda in Archives! You score 1 agenda point.")
                
                # Check win condition
                if self.runner_agenda_points >= self.agenda_points_to_win:
                    self.game_over = True
                    self.win_message = "Runner wins by scoring 7 agenda points!"
                return "Agenda scored"
            else:
                self.renderer.output("No valuable data found in Archives.")
                return "No agenda"
                
        else:  # Remote server
            # Access a remote server, which could contain agendas or assets
            # In a real implementation, this would reveal the card in the remote server
            # For the terminal version, we'll simulate it
            server_num = int(server_name[6:])
            found_agenda = (self.random_seed + self.turn_number + server_num) % 4 == 0
            if found_agenda:
                self.runner_agenda_points += 2  # Remote servers usually have higher-value agendas
                self.renderer.output_success("Found a high-value agenda! You score 2 agenda points.")
                
                # Check win condition
                if self.runner_agenda_points >= self.agenda_points_to_win:
                    self.game_over = True
                    self.win_message = "Runner wins by scoring 7 agenda points!"
                return "Agenda scored"
            else:
                # Could be an asset or trap
                is_trap = (self.random_seed + self.turn_number + server_num) % 3 == 0
                if is_trap:
                    damage = 2
                    self.renderer.output_error(f"It's a trap! You take {damage} neural damage.")
                    # In a real implementation, this would reduce the Runner's hand size or cards
                    return "Trap sprung"
                else:
                    self.renderer.output("You access an asset but gain no advantage.")
                    return "Asset accessed"

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
