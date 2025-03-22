extends Control

func _ready() -> void:
	$VBoxContainer/StartButton.pressed.connect(_on_start_button_pressed)
	$VBoxContainer/OptionsButton.pressed.connect(_on_options_button_pressed)
	$VBoxContainer/QuitButton.pressed.connect(_on_quit_button_pressed)

func _on_start_button_pressed() -> void:
	print("Starting new game...")
	# Change scene to the game scene
	get_tree().change_scene_to_file("res://scenes/game_scene.tscn")
	
func _on_options_button_pressed() -> void:
	print("Options menu (not implemented yet)")

func _on_quit_button_pressed() -> void:
	get_tree().quit()
