extends Control

# Game state variables
var current_player = "runner"  # Starts with the runner
var turn_number = 1
var phase = "action"  # action, discard, cleanup
var actions_remaining = 3
var runner_programs_installed = 0
var neural_damage = 0
var runner_credits = 5
var corp_credits = 5
var compliance_percentage = 50
var consecutive_high_compliance_days = 0

# Card data
var runner_deck = []
var runner_hand = []
var installed_programs = []
var corp_servers = {
	"hq": [],
	"rd": [],
	"archives": [],
	"remote1": [],
	"remote2": [],
	"remote3": []
}

# UI references
@onready var turn_info_label = $VBoxContainer/StatusBar/TurnInfo
@onready var neural_damage_label = $VBoxContainer/StatusBar/NeuralDamage
@onready var credits_label = $VBoxContainer/GameContent/GameLayout/LeftPanel/PlayerInfo/PlayerInfoContent/Credits
@onready var card_count_label = $VBoxContainer/GameContent/GameLayout/LeftPanel/PlayerInfo/PlayerInfoContent/CardCount
@onready var player_type_label = $VBoxContainer/GameContent/GameLayout/LeftPanel/PlayerInfo/PlayerInfoContent/PlayerType
@onready var console_output = $VBoxContainer/GameContent/GameLayout/RightPanel/ConsoleOutput/MarginContainer/VBoxContainer/RichTextLabel

# Card container references
@onready var hand_container = $VBoxContainer/GameContent/GameLayout/GameBoard/BoardContent/RunnerSection/RunnerGrid/Hand/VBoxContainer/HandContainer
@onready var programs_container = $VBoxContainer/GameContent/GameLayout/GameBoard/BoardContent/RunnerSection/RunnerGrid/InstalledPrograms/VBoxContainer/ProgramsContainer
@onready var hq_container = $VBoxContainer/GameContent/GameLayout/GameBoard/BoardContent/CorporationSection/ServerGrid/HQServer/VBoxContainer/HQCardContainer
@onready var rd_container = $VBoxContainer/GameContent/GameLayout/GameBoard/BoardContent/CorporationSection/ServerGrid/RDServer/VBoxContainer/RDCardContainer
@onready var archives_container = $VBoxContainer/GameContent/GameLayout/GameBoard/BoardContent/CorporationSection/ServerGrid/ArchivesServer/VBoxContainer/ArchivesCardContainer
@onready var remote1_container = $VBoxContainer/GameContent/GameLayout/GameBoard/BoardContent/CorporationSection/ServerGrid/RemoteServer1/VBoxContainer/Remote1CardContainer
@onready var remote2_container = $VBoxContainer/GameContent/GameLayout/GameBoard/BoardContent/CorporationSection/ServerGrid/RemoteServer2/VBoxContainer/Remote2CardContainer
@onready var remote3_container = $VBoxContainer/GameContent/GameLayout/GameBoard/BoardContent/CorporationSection/ServerGrid/RemoteServer3/VBoxContainer/Remote3CardContainer

# Button references
@onready var draw_button = $VBoxContainer/GameContent/GameLayout/LeftPanel/ActionButtons/DrawButton
@onready var install_button = $VBoxContainer/GameContent/GameLayout/LeftPanel/ActionButtons/InstallButton
@onready var make_run_button = $VBoxContainer/GameContent/GameLayout/LeftPanel/ActionButtons/MakeRunButton

func _ready():
	# Connect signals
	$VBoxContainer/Header/BackButton.connect("pressed", Callable(self, "_on_back_button_pressed"))
	draw_button.connect("pressed", Callable(self, "_on_draw_button_pressed"))
	install_button.connect("pressed", Callable(self, "_on_install_button_pressed"))
	make_run_button.connect("pressed", Callable(self, "_on_make_run_button_pressed"))
	
	# Initialize the game
	initialize_game()
	update_ui()
	
	# Log welcome message
	log_message("Game Started")
	log_message("Connecting to the Grid...")
	log_message("Welcome, Runner!")
	log_message("Neural Interface Active")

