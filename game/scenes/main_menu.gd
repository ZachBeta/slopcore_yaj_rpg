extends Control

func _ready() -> void:
	$VBoxContainer/StartButton.pressed.connect(_on_start_button_pressed)
	$VBoxContainer/QuitButton.pressed.connect(_on_quit_button_pressed)

func _on_start_button_pressed() -> void:
	# Change to game scene when implemented
	print("Starting new game...")
	GameState.reset_game()

func _on_quit_button_pressed() -> void:
	get_tree().quit()
