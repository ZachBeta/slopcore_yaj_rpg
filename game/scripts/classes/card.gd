class_name Card
extends Resource

@export var card_name: String
@export var card_type: String  # "program", "event", "ice", "agenda"
@export var cost: int
@export var strength: int
@export_multiline var card_text: String

func _init(p_name: String = "", p_type: String = "", p_cost: int = 0, 
		p_strength: int = 0, p_text: String = "") -> void:
	card_name = p_name
	card_type = p_type
	cost = p_cost
	strength = p_strength
	card_text = p_text

func can_play(credits: int) -> bool:
	return credits >= cost