func initialize_game():
	# Create decks
	create_runner_deck()
	
	# Initial draw
	for i in range(5):
		draw_card()
	
	# Set up initial state
	runner_credits = 5
	corp_credits = 5
	turn_number = 1
	actions_remaining = 3
	neural_damage = 0
	compliance_percentage = 50
	consecutive_high_compliance_days = 0
	
	# Create "End Turn" button dynamically
	var end_turn_button = Button.new()
	end_turn_button.text = "End Turn"
	end_turn_button.connect("pressed", Callable(self, "_on_end_turn_pressed"))
	$VBoxContainer/GameContent/GameLayout/LeftPanel/ActionButtons.add_child(end_turn_button)
	
	# Update the UI
	update_ui()

func create_runner_deck():
	# Create a simple deck of 40 cards
	var card_types = ["Icebreaker", "Virus", "Resource", "Hardware"]
	var card_names = ["Corroder", "Gordian Blade", "Pipeline", "Magnum Opus", 
					  "Liberated Account", "Armitage Codebusting", "Diesel", "Sure Gamble"]
	
	for i in range(40):
		var card = {
			"id": i,
			"type": card_types[i % 4],
			"name": card_names[i % 8],
			"cost": (i % 5) + 1,
			"strength": (i % 3) + 1
		}
		runner_deck.append(card)
	
	# Shuffle the deck
	runner_deck.shuffle()

func draw_card():
	if runner_deck.size() > 0:
		var card = runner_deck.pop_back()
		runner_hand.append(card)
		update_hand_display()
		return card
	else:
		log_message("WARNING: Deck empty!")
		return null

func update_hand_display():
	# Clear existing cards
	hand_container.clear_cards()
	
	# Add cards to the hand container
	for card in runner_hand:
		var card_node = create_card_node(card, true)
		hand_container.add_card(card_node)
	
	# Update card count label
	card_count_label.text = "Cards in Deck: " + str(runner_deck.size())

func update_programs_display():
	# Clear existing programs
	programs_container.clear_cards()
	
	# Add installed program cards
	for program in installed_programs:
		var card_node = create_card_node(program, false)
		programs_container.add_card(card_node)

func create_card_node(card_data, is_hand_card):
	# Create a panel for the card
	var card_panel = PanelContainer.new()
	
	# Create a vertical layout for card contents
	var layout = VBoxContainer.new()
	card_panel.add_child(layout)
	
	# Card title
	var title = Label.new()
	title.text = card_data.name
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	layout.add_child(title)
	
	# Card type
	var type_label = Label.new()
	type_label.text = card_data.type
	type_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	layout.add_child(type_label)
	
	# Card cost
	var cost_label = Label.new()
	cost_label.text = "Cost: " + str(card_data.cost)
	cost_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	layout.add_child(cost_label)
	
	# Set card background color based on type
	var bg_color = ColorRect.new()
	bg_color.size_flags_vertical = Control.SIZE_EXPAND_FILL
	
	match card_data.type:
		"Icebreaker":
			bg_color.color = Color(0.2, 0.4, 0.8, 0.5)  # Blue
		"Virus":
			bg_color.color = Color(0.8, 0.2, 0.2, 0.5)  # Red
		"Resource":
			bg_color.color = Color(0.2, 0.7, 0.2, 0.5)  # Green
		"Hardware":
			bg_color.color = Color(0.7, 0.7, 0.2, 0.5)  # Yellow
		_:
			bg_color.color = Color(0.5, 0.5, 0.5, 0.5)  # Gray
	
	layout.add_child(bg_color)
	
	# If this is a hand card, add ability to install it
	if is_hand_card:
		var card_install_button = Button.new()
		card_install_button.text = "Install"
		card_install_button.size_flags_vertical = Control.SIZE_SHRINK_END
		
		# Store card data in button metadata for reference
		card_install_button.set_meta("card_data", card_data)
		card_install_button.connect("pressed", Callable(self, "_on_card_install_pressed").bind(card_install_button))
		
		layout.add_child(card_install_button)
	
	return card_panel

