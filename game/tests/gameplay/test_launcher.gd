extends SceneTree

# This script loads and runs the terminal game playthrough test
# with parameters passed from command line arguments

func _init():
	print("Test Launcher: Initializing...")
	
	# Get command line arguments
	var arguments = OS.get_cmdline_args()
	var scenario = "FULL_GAME"  # Default scenario
	var seed_value = 12345      # Default seed
	
	# Parse command line arguments
	for i in range(arguments.size()):
		var arg = arguments[i]
		
		if arg == "--scenario" and i + 1 < arguments.size():
			scenario = arguments[i + 1]
		elif arg == "--seed" and i + 1 < arguments.size():
			seed_value = int(arguments[i + 1])
	
	print("Test Launcher: Running scenario " + scenario + " with seed " + str(seed_value))
	
	# Load the main test script
	var script_path = "res://game/tests/gameplay/terminal_game_playthrough.gd"
	var script = load(script_path)
	
	if script:
		var test_instance = script.new()
		
		# Set the scenario based on enum value
		match scenario:
			"QUICK_TEST":
				test_instance.CURRENT_SCENARIO = test_instance.ScenarioType.QUICK_TEST
			"INSTALLATION_FOCUS":
				test_instance.CURRENT_SCENARIO = test_instance.ScenarioType.INSTALLATION_FOCUS
			"SERVER_RUN_FOCUS":
				test_instance.CURRENT_SCENARIO = test_instance.ScenarioType.SERVER_RUN_FOCUS
			"FULL_GAME", _:
				test_instance.CURRENT_SCENARIO = test_instance.ScenarioType.FULL_GAME
		
		# Set the random seed
		test_instance.RANDOM_SEED = seed_value
		
		# Add to tree and run
		get_root().add_child(test_instance)
	else:
		print("ERROR: Could not load test script at " + script_path)
		# When extending SceneTree, we can't use get_tree()
		quit(1)
