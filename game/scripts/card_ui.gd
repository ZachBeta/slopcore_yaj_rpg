extends Control
class_name CardUI

# References to UI elements
@onready var background = $Background
@onready var card_name = $MarginContainer/VBoxContainer/CardName
@onready var cost_label = $MarginContainer/VBoxContainer/Cost
@onready var type_label = $MarginContainer/VBoxContainer/Type
@onready var strength_label = $MarginContainer/VBoxContainer/Strength
@onready var card_text = $MarginContainer/VBoxContainer/CardText

# Card data reference
var card_data = null
var is_face_up = true
var is_draggable = true
var original_position = Vector2.ZERO
var is_being_dragged = false
var hover_scale = 1.1
var normal_scale = 1.0
var is_hovered = false

# Card type colors (these match the Card class colors)
var card_colors = {
	"icebreaker": Color(0.2, 0.4, 0.8, 0.7),  # Blue
	"virus": Color(0.8, 0.2, 0.2, 0.7),       # Red
	"resource": Color(0.2, 0.7, 0.2, 0.7),    # Green
	"hardware": Color(0.7, 0.7, 0.2, 0.7),    # Yellow
	"ice": Color(0.3, 0.3, 0.5, 0.7),         # Purple-gray
	"operation": Color(0.6, 0.3, 0.7, 0.7),   # Purple
	"agenda": Color(0.9, 0.7, 0.2, 0.7),      # Gold
	"asset": Color(0.4, 0.6, 0.4, 0.7),       # Green-gray
	"upgrade": Color(0.5, 0.5, 0.8, 0.7)      # Light purple
}

# Signals
signal card_clicked(card)
signal card_dragged(card, position)
signal card_dropped(card, position)
signal card_hovered(card)
signal card_unhovered(card)

func _ready():
	# Store original position
	original_position = position
	
	# Connect mouse events
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)
	
	# If card_data was set before ready, update UI
	if card_data != null:
		update_card_display()

func _input(event):
	if not is_draggable or not is_face_up:
		return
		
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				# Check if click is within this card
				if get_global_rect().has_point(event.position):
					is_being_dragged = true
					emit_signal("card_clicked", self)
			else:
				if is_being_dragged:
					is_being_dragged = false
					emit_signal("card_dropped", self, event.position)
	
	elif event is InputEventMouseMotion and is_being_dragged:
		position = event.position - size / 2
		emit_signal("card_dragged", self, event.position)

func set_card_data(data):
	card_data = data
	if is_inside_tree():
		update_card_display()

func update_card_display():
	if card_data == null:
		return
	
	# Update card information
	card_name.text = card_data.name
	cost_label.text = "Cost: " + str(card_data.cost)
	type_label.text = "Type: " + card_data.card_type
	
	# Only show strength for appropriate card types
	var has_strength = ["icebreaker", "ice", "program"].has(card_data.card_type.to_lower())
	strength_label.visible = has_strength
	if has_strength:
		strength_label.text = "Strength: " + str(card_data.strength)
	
	# Show memory units for runner programs
	if card_data.card_type.to_lower() == "program" or card_data.card_type.to_lower() == "icebreaker":
		var memory_text = "\nMemory: " + str(card_data.memory_units) + " MU"
		card_text.text = memory_text + "\n" + card_data.text
	else:
		card_text.text = card_data.text
	
	# Display ASCII art if available
	if card_data.has("ascii_art") and card_data.ascii_art.size() > 0:
		var ascii_display = ""
		for line in card_data.ascii_art:
			ascii_display += line + "\n"
		if ascii_display != "":
			card_text.text = ascii_display + "\n" + card_text.text
	
	# Apply card type color
	var card_type_lower = card_data.card_type.to_lower()
	if card_colors.has(card_type_lower):
		background.modulate = card_colors[card_type_lower]
	else:
		background.modulate = card_colors.get("resource", Color(0.5, 0.5, 0.5, 0.7))
	
	# Apply any special styling based on installed/rezzed status
	if card_data.is_installed:
		card_name.add_theme_color_override("font_color", Color(0.8, 0.8, 1.0))
	
	if card_data.is_rezzed:
		card_name.add_theme_color_override("font_color", Color(1.0, 0.9, 0.2))

func flip_card(face_up=true):
	is_face_up = face_up
	
	# Show/hide card content based on face up/down
	$MarginContainer.visible = is_face_up
	
	# Change background for face down cards
	if is_face_up:
		update_card_display()
	else:
		background.modulate = Color(0.2, 0.2, 0.3, 1.0)  # Dark blue for face-down cards

func _on_mouse_entered():
	if is_face_up:
		# Scale up card on hover for better visibility
		scale = Vector2(hover_scale, hover_scale)
		is_hovered = true
		emit_signal("card_hovered", self)

func _on_mouse_exited():
	# Return to normal scale
	scale = Vector2(normal_scale, normal_scale)
	is_hovered = false
	emit_signal("card_unhovered", self)
	
func get_card_data():
	return card_data