func _on_card_install_pressed(button):
	var card_data = button.get_meta("card_data")
	if actions_remaining > 0 and runner_credits >= card_data.cost:
		# Deduct cost
		runner_credits -= card_data.cost
		actions_remaining -= 1
		
		# Remove from hand
		runner_hand.erase(card_data)
		
		# Add to installed programs
		installed_programs.append(card_data)
		runner_programs_installed += 1
		
		# Update UI
		update_hand_display()
		update_programs_display()
		update_ui()
		
		log_message("Installed " + card_data.name)
		
		# Check win condition
		check_win_conditions()
	else:
		if actions_remaining <= 0:
			log_message("Not enough actions remaining")
		else:
			log_message("Not enough credits to install " + card_data.name)

func _on_draw_button_pressed():
	if current_player == "runner" and actions_remaining > 0:
		var card = draw_card()
		if card:
			actions_remaining -= 1
			log_message("Drew a card: " + card.name)
			update_ui()
	else:
		log_message("Cannot draw: Not your turn or no actions remaining")

func _on_install_button_pressed():
	if current_player == "runner" and actions_remaining > 0 and runner_hand.size() > 0:
		# Show a selection dialog or just install the first card
		if runner_credits >= runner_hand[0].cost:
			var card = runner_hand[0]
			runner_credits -= card.cost
			runner_hand.remove_at(0)
			installed_programs.append(card)
			runner_programs_installed += 1
			actions_remaining -= 1
			
			log_message("Installed " + card.name)
			update_hand_display()
			update_programs_display()
			update_ui()
			
			# Check win condition
			check_win_conditions()
		else:
			log_message("Not enough credits to install")
	else:
		log_message("Cannot install: Not your turn, no actions, or empty hand")

func _on_make_run_button_pressed():
	if current_player == "runner" and actions_remaining > 0:
		# Simulate a run
		actions_remaining -= 1
		
		# Random success or failure
		if randf() > 0.5:  # 50% success chance
			log_message("Run successful! Gained 3 credits.")
			runner_credits += 3
			compliance_percentage -= 10
			compliance_percentage = max(compliance_percentage, 0)  # Ensure it doesn't go below 0
			consecutive_high_compliance_days = 0  # Reset counter on successful run
		else:
			log_message("Run failed! Suffered 1 neural damage.")
			neural_damage += 1
		
		update_ui()
		
		# Check win conditions
		check_win_conditions()
	else:
		log_message("Cannot run: Not your turn or no actions remaining")

func _on_end_turn_pressed():
	# Switch to the other player and reset actions
	if current_player == "runner":
		current_player = "corporation"
		log_message("Corporation turn begins.")
		
		# Automate the corporation's turn
		corporation_turn()
	else:
		current_player = "runner"
		turn_number += 1
		actions_remaining = 3
		runner_credits += 2  # Runner gains 2 credits at start of turn
		log_message("Turn " + str(turn_number) + ": Runner's turn begins.")
		log_message("Gained 2 credits from daily operations.")
	
	update_ui()

