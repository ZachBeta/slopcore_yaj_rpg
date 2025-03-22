extends Node

# Game constants
const STARTING_CREDITS = 5
const STARTING_HAND_SIZE = 5

# Player state
var runner_credits: int = STARTING_CREDITS
var corp_credits: int = STARTING_CREDITS

# Game state
var current_turn: String = "runner"  # "runner" or "corp"
var game_phase: String = "setup"     # "setup", "action", "end"

func _ready():
	reset_game()

func reset_game() -> void:
	runner_credits = STARTING_CREDITS
	corp_credits = STARTING_CREDITS
	current_turn = "runner"
	game_phase = "setup"

func change_turn() -> void:
	current_turn = "corp" if current_turn == "runner" else "runner"
	game_phase = "action"
