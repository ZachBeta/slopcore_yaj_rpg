extends Control

# References to UI elements
@onready var draw_button = $VBoxContainer/HSplitContainer/LeftPanel/MarginContainer/VBoxContainer/DrawCardButton
@onready var play_button = $VBoxContainer/HSplitContainer/LeftPanel/MarginContainer/VBoxContainer/PlayCardButton
@onready var discard_button = $VBoxContainer/HSplitContainer/LeftPanel/MarginContainer/VBoxContainer/DiscardButton
@onready var toggle_view_button = $VBoxContainer/HSplitContainer/LeftPanel/MarginContainer/VBoxContainer/ToggleViewButton
@onready var card_info_label = $VBoxContainer/HSplitContainer/LeftPanel/MarginContainer/VBoxContainer/CardInfoLabel
@onready var hand_container = $VBoxContainer/HSplitContainer/MainPanel/MarginContainer/VBoxContainer/HandArea/HandContainer
@onready var play_area = $VBoxContainer/HSplitContainer/MainPanel/MarginContainer/VBoxContainer/PlayArea

# Game management
var deck_manager
var hand_manager
var selected_card = null
var played_cards = []
var is_compact_view = false

func _ready():
	# Setup the deck manager
	deck_manager = load("res://scripts/deck_manager.gd").new()
	deck_manager.create_default_definitions()
	deck_manager.create_default_runner_deck()
	deck_manager.create_default_corp_deck()
	
	# Setup the hand manager 
	hand_manager = CardHandManager.new()
	hand_manager.set_player_owner("runner")
	
	# Make sure hand container has the correct size and visibility
	hand_container.custom_minimum_size = Vector2(600, 200)
	
	# Add hand manager to the container
	hand_container.add_child(hand_manager)
	
	# Position hand manager at the center of the container
	hand_manager.position = Vector2(hand_container.size.x / 2, hand_container.size.y / 2)
	hand_manager.max_hand_width = hand_container.size.x - 40
	
	# Debug information
	print("Hand container size: ", hand_container.size)
	print("Hand manager position: ", hand_manager.position)
	
	# Connect signals
	hand_manager.card_selected.connect(_on_card_selected)
	hand_manager.card_played.connect(_on_card_played)
	
	draw_button.pressed.connect(_on_draw_button_pressed)
	play_button.pressed.connect(_on_play_button_pressed)
	discard_button.pressed.connect(_on_discard_button_pressed)
	toggle_view_button.pressed.connect(_on_toggle_view_button_pressed)
	
	# Start with a few cards
	for i in range(5):
		_on_draw_button_pressed()

func _process(delta):
	# Update hand manager width based on container size
	if hand_manager and is_instance_valid(hand_manager) and hand_container:
		hand_manager.max_hand_width = hand_container.size.x - 20

func _on_draw_button_pressed():
	var card_data = deck_manager.draw_card("runner")
	if card_data:
		var card_ui = hand_manager.add_card(card_data)
		print("Drew card: ", card_data.name)
	else:
		print("No more cards in deck")

func _on_play_button_pressed():
	if selected_card:
		_play_card(selected_card)

func _on_discard_button_pressed():
	if selected_card:
		hand_manager.remove_card(selected_card)
		selected_card = null
		update_card_info(null)

func _on_toggle_view_button_pressed():
	is_compact_view = !is_compact_view
	hand_manager.set_compact_view(is_compact_view)
	
	if is_compact_view:
		toggle_view_button.text = "Switch to Normal View"
	else:
		toggle_view_button.text = "Switch to Compact View"

func _on_card_selected(card_ui):
	selected_card = card_ui
	update_card_info(card_ui.get_card_data())

func _on_card_played(card_ui):
	_play_card(card_ui)

func _play_card(card_ui):
	var card_data = card_ui.get_card_data()
	
	# Create a new card for the play area
	var played_card = load("res://scenes/card_ui.tscn").instantiate()
	played_card.set_card_data(card_data)
	played_card.position = Vector2(50 + played_cards.size() * 130, 50)
	played_card.scale = Vector2(0.8, 0.8)
	played_card.is_draggable = false
	
	# Add to play area
	play_area.add_child(played_card)
	played_cards.append(played_card)
	
	# Remove from hand
	if card_ui == selected_card:
		selected_card = null
		update_card_info(null)

func update_card_info(card_data):
	if card_data:
		var text = "[center][b]Card Info: %s[/b][/center]\n" % card_data.name
		text += "[b]Type:[/b] %s\n" % card_data.card_type
		text += "[b]Cost:[/b] %d\n" % card_data.cost
		
		if card_data.card_type.to_lower() in ["icebreaker", "program", "ice"]:
			text += "[b]Strength:[/b] %d\n" % card_data.strength
		
		if card_data.card_type.to_lower() in ["icebreaker", "program"]:
			text += "[b]Memory:[/b] %d MU\n" % card_data.memory_units
		
		text += "\n[b]Card Text:[/b]\n%s" % card_data.text
		
		card_info_label.text = text
	else:
		card_info_label.text = "[center][b]Card Info[/b][/center]\nSelect a card to view details."