func corporation_turn():
	# Simulate the corporation's automated turn
	
	# Corp gains credits
	corp_credits += 3
	log_message("Corporation gained 3 credits from operations.")
	
	# Corp increases compliance
	compliance_percentage += 10
	compliance_percentage = min(compliance_percentage, 100)  # Cap at 100%
	log_message("Population compliance increased to " + str(compliance_percentage) + "%")
	
	# Check if compliance is high
	if compliance_percentage >= 80:
		consecutive_high_compliance_days += 1
		log_message("High compliance maintained for " + str(consecutive_high_compliance_days) + " days.")
	else:
		consecutive_high_compliance_days = 0
	
	# Corp installs ICE on servers
	var server_keys = corp_servers.keys()
	var random_server = server_keys[randi() % server_keys.size()]
	
	if corp_credits >= 2:
		corp_credits -= 2
		
		# Create a simple ICE
		var ice_card = {
			"id": randi(),
			"type": "ICE",
			"name": ["Barrier", "Sentry", "Code Gate"][randi() % 3],
			"cost": 2,
			"strength": randi() % 4 + 1
		}
		
		corp_servers[random_server].append(ice_card)
		log_message("Corporation installed " + ice_card.name + " ICE on " + random_server)
		
		# Update server displays
		update_server_displays()
	
	# End corp turn automatically
	await get_tree().create_timer(1.0).timeout
	_on_end_turn_pressed()

func update_server_displays():
	# Update all server card displays
	hq_container.clear_cards()
	for card in corp_servers.hq:
		hq_container.add_card(create_card_node(card, false))
	
	rd_container.clear_cards()
	for card in corp_servers.rd:
		rd_container.add_card(create_card_node(card, false))
		
	archives_container.clear_cards()
	for card in corp_servers.archives:
		archives_container.add_card(create_card_node(card, false))
		
	remote1_container.clear_cards()
	for card in corp_servers.remote1:
		remote1_container.add_card(create_card_node(card, false))
		
	remote2_container.clear_cards()
	for card in corp_servers.remote2:
		remote2_container.add_card(create_card_node(card, false))
		
	remote3_container.clear_cards()
	for card in corp_servers.remote3:
		remote3_container.add_card(create_card_node(card, false))

func check_win_conditions():
	# Runner wins if they install 5 or more programs (liberate citizen groups)
	if runner_programs_installed >= 5:
		log_message("The Runner has liberated enough citizen groups!")
		log_message("RUNNER WINS")
		show_game_over("Runner Wins!")
		return true
	
	# Corp wins if runner's neural damage reaches 5
	if neural_damage >= 5:
		log_message("Neural Damage Critical! Connection Terminated!")
		log_message("CORPORATION WINS")
		show_game_over("Corporation Wins: Runner Flatlined")
		return true
	
	# Corp wins if they maintain high compliance for 5 days
	if consecutive_high_compliance_days >= 5:
		log_message("The Corporation has maintained control over the population!")
		log_message("CORPORATION WINS")
		show_game_over("Corporation Wins: Population Control Secured")
		return true
	
	return false

func update_ui():
	# Update labels
	turn_info_label.text = "Turn: " + str(turn_number) + " (" + current_player.capitalize() + ")"
	neural_damage_label.text = "Neural Damage: " + str(neural_damage) + " / 5"
	credits_label.text = "Credits: " + str(runner_credits if current_player == "runner" else corp_credits)
	
	# Update player type display
	if current_player == "runner":
		player_type_label.text = "Runner"
		player_type_label.add_theme_color_override("font_color", Color(0.227, 0.698, 0.933))
	else:
		player_type_label.text = "Corporation"
		player_type_label.add_theme_color_override("font_color", Color(0.863, 0.196, 0.184))
	
	# Update button states based on current player
	var is_runner_turn = current_player == "runner"
	draw_button.disabled = !is_runner_turn or actions_remaining <= 0
	install_button.disabled = !is_runner_turn or actions_remaining <= 0 or runner_hand.size() <= 0
	make_run_button.disabled = !is_runner_turn or actions_remaining <= 0

func log_message(message):
	console_output.text += "> " + message + "\n"
	
	# Auto-scroll to bottom
	console_output.scroll_to_line(console_output.get_line_count())

func show_game_over(message):
	# Create a simple game over dialog
	var dialog = AcceptDialog.new()
	dialog.title = "Game Over"
	dialog.dialog_text = message
	dialog.connect("confirmed", Callable(self, "_on_back_button_pressed"))
	add_child(dialog)
	dialog.popup_centered()

func _on_back_button_pressed():
	# Return to main menu
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
