extends Resource
class_name Card

# Card identification
@export var id: String
@export var name: String
@export var card_type: String  # Icebreaker, Virus, Hardware, Resource, ICE, etc.
@export var subtype: String    # Optional: Fracter, Killer, Barrier, etc.
@export var faction: String    # Runner faction or Corporation division
@export_multiline var text: String  # Card text/ability description

# Card costs and stats
@export var cost: int
@export var strength: int = 0  # Used for programs and ICE
@export var memory_units: int = 0  # For runner programs
@export var trash_cost: int = 0  # For corporation assets/upgrades
@export var advancement_requirement: int = 0  # For agendas
@export var agenda_points: int = 0  # For agendas

# Ownership and gameplay state
@export var owner_id: String  # "runner" or "corporation"
@export var is_installed: bool = false
@export var is_rezzed: bool = false  # For corp cards
@export var hosted_cards: Array[Card] = []
@export var counters: Dictionary = {}  # Various counters: virus, power, advancement, etc.

# Visuals
@export var art_path: String
@export var color: Color

# Card generation and instantiation
func _init(card_data: Dictionary = {}) -> void:
	if card_data.is_empty():
		return
		
	# Set basic properties
	id = card_data.get("id", "")
	name = card_data.get("name", "Unknown Card")
	card_type = card_data.get("type", "")
	subtype = card_data.get("subtype", "")
	faction = card_data.get("faction", "")
	text = card_data.get("text", "")
	
	# Set costs and stats
	cost = card_data.get("cost", 0)
	strength = card_data.get("strength", 0)
	memory_units = card_data.get("memory_units", 0)
	trash_cost = card_data.get("trash_cost", 0)
	advancement_requirement = card_data.get("advancement_requirement", 0)
	agenda_points = card_data.get("agenda_points", 0)
	
	# Set owner
	owner_id = card_data.get("owner_id", "")
	
	# Set the art path if provided
	art_path = card_data.get("art_path", "")
	
	# Set card color based on type
	color = get_color_for_type(card_type)

# Get appropriate card color based on type
func get_color_for_type(type: String) -> Color:
	match type.to_lower():
		"icebreaker":
			return Color(0.2, 0.4, 0.8, 0.5)  # Blue
		"virus":
			return Color(0.8, 0.2, 0.2, 0.5)  # Red
		"resource":
			return Color(0.2, 0.7, 0.2, 0.5)  # Green
		"hardware":
			return Color(0.7, 0.7, 0.2, 0.5)  # Yellow
		"ice":
			return Color(0.3, 0.3, 0.5, 0.5)  # Purple-gray
		"agenda":
			return Color(0.8, 0.2, 0.8, 0.5)  # Purple
		"asset":
			return Color(0.6, 0.4, 0.2, 0.5)  # Brown
		"operation":
			return Color(0.8, 0.5, 0.2, 0.5)  # Orange
		"upgrade":
			return Color(0.4, 0.4, 0.6, 0.5)  # Slate
		_:
			return Color(0.5, 0.5, 0.5, 0.5)  # Gray (default)

# Create a visual representation of the card
func create_visual() -> Control:
	# Create a panel for the card
	var card_panel = PanelContainer.new()
	
	# Create a vertical layout for card contents
	var layout = VBoxContainer.new()
	card_panel.add_child(layout)
	
	# Card title
	var title = Label.new()
	title.text = name
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_color_override("font_color", Color.BLACK)
	layout.add_child(title)
	
	# Cost indicator in top-left
	var cost_container = MarginContainer.new()
	cost_container.size_flags_horizontal = Control.SIZE_FILL
	layout.add_child(cost_container)
	
	var cost_label = Label.new()
	cost_label.text = str(cost)
	cost_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	cost_label.add_theme_color_override("font_color", Color.BLACK)
	cost_container.add_child(cost_label)
	
	# Card type
	var type_label = Label.new()
	type_label.text = card_type
	if subtype:
		type_label.text += ": " + subtype
	type_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	type_label.add_theme_color_override("font_color", Color.BLACK)
	layout.add_child(type_label)
	
	# Card text (ability)
	if text:
		var text_label = RichTextLabel.new()
		text_label.bbcode_enabled = true
		text_label.text = text
		text_label.fit_content = true
		text_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
		text_label.add_theme_color_override("default_color", Color.BLACK)
		layout.add_child(text_label)
	
	# Card stats at bottom (if applicable)
	if strength > 0 or memory_units > 0:
		var stats_container = HBoxContainer.new()
		stats_container.size_flags_horizontal = Control.SIZE_FILL
		stats_container.alignment = BoxContainer.ALIGNMENT_END
		layout.add_child(stats_container)
		
		if strength > 0:
			var strength_label = Label.new()
			strength_label.text = "Strength: " + str(strength)
			strength_label.add_theme_color_override("font_color", Color.BLACK)
			stats_container.add_child(strength_label)
		
		if memory_units > 0:
			var mu_label = Label.new()
			mu_label.text = "MU: " + str(memory_units)
			mu_label.add_theme_color_override("font_color", Color.BLACK)
			stats_container.add_child(mu_label)
	
	# Set card background color
	var bg_color = ColorRect.new()
	bg_color.color = color
	bg_color.size_flags_vertical = Control.SIZE_EXPAND_FILL
	bg_color.show_behind_parent = true
	card_panel.add_child(bg_color)
	bg_color.move_to_back()
	
	return card_panel

# Check if the card can be played/installed
func can_play(player_credits: int, actions_remaining: int) -> bool:
	return player_credits >= cost and actions_remaining > 0

# Card ability handling - override in derived classes or handle with signals
func on_install() -> void:
	is_installed = true
	# Add card-specific install effects

# Usage for corp cards
func on_rez(player_credits: int) -> bool:
	if player_credits >= cost:
		is_rezzed = true
		return true
	return false

# Add a counter to the card
func add_counter(counter_type: String, amount: int = 1) -> void:
	if not counters.has(counter_type):
		counters[counter_type] = 0
	counters[counter_type] += amount

# Remove a counter from the card
func remove_counter(counter_type: String, amount: int = 1) -> bool:
	if not counters.has(counter_type) or counters[counter_type] < amount:
		return false
	
	counters[counter_type] -= amount
	if counters[counter_type] <= 0:
		counters.erase(counter_type)
	return true

# Host a card on this card
func host_card(card: Card) -> void:
	hosted_cards.append(card)

# To dictionary for serialization
func to_dict() -> Dictionary:
	return {
		"id": id,
		"name": name,
		"type": card_type,
		"subtype": subtype,
		"faction": faction,
		"text": text,
		"cost": cost,
		"strength": strength,
		"memory_units": memory_units,
		"trash_cost": trash_cost,
		"advancement_requirement": advancement_requirement,
		"agenda_points": agenda_points,
		"is_installed": is_installed,
		"is_rezzed": is_rezzed,
		"counters": counters,
		"owner_id": owner_id
	}
