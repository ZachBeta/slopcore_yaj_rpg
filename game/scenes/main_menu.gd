extends Control

func _ready() -> void:
	$VBoxContainer/StartButton.pressed.connect(_on_start_button_pressed)
	$VBoxContainer/OptionsButton.pressed.connect(_on_options_button_pressed)
	$VBoxContainer/QuitButton.pressed.connect(_on_quit_button_pressed)

func _on_start_button_pressed() -> void:
	print("Starting new game...")
	# Will connect to game scene later
	
func _on_options_button_pressed() -> void:
	print("Options menu (not implemented yet)")

func _on_quit_button_pressed() -> void:
	get_tree().quit()
