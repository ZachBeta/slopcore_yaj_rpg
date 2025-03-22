extends Control

# Game state
var deck_manager: DeckManager
var player_credits: int = 5
var memory_units_available: int = 4
var memory_units_used: int = 0
var player_side: String = "runner"  # or "corp"
var opponent_side: String = "corp"  # or "runner"
var random_seed: int = 0  # Seed for deterministic randomness

# Game phases and turns
enum GamePhase {SETUP, START_TURN, ACTION, DISCARD, END_TURN, GAME_OVER}
var current_phase: int = GamePhase.SETUP
var clicks_remaining: int = 0
var max_clicks: int = 4
var turn_number: int = 0
var active_player: String = player_side

# Win conditions
var runner_agenda_points: int = 0
var corp_agenda_points: int = 0
var agenda_points_to_win: int = 7
var runner_cards_remaining: int = 0
var corp_cards_remaining: int = 0
var game_over: bool = false
var win_message: String = ""

# Card data arrays
var hand_cards: Array = []
var played_cards: Array = []
var selected_card_index: int = -1

# Command history and parsing
var command_history: Array = []
var command_history_index: int = -1
var valid_commands = {
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

# BSD-style command documentation
var command_man_pages = {
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

# Node references
@onready var output_text = %OutputText
@onready var command_input = %CommandInput
@onready var status_bar = %StatusBar
@onready var prompt_label = %PromptLabel
@onready var header_label = %HeaderLabel

# Function to set a specific random seed for deterministic tests
func set_random_seed(seed_value: int) -> void:
	random_seed = seed_value
	print("Terminal Game: Random seed set to " + str(seed_value))

func _ready():
	# Set up the command input
	command_input.text = ""
	command_input.grab_focus()
	
	# Make sure the input is connected to the command submission function
	if not command_input.text_submitted.is_connected(_on_command_submitted):
		command_input.text_submitted.connect(_on_command_submitted)
	
	# Debug output to verify things are working
	print("Terminal game ready, command input connected: ", command_input.text_submitted.is_connected(_on_command_submitted))
	
	# Initialize with a random seed if one isn't set
	if random_seed == 0:
		random_seed = randi()
		
	# Show a welcome message
	_initialize_terminal()
	
	# Process a help command right away so users know what to do
	_process_command("help")
	
	# Initialize deck manager
	deck_manager = DeckManager.new()
	if deck_manager.card_definitions.is_empty():
		deck_manager.create_default_definitions()
	
	# Set up appropriate deck for the player
	if player_side == "runner":
		deck_manager.create_default_runner_deck()
	else:
		deck_manager.create_default_corp_deck()
	
	# Start the game
	start_game()

func _initialize_terminal():
	output_text.clear()
	output_text.append_text("[color=#00ff00]INITIALIZING NEURAL INTERFACE...[/color]\n")
	output_text.append_text("..............................\n")
	output_text.append_text("[color=#00ff00]CONNECTION ESTABLISHED[/color]\n")
	output_text.append_text("[color=#00ff00]WELCOME TO THE NET[/color]\n")
	output_text.append_text("[color=#00aa00]-----------------------------------[/color]\n")
	output_text.append_text("[color=#00ff00]Type commands in the input field below[/color]\n")
	output_text.append_text("[color=#00ff00]Type 'help' for available commands[/color]\n")
	output_text.append_text("[color=#00aa00]-----------------------------------[/color]\n\n")
	
	# Create and initialize deck manager
	deck_manager = DeckManager.new()
	
	# Apply random seed to deck manager if set
	if random_seed != 0:
		deck_manager.set_random_seed(random_seed)
	
	# Create default decks
	deck_manager.create_default_runner_deck()
	deck_manager.create_default_corp_deck()

func _update_status_bar():
	var phase_text = ""
	match current_phase:
		GamePhase.SETUP: phase_text = "INITIALIZING"
		GamePhase.START_TURN: phase_text = "TURN START"
		GamePhase.ACTION: phase_text = "ACTION"
		GamePhase.DISCARD: phase_text = "DISCARD"
		GamePhase.END_TURN: phase_text = "TURN END"
		GamePhase.GAME_OVER: phase_text = "DISCONNECTED"
	
	# Update the status bar text
	status_bar.text = "[color=#00ff00]SYSTEM:[/color] " + phase_text
	status_bar.append_text(" | [color=#00ff00]CLICKS:[/color] " + str(clicks_remaining) + "/" + str(max_clicks))
	status_bar.append_text(" | [color=#00ff00]CREDITS:[/color] " + str(player_credits))
	status_bar.append_text(" | [color=#00ff00]MEMORY:[/color] " + str(memory_units_used) + "/" + str(memory_units_available))
	status_bar.append_text(" | [color=#00ff00]CARDS:[/color] " + str(hand_cards.size()))
	status_bar.append_text(" | [color=#00ff00]TURN:[/color] " + str(turn_number))

func _update_header():
	var faction_text = player_side.to_upper()
	var header_color = "[color=#00ff00]" if player_side == "runner" else "[color=#ff5500]"
	header_label.text = "[b]NEON DOMINANCE v0.1[/b] | " + header_color + faction_text + " TERMINAL[/color]"

func start_game():
	# Reset game state
	runner_agenda_points = 0
	corp_agenda_points = 0
	turn_number = 0
	memory_units_used = 0
	played_cards = []
	hand_cards = []
	
	# Initial setup
	active_player = player_side
	current_phase = GamePhase.SETUP
	
	# Update the terminal header
	_update_header()
	
	# Initial draw
	output_text.append_text("Accessing memory banks...\n")
	
	for i in range(5):
		var card = deck_manager.draw_card(player_side)
		if card:
			hand_cards.append(card)
			output_text.append_text("Retrieved file: [color=#88ff88]" + card.name + "[/color]\n")
			await get_tree().create_timer(0.2).timeout
	
	# Track cards remaining
	runner_cards_remaining = deck_manager.runner_deck.size()
	corp_cards_remaining = deck_manager.corp_deck.size()
	
	output_text.append_text("\n[color=#00ff00]Memory bank access complete. 5 files retrieved.[/color]\n")
	output_text.append_text("Type [color=#ffff00]hand[/color] to examine your data files.\n\n")
	
	# Begin first turn
	await get_tree().create_timer(1.0).timeout
	start_turn()

func start_turn():
	turn_number += 1
	current_phase = GamePhase.START_TURN
	
	# Reset clicks
	clicks_remaining = max_clicks
	
	# Gain credits at the start of turn
	player_credits += 1
	
	# Update UI
	_update_status_bar()
	
	output_text.append_text("\n[color=#00ff00]*** TURN " + str(turn_number) + " STARTED ***[/color]\n")
	output_text.append_text("System update: Acquired [color=#ffff00]1 credit[/color]\n")
	output_text.append_text("System update: [color=#ffff00]" + str(clicks_remaining) + " clicks[/color] available\n")
	
	# Move to action phase
	await get_tree().create_timer(0.5).timeout
	current_phase = GamePhase.ACTION
	_update_status_bar()
	
	output_text.append_text("\n[color=#00ff00]ACTION PHASE: Enter commands...[/color]\n\n")

func _on_command_submitted(command: String):
	# Add command to history
	if command.strip_edges() != "":
		command_history.append(command)
		command_history_index = command_history.size()
	
	# Echo the command
	output_text.append_text("[color=#aaffaa]> " + command + "[/color]\n")
	
	# Reset the input
	command_input.text = ""
	
	# Process the command
	_process_command(command.to_lower().strip_edges())
	
	# Update status after command
	_update_status_bar()
	
	# Scroll to bottom
	output_text.scroll_to_line(output_text.get_line_count())
	
	# Make sure focus returns to the input field after command processing
	command_input.grab_focus()

func _process_command(command: String):
	if command == "":
		return
	
	# Split the command and arguments
	var parts = command.split(" ", false)
	var cmd = parts[0]
	var args = parts.slice(1) if parts.size() > 1 else []
	
	# Process commands
	match cmd:
		"help":
			_cmd_help(args)
		"man":
			_cmd_man(args)
		"draw":
			_cmd_draw()
		"hand":
			_cmd_hand()
		"install":
			_cmd_install(args)
		"run":
			_cmd_run(args)
		"end":
			_cmd_end_turn()
		"info":
			_cmd_info()
		"discard":
			_cmd_discard(args)
		"system":
			_cmd_system()
		"installed":
			_cmd_installed()
		"credits":
			_cmd_credits()
		"memory":
			_cmd_memory()
		_:
			output_text.append_text("[color=#ff5555]ERROR: Unknown command '" + cmd + "'. Type 'help' for available commands.[/color]\n")

func _cmd_help(args: Array):
	if args.is_empty():
		output_text.append_text("[color=#00ffff]TERMINAL COMMANDS:[/color]\n")
		for cmd in valid_commands.keys():
			output_text.append_text("  [color=#ffff00]" + cmd + "[/color] - " + valid_commands[cmd] + "\n")
		output_text.append_text("\n[color=#aaaaaa]For more information on a specific command, type 'help <command>' or 'man <command>'[/color]\n")
	else:
		var cmd = args[0]
		if valid_commands.has(cmd):
			output_text.append_text("[color=#00ffff]HELP: " + cmd + "[/color]\n")
			
			if command_man_pages.has(cmd):
				var man_page = command_man_pages[cmd]
				
				# BSD-style help format (brief)
				output_text.append_text(man_page["NAME"] + "\n\n")
				output_text.append_text("[color=#aaaaaa]SYNOPSIS[/color]\n  " + man_page["SYNOPSIS"] + "\n\n")
				output_text.append_text("[color=#aaaaaa]DESCRIPTION[/color]\n  " + man_page["DESCRIPTION"] + "\n\n")
				
				if man_page.has("EXAMPLES"):
					output_text.append_text("[color=#aaaaaa]EXAMPLES[/color]\n  " + man_page["EXAMPLES"].replace("\n", "\n  ") + "\n\n")
				
				output_text.append_text("[color=#aaaaaa]For full documentation, type 'man " + cmd + "'[/color]\n")
			else:
				# Fallback for any commands that don't have a man page yet
				output_text.append_text("  " + valid_commands[cmd] + "\n")
		else:
			output_text.append_text("[color=#ff5555]ERROR: No help available for '" + cmd + "'[/color]\n")

func _cmd_man(args: Array):
	if args.is_empty():
		output_text.append_text("[color=#ff5555]ERROR: 'man' requires a command name[/color]\n")
		output_text.append_text("[color=#aaaaaa]Usage: man <command>[/color]\n")
		return
	
	var cmd = args[0]
	if command_man_pages.has(cmd):
		var man_page = command_man_pages[cmd]
		
		# Full BSD-style manual page format
		output_text.append_text("[color=#00ffff]NETRUNNER_OS(1)               NETRUNNER MANUAL               NETRUNNER_OS(1)[/color]\n\n")
		
		output_text.append_text("[color=#00ffff]NAME[/color]\n       " + man_page["NAME"] + "\n\n")
		
		output_text.append_text("[color=#00ffff]SYNOPSIS[/color]\n       " + man_page["SYNOPSIS"] + "\n\n")
		
		output_text.append_text("[color=#00ffff]DESCRIPTION[/color]\n       " + man_page["DESCRIPTION"].replace("\n", "\n       ") + "\n\n")
		
		if man_page.has("EXAMPLES"):
			output_text.append_text("[color=#00ffff]EXAMPLES[/color]\n       " + man_page["EXAMPLES"].replace("\n", "\n       ") + "\n\n")
		
		if man_page.has("SEE ALSO"):
			output_text.append_text("[color=#00ffff]SEE ALSO[/color]\n       " + man_page["SEE ALSO"] + "\n\n")
		
		output_text.append_text("[color=#00ffff]NETRUNNER_OS               " + str(Time.get_date_dict_from_system()["year"]) + "               NEON DOMINANCE v0.1[/color]\n")
	else:
		output_text.append_text("[color=#ff5555]ERROR: No manual entry for '" + cmd + "'[/color]\n")

func _cmd_draw():
	if current_phase != GamePhase.ACTION:
		output_text.append_text("[color=#ff5555]ERROR: Can only draw during action phase[/color]\n")
		return
	
	if clicks_remaining <= 0:
		output_text.append_text("[color=#ff5555]ERROR: Not enough clicks remaining[/color]\n")
		return
	
	var card = deck_manager.draw_card(player_side)
	if card:
		hand_cards.append(card)
		clicks_remaining -= 1
		_update_status_bar()
		
		output_text.append_text("[color=#88ff88]File retrieved: " + card.name + " - " + card.card_type + "[/color]\n")
		output_text.append_text("Remaining clicks: [color=#ffff00]" + str(clicks_remaining) + "[/color]\n")
	else:
		output_text.append_text("[color=#ff5555]ERROR: No more files available in data stack[/color]\n")

func _cmd_hand():
	if hand_cards.is_empty():
		output_text.append_text("[color=#aaaaaa]Your hand is empty[/color]\n")
		return
	
	output_text.append_text("[color=#00ffff]CURRENT FILES IN MEMORY:[/color]\n")
	for i in range(hand_cards.size()):
		var card = hand_cards[i]
		var card_color = _get_card_color(card.card_type)
		
		output_text.append_text("  [" + str(i+1) + "] " + card_color + card.name + "[/color] - " + card.card_type)
		
		# Add additional information based on card type
		if card.card_type.to_lower() in ["program", "icebreaker"]:
			output_text.append_text(" (Mem: " + str(card.memory_units) + ", Cost: " + str(card.cost) + ")")
		elif card.card_type.to_lower() == "event":
			output_text.append_text(" (Cost: " + str(card.cost) + ")")
		
		output_text.append_text("\n")

func _get_card_color(card_type: String) -> String:
	match card_type.to_lower():
		"program", "icebreaker":
			return "[color=#00ffaa]"
		"hardware":
			return "[color=#ffaa00]"
		"resource":
			return "[color=#aaaaff]"
		"event":
			return "[color=#ff55ff]"
		"ice":
			return "[color=#ff5555]"
		"operation":
			return "[color=#5555ff]"
		"asset", "upgrade":
			return "[color=#ffff55]"
		"agenda":
			return "[color=#ff00ff]"
		_:
			return "[color=#ffffff]"

func _cmd_install(args: Array):
	if current_phase != GamePhase.ACTION:
		output_text.append_text("[color=#ff5555]ERROR: Can only install during action phase[/color]\n")
		return
	
	if clicks_remaining <= 0:
		output_text.append_text("[color=#ff5555]ERROR: Not enough clicks remaining[/color]\n")
		return
	
	if hand_cards.is_empty():
		output_text.append_text("[color=#ff5555]ERROR: No files in memory to install[/color]\n")
		return
	
	if args.is_empty():
		output_text.append_text("[color=#ff5555]ERROR: Please specify which file to install (number)[/color]\n")
		output_text.append_text("[color=#aaaaaa]Example: install 2[/color]\n")
		output_text.append_text("[color=#aaaaaa]Type 'hand' to see available files[/color]\n")
		return
	
	var index = int(args[0]) - 1  # Convert to 0-based index
	
	if index < 0 or index >= hand_cards.size():
		output_text.append_text("[color=#ff5555]ERROR: Invalid file number. Type 'hand' to see available files[/color]\n")
		return
	
	var card = hand_cards[index]
	
	# Check if player has enough credits
	if player_credits < card.cost:
		output_text.append_text("[color=#ff5555]ERROR: Insufficient credits. Need " + str(card.cost) + ", have " + str(player_credits) + "[/color]\n")
		return
	
	# Check if player has enough memory (for programs)
	var mem_cost = card.get("memory_units", 0)
	if card.card_type.to_lower() in ["program", "icebreaker"] and memory_units_used + mem_cost > memory_units_available:
		output_text.append_text("[color=#ff5555]ERROR: Insufficient memory. Need " + str(mem_cost) + ", have " + str(memory_units_available - memory_units_used) + " available[/color]\n")
		return
	
	# Install the card
	played_cards.append(card)
	hand_cards.remove_at(index)
	player_credits -= card.cost
	clicks_remaining -= 1
	
	# Update memory usage for programs
	if card.card_type.to_lower() in ["program", "icebreaker"]:
		memory_units_used += mem_cost
	
	_update_status_bar()
	
	var card_color = _get_card_color(card.card_type)
	output_text.append_text("[color=#00ff00]INSTALLING: " + card_color + card.name + "[/color][/color]\n")
	output_text.append_text("Credits remaining: [color=#ffff00]" + str(player_credits) + "[/color]\n")
	output_text.append_text("Memory remaining: [color=#ffff00]" + str(memory_units_available - memory_units_used) + "/" + str(memory_units_available) + "[/color]\n")
	output_text.append_text("Clicks remaining: [color=#ffff00]" + str(clicks_remaining) + "[/color]\n")

func _cmd_run(args: Array):
	if current_phase != GamePhase.ACTION:
		output_text.append_text("[color=#ff5555]ERROR: Can only run during action phase[/color]\n")
		return
	
	if player_side != "runner":
		output_text.append_text("[color=#ff5555]ERROR: Only runners can initiate runs[/color]\n")
		return
	
	if clicks_remaining <= 0:
		output_text.append_text("[color=#ff5555]ERROR: Not enough clicks remaining[/color]\n")
		return
	
	if args.is_empty():
		output_text.append_text("[color=#ff5555]ERROR: Please specify a server to run on[/color]\n")
		output_text.append_text("[color=#aaaaaa]Example: run R&D[/color]\n")
		output_text.append_text("[color=#aaaaaa]Available servers: R&D, HQ, Archives[/color]\n")
		return
	
	var server = args[0].to_lower()
	
	var valid_servers = ["r&d", "hq", "archives"]
	if not valid_servers.has(server):
		output_text.append_text("[color=#ff5555]ERROR: Invalid server '" + args[0] + "'. Available servers: R&D, HQ, Archives[/color]\n")
		return
	
	# Use a click to initiate the run
	clicks_remaining -= 1
	_update_status_bar()
	
	output_text.append_text("[color=#00ffff]INITIATING RUN ON " + server.to_upper() + "[/color]\n")
	output_text.append_text("Establishing connection...\n")
	await get_tree().create_timer(0.7).timeout
	
	# Placeholder run mechanics
	output_text.append_text("Approaching server...\n")
	await get_tree().create_timer(0.7).timeout
	
	# Randomly determine success/failure for now
	var random = RandomNumberGenerator.new()
	random.seed = random_seed
	if random.randf() > 0.5:
		output_text.append_text("[color=#00ff00]RUN SUCCESSFUL![/color]\n")
		output_text.append_text("Breached " + server.to_upper() + " security. Accessing data...\n")
		
		# Handle specific server outcomes
		match server:
			"r&d":
				output_text.append_text("Accessing top card of R&D...\n")
				# Simulate seeing a card from the corp's deck
				player_credits += 2
				output_text.append_text("[color=#00ff00]Found 2 credits in the system.[/color]\n")
			"hq":
				output_text.append_text("Accessing random card from HQ...\n")
				# Simulate accessing a random card from the corp's hand
				player_credits += 1
				output_text.append_text("[color=#00ff00]Found 1 credit in the system.[/color]\n")
			"archives":
				output_text.append_text("Accessing Archives...\n")
				# Simulate viewing all cards in archives
				output_text.append_text("[color=#aaaaaa]No valuable data found.[/color]\n")
	else:
		output_text.append_text("[color=#ff5555]RUN FAILED![/color]\n")
		output_text.append_text("Encountered ICE. Jack out initiated.\n")
	
	_update_status_bar()

func _cmd_end_turn():
	if current_phase != GamePhase.ACTION and current_phase != GamePhase.DISCARD:
		output_text.append_text("[color=#ff5555]ERROR: Cannot end turn during " + _get_phase_name(current_phase) + "[/color]\n")
		return
	
	if hand_cards.size() > 5:
		output_text.append_text("[color=#ff5555]ERROR: Must discard down to 5 cards before ending turn[/color]\n")
		output_text.append_text("[color=#aaaaaa]Use: discard <number> to remove unwanted files[/color]\n")
		current_phase = GamePhase.DISCARD
		_update_status_bar()
		return
	
	output_text.append_text("[color=#00ffff]ENDING TURN " + str(turn_number) + "[/color]\n")
	
	# Simulate opponent's turn (very basic for now)
	output_text.append_text("\n[color=#ff5555]CORPORATION TURN[/color]\n")
	output_text.append_text("Corp is taking actions...\n")
	await get_tree().create_timer(1.0).timeout
	output_text.append_text("Corp has ended their turn.\n\n")
	
	# Start next turn
	await get_tree().create_timer(0.5).timeout
	start_turn()

func _cmd_discard(args: Array):
	if hand_cards.is_empty():
		output_text.append_text("[color=#ff5555]ERROR: No files in memory to discard[/color]\n")
		return
	
	if args.is_empty():
		output_text.append_text("[color=#ff5555]ERROR: Please specify which file to discard (number)[/color]\n")
		output_text.append_text("[color=#aaaaaa]Example: discard 2[/color]\n")
		output_text.append_text("[color=#aaaaaa]Type 'hand' to see available files[/color]\n")
		return
	
	var index = int(args[0]) - 1  # Convert to 0-based index
	
	if index < 0 or index >= hand_cards.size():
		output_text.append_text("[color=#ff5555]ERROR: Invalid file number. Type 'hand' to see available files[/color]\n")
		return
	
	var card = hand_cards[index]
	hand_cards.remove_at(index)
	
	output_text.append_text("[color=#aaaaaa]Discarded: " + card.name + "[/color]\n")
	
	if current_phase == GamePhase.ACTION:
		# If we're discarding during action phase, it costs a click
		if clicks_remaining > 0:
			clicks_remaining -= 1
			output_text.append_text("Clicks remaining: [color=#ffff00]" + str(clicks_remaining) + "[/color]\n")
	
	_update_status_bar()
	
	# If we were in discard phase and now have 5 or fewer cards, go to end turn
	if current_phase == GamePhase.DISCARD and hand_cards.size() <= 5:
		output_text.append_text("[color=#00ff00]Memory optimized. You can now end your turn.[/color]\n")

func _cmd_info():
	output_text.append_text("[color=#00ffff]GAME INFORMATION[/color]\n")
	output_text.append_text("  Turn: [color=#ffff00]" + str(turn_number) + "[/color]\n")
	output_text.append_text("  Phase: [color=#ffff00]" + _get_phase_name(current_phase) + "[/color]\n")
	output_text.append_text("  Active Player: [color=#ffff00]" + active_player.capitalize() + "[/color]\n")
	output_text.append_text("  Agenda Points - Runner: [color=#ffff00]" + str(runner_agenda_points) + "/" + str(agenda_points_to_win) + "[/color], Corp: [color=#ffff00]" + str(corp_agenda_points) + "/" + str(agenda_points_to_win) + "[/color]\n")
	output_text.append_text("  Cards Remaining - Runner: [color=#ffff00]" + str(runner_cards_remaining) + "[/color], Corp: [color=#ffff00]" + str(corp_cards_remaining) + "[/color]\n")

func _cmd_system():
	output_text.append_text("[color=#00ffff]SYSTEM STATUS[/color]\n")
	output_text.append_text("  Neural Interface: [color=#00ff00]CONNECTED[/color]\n")
	output_text.append_text("  System Integrity: [color=#00ff00]100%[/color]\n")
	output_text.append_text("  Trace Detection: [color=#00ff00]NONE[/color]\n")
	output_text.append_text("  Intrusion Countermeasures: [color=#aaaaaa]0 ACTIVE[/color]\n")
	output_text.append_text("  Connection Encryption: [color=#00ff00]ENABLED[/color]\n")

func _cmd_installed():
	if played_cards.is_empty():
		output_text.append_text("[color=#aaaaaa]No programs currently installed[/color]\n")
		return
	
	output_text.append_text("[color=#00ffff]INSTALLED PROGRAMS:[/color]\n")
	for i in range(played_cards.size()):
		var card = played_cards[i]
		var card_color = _get_card_color(card.card_type)
		
		output_text.append_text("  " + card_color + card.name + "[/color] - " + card.card_type)
		
		# Add additional information based on card type
		if card.card_type.to_lower() in ["program", "icebreaker"]:
			output_text.append_text(" (Mem: " + str(card.memory_units) + ", STR: " + str(card.get("strength", 0)) + ")")
		
		output_text.append_text("\n")

func _cmd_credits():
	output_text.append_text("[color=#00ffff]CREDIT ACCOUNT STATUS[/color]\n")
	output_text.append_text("  Current Balance: [color=#ffff00]" + str(player_credits) + "[/color]\n")
	output_text.append_text("  Credit Income Rate: [color=#ffff00]1 per turn[/color]\n")
	output_text.append_text("  Credit Actions:\n")
	output_text.append_text("    - Use [color=#ffff00]1 click[/color] to gain [color=#ffff00]1 credit[/color] (not implemented yet)\n")

func _cmd_memory():
	output_text.append_text("[color=#00ffff]MEMORY ALLOCATION STATUS[/color]\n")
	output_text.append_text("  Memory Units: [color=#ffff00]" + str(memory_units_used) + "/" + str(memory_units_available) + "[/color]\n")
	
	if not played_cards.is_empty():
		output_text.append_text("  Memory Usage Breakdown:\n")
		var total_memory = 0
		for card in played_cards:
			if card.card_type.to_lower() in ["program", "icebreaker"]:
				var mem_cost = card.get("memory_units", 0)
				total_memory += mem_cost
				output_text.append_text("    - " + card.name + ": [color=#ffff00]" + str(mem_cost) + "[/color] units\n")
		output_text.append_text("  Total Used: [color=#ffff00]" + str(total_memory) + "[/color] units\n")
	else:
		output_text.append_text("  No programs currently using memory\n")

func _get_phase_name(phase: int) -> String:
	match phase:
		GamePhase.SETUP: return "Setup"
		GamePhase.START_TURN: return "Start Turn"
		GamePhase.ACTION: return "Action"
		GamePhase.DISCARD: return "Discard"
		GamePhase.END_TURN: return "End Turn"
		GamePhase.GAME_OVER: return "Game Over"
		_: return "Unknown"

func _input(event):
	# Handle up/down arrow keys for command history
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_UP:
			# Go back in command history
			if command_history.size() > 0 and command_history_index > 0:
				command_history_index -= 1
				command_input.text = command_history[command_history_index]
				command_input.caret_column = command_input.text.length()
				get_viewport().set_input_as_handled()
		elif event.keycode == KEY_DOWN:
			# Go forward in command history
			if command_history.size() > 0 and command_history_index < command_history.size() - 1:
				command_history_index += 1
				command_input.text = command_history[command_history_index]
				command_input.caret_column = command_input.text.length()
			elif command_history.size() > 0 and command_history_index == command_history.size() - 1:
				command_history_index = command_history.size()
				command_input.text = ""
			get_viewport().set_input_as_handled()
