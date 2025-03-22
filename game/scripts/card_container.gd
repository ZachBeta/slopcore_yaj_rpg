extends Control
class_name CardContainer

# Card display properties
@export var max_visible_cards: int = 5
@export var card_overlap: float = 0.7 # Percentage of the card to overlap (0-1)
@export var horizontal_layout: bool = true # If false, cards stack vertically
@export var card_base_size: Vector2 = Vector2(80, 120)
@export var card_separation: float = 2.0 # Space between cards

# References
var cards = []
var container

func _ready():
	# Create container for cards
	container = HBoxContainer.new() if horizontal_layout else VBoxContainer.new()
	container.size_flags_horizontal = SIZE_EXPAND_FILL
	container.size_flags_vertical = SIZE_EXPAND_FILL
	add_child(container)
	
	# Set container properties for cards
	if horizontal_layout:
		container.alignment = BoxContainer.ALIGNMENT_CENTER_LEFT
	else:
		container.alignment = BoxContainer.ALIGNMENT_CENTER
	
	# Apply custom minimum size based on layout
	if horizontal_layout:
		custom_minimum_size.x = card_base_size.x * (1 + card_overlap * (max_visible_cards - 1))
		custom_minimum_size.y = card_base_size.y
	else:
		custom_minimum_size.x = card_base_size.x
		custom_minimum_size.y = card_base_size.y * (1 + card_overlap * (max_visible_cards - 1))

# Add a card to the container
func add_card(card_node):
	container.add_child(card_node)
	cards.append(card_node)
	
	# Apply positioning and styling
	_update_card_positions()
	
	return card_node

# Remove a card from the container
func remove_card(card_node):
	if container.is_a_parent_of(card_node):
		container.remove_child(card_node)
	
	if cards.has(card_node):
		cards.erase(card_node)
	
	# Update positions after removal
	_update_card_positions()
	
	return card_node

# Clear all cards
func clear_cards():
	for card in cards.duplicate():
		remove_card(card)
	
	cards.clear()

# Get the number of cards
func get_card_count():
	return cards.size()

# Get a card by index
func get_card(index):
	if index >= 0 and index < cards.size():
		return cards[index]
	return null

# Update card positions to create a stacked/overlapped appearance
func _update_card_positions():
	var card_count = cards.size()
	
	# Skip if no cards
	if card_count == 0:
		return
	
	# Calculate overlap amount
	var spacing
	if horizontal_layout:
		spacing = card_base_size.x * (1.0 - card_overlap)
	else:
		spacing = card_base_size.y * (1.0 - card_overlap)
	
	# Apply fixed size with margin
	for i in range(card_count):
		var card = cards[i]
		
		# Set card size
		card.custom_minimum_size = card_base_size
		
		# Set margin for overlap (except first card)
		if i > 0:
			if horizontal_layout:
				card.position.x = spacing * i
			else:
				card.position.y = spacing * i
		
		# Make sure the latest card is shown on top
		card.z_index = i
