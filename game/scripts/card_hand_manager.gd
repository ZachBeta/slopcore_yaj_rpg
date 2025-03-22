extends Node2D
class_name CardHandManager

# Card display parameters
@export var card_spacing: int = 30
@export var card_overlap: int = 70
@export var max_hand_width: int = 600
@export var fan_spacing: float = 5.0
@export var fan_rotate_max: float = 5.0
@export var horizontal_layout: bool = true
@export var card_scale: float = 1.0

# Card management
var hand_cards = []
var card_ui_scene = preload("res://scenes/card_ui.tscn")
var card_positions = []
var owner_id: String = ""  # "runner" or "corporation"

# Visual management 
var container = null
var is_compact_view = false

# Signals
signal card_selected(card)
signal card_played(card)

func _ready():
	# Create a container for cards based on layout direction
	if horizontal_layout:
		container = HBoxContainer.new()
	else:
		container = VBoxContainer.new()
	
	container.alignment = BoxContainer.ALIGNMENT_CENTER
	container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	container.set("theme_override_constants/separation", -card_overlap)
	
	# Make the container visible and set its position
	container.position = Vector2(0, 0)
	container.size = Vector2(max_hand_width, 200)
	
	add_child(container)
	
	# Print debug info
	print("CardHandManager ready, container: ", container)

func set_player_owner(id: String):
	owner_id = id

func add_card(card_data):
	# Create card UI instance
	var card_ui = card_ui_scene.instantiate()
	card_ui.set_card_data(card_data)
	card_ui.scale = Vector2(card_scale, card_scale)
	card_ui.visible = true  # Ensure card is visible
	
	# Connect signals
	card_ui.card_clicked.connect(_on_card_clicked)
	card_ui.card_dragged.connect(_on_card_dragged) 
	card_ui.card_dropped.connect(_on_card_dropped)
	card_ui.card_hovered.connect(_on_card_hovered)
	card_ui.card_unhovered.connect(_on_card_unhovered)
	
	# Add to hand
	hand_cards.append(card_ui)
	container.add_child(card_ui)
	
	# Debug info
	print("Added card to hand: ", card_data.name, ", total cards: ", hand_cards.size())
	print("Card visible: ", card_ui.visible, ", Card size: ", card_ui.size)
	
	# Update hand layout
	update_layout()
	
	return card_ui

func add_cards(card_data_array):
	for card_data in card_data_array:
		add_card(card_data)

func remove_card(card_ui):
	if hand_cards.has(card_ui):
		hand_cards.erase(card_ui)
		container.remove_child(card_ui)
		card_ui.queue_free()
		
		# Update layout after removing card
		update_layout()

func clear_hand():
	for card in hand_cards:
		container.remove_child(card)
		card.queue_free()
	
	hand_cards.clear()

func update_layout():
	# Skip if no cards
	if hand_cards.size() == 0:
		return
	
	# Determine card spacing based on hand size and max width
	var actual_spacing = card_spacing
	var card_width = 120 * card_scale  # Default card width
	
	if hand_cards.size() > 0 and is_instance_valid(hand_cards[0]):
		card_width = hand_cards[0].custom_minimum_size.x * card_scale
	
	# Calculate spacing to fit within max width
	var hand_width = (card_width * hand_cards.size()) + (card_spacing * (hand_cards.size() - 1))
	if hand_width > max_hand_width and hand_cards.size() > 1:
		# Use card overlap for compact view
		if is_compact_view:
			container.set("theme_override_constants/separation", -card_overlap)
		else:
			# Adjust spacing to fit max width
			actual_spacing = floor((max_hand_width - card_width * hand_cards.size()) / (hand_cards.size() - 1))
			container.set("theme_override_constants/separation", actual_spacing)
	else:
		# Reset to default spacing
		container.set("theme_override_constants/separation", actual_spacing)
	
	# Add fan effect in horizontal layout
	if horizontal_layout:
		var center_idx = hand_cards.size() / 2.0
		for i in range(hand_cards.size()):
			var card = hand_cards[i]
			# Skip if card is being dragged
			if not is_instance_valid(card) or card.is_being_dragged:
				continue
				
			# Calculate rotation angle for fan effect
			var distance_from_center = i - center_idx
			var rotation_amount = distance_from_center * (fan_rotate_max * PI / 180)
			
			# Apply rotation
			card.rotation = rotation_amount
			
	# Print debug info for layout
	print("Hand layout updated: cards=", hand_cards.size(), ", spacing=", actual_spacing)

func set_compact_view(compact: bool):
	is_compact_view = compact
	update_layout()

func can_play_card(card_ui):
	# Check if player has enough resources to play the card
	var card_data = card_ui.card_data
	
	# TODO: Add proper credit/resource check here based on game state
	# This is a placeholder - we'll assume the player can play any card for now
	return true

func _on_card_clicked(card_ui):
	emit_signal("card_selected", card_ui)

func _on_card_dragged(card_ui, position):
	# Bring the dragged card to front
	container.move_child(card_ui, container.get_child_count() - 1)

func _on_card_dropped(card_ui, position):
	# If dropped in play area, try to play the card
	# This would be determined by checking if position is within play area
	var play_area_rect = Rect2(Vector2(0, 0), Vector2(1000, 300))  # Example play area
	
	if play_area_rect.has_point(position):
		if can_play_card(card_ui):
			emit_signal("card_played", card_ui)
			remove_card(card_ui)
	else:
		# If not played, update layout to reset positions
		update_layout()

func _on_card_hovered(card_ui):
	# Raise the hovered card
	if container.has_node(card_ui.name):
		container.move_child(card_ui, container.get_child_count() - 1)

func _on_card_unhovered(card_ui):
	update_layout()
