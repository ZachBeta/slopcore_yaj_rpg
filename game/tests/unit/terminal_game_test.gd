extends SceneTree
class_name TerminalGameTest

# Test class for the terminal game functionality
# Tests the command parsing, help system, and game state functions
# Uses real objects instead of mocks for better integration testing

var terminal_game: Control
var output_text: RichTextLabel
var command_input: LineEdit
var output_capture: String = ""
var tests_failed = []
var root_node

func _init():
	print("Terminal Game Test initialized")
	root_node = Node.new()
	get_root().add_child(root_node)
	
	setup()
	run_all_tests()
	
	# Exit after tests complete
	quit()

func setup():
	print("Setting up terminal game test")
	
	# Instantiate the terminal game
	print("Loading terminal game scene")
	var scene_path = "res://game/scenes/terminal_game.tscn"
	var scene = load(scene_path)
	if scene == null:
		print("ERROR: Could not load scene from path: " + scene_path)
		return
	
	terminal_game = scene.instantiate()
	if terminal_game == null:
		print("ERROR: Could not instantiate terminal game scene")
		return
	
	print("Adding terminal game as child")
	root_node.add_child(terminal_game)
	
	# Get references to the important nodes
	print("Getting node references")
	# Using unique_name_in_owner nodes from the scene
	output_text = terminal_game.get_node("%OutputText")
	command_input = terminal_game.get_node("%CommandInput")
	
	if output_text == null:
		print("ERROR: Could not find output_text node")
	if command_input == null:
		print("ERROR: Could not find command_input node")
	
	print("Setup complete")

func teardown():
	print("Tearing down terminal game test")
	if is_instance_valid(terminal_game):
		terminal_game.queue_free()

# Run all test methods in this class
func run_all_tests():
	print("Running all terminal game tests")
	
	# Get all methods in this class
	var methods = []
	for method in get_method_list():
		if method.name.begins_with("test_"):
			methods.append(method.name)
	
	print("Found " + str(methods.size()) + " test methods")
	
	# Run each test method
	var passed = 0
	var failed = 0
	
	for method in methods:
		print("\nRunning test: " + method)
		
		# Call the test method and check for failures
		call(method)
		
		if method in tests_failed:
			print("✗ Test failed: " + method)
			failed += 1
		else:
			print("✓ Test passed: " + method)
			passed += 1
	
	# Print test summary
	print("\nTest summary:")
	print("  Passed: " + str(passed))
	print("  Failed: " + str(failed))
	print("  Total: " + str(methods.size()))
	
	# Call teardown
	teardown()

# Custom function to capture terminal output by simulating a user command
func _process_command_and_capture(command: String) -> String:
	# Clear any previous content
	output_capture = ""
	
	# Save the current text
	var original_text = output_text.text
	
	# Directly call the command submission function
	# This is the same method that gets called when a user types a command and hits enter
	terminal_game._on_command_submitted(command)
	
	# Capture the new output by comparing with original
	output_capture = output_text.text.substr(original_text.length())
	
	return output_capture

# Assertion helpers
func assert_true(condition, message = "", test_name = ""):
	if not condition:
		print("ASSERTION FAILED: Expected true, got false. " + message)
		if test_name != "" and not test_name in tests_failed:
			tests_failed.append(test_name)
		return false
	return true

func assert_equal(expected, actual, message = "", test_name = ""):
	if expected != actual:
		print("ASSERTION FAILED: Expected '" + str(expected) + "', got '" + str(actual) + "'. " + message)
		if test_name != "" and not test_name in tests_failed:
			tests_failed.append(test_name)
		return false
	return true

func assert_not_null(value, message = "", test_name = ""):
	if value == null:
		print("ASSERTION FAILED: Expected not null. " + message)
		if test_name != "" and not test_name in tests_failed:
			tests_failed.append(test_name)
		return false
	return true

# Test basic initialization of the terminal game
func test_initialization():
	var test_name = "test_initialization"
	print("Running " + test_name)
	# Test that the game initializes properly
	assert_not_null(terminal_game, "Terminal game should be initialized", test_name)
	assert_not_null(terminal_game.command_man_pages, "Man pages should be initialized", test_name)
	assert_not_null(terminal_game.valid_commands, "Valid commands should be initialized", test_name)
	
	# Test initial game state values
	assert_equal(5, terminal_game.player_credits, "Player should start with 5 credits", test_name)
	assert_equal(4, terminal_game.memory_units_available, "Player should start with 4 memory units", test_name)
	assert_equal(0, terminal_game.memory_units_used, "Player should start with 0 memory units used", test_name)
	assert_equal("runner", terminal_game.player_side, "Player should start as runner", test_name)

# Test the help command
func test_help_command():
	var test_name = "test_help_command"
	print("Running " + test_name)
	# Capture the output of the help command
	var output = _process_command_and_capture("help")
	
	# Verify output
	assert_true(output.contains("TERMINAL COMMANDS"), "Help output should list available commands", test_name)
	assert_true(output.contains("help"), "Help output should include the help command", test_name)
	assert_true(output.contains("man"), "Help output should include the man command", test_name)
	
	# Test help with specific command
	output = _process_command_and_capture("help run")
	assert_true(output.contains("run"), "Help output should include information about the run command", test_name)
	assert_true(output.contains("Initiate a run"), "Help output should include command description", test_name)

# Test the man command
func test_man_command():
	var test_name = "test_man_command"
	print("Running " + test_name)
	# Test man command for a specific command
	var output = _process_command_and_capture("man help")
	
	# Verify BSD-style documentation
	assert_true(output.contains("NAME"), "Man output should include NAME section", test_name)
	assert_true(output.contains("SYNOPSIS"), "Man output should include SYNOPSIS section", test_name)
	assert_true(output.contains("DESCRIPTION"), "Man output should include DESCRIPTION section", test_name)
	assert_true(output.contains("EXAMPLES"), "Man output should include EXAMPLES section", test_name)
	assert_true(output.contains("SEE ALSO"), "Man output should include SEE ALSO section", test_name)
	
	# Test for specific man page content
	assert_true(output.contains("help - display help information"), 
		"Man output should contain correct NAME information", test_name)

# Test invalid command handling
func test_invalid_command():
	var test_name = "test_invalid_command"
	print("Running " + test_name)
	# Test an invalid command
	var output = _process_command_and_capture("invalid_command")
	
	# Verify error message
	assert_true(output.contains("ERROR: Unknown command"), "Should show error for invalid command", test_name)
	assert_true(output.contains("Type 'help' for available commands"), 
		"Should suggest help command", test_name)

# Test command history functionality
func test_command_history():
	var test_name = "test_command_history"
	print("Running " + test_name)
	# Add some commands to history
	_process_command_and_capture("help")
	_process_command_and_capture("man run")
	_process_command_and_capture("info")
	
	# Test history length
	assert_equal(3, terminal_game.command_history.size(), "Should have 3 commands in history", test_name)
	
	# Test history content
	assert_equal("help", terminal_game.command_history[0], "First command should be help", test_name)
	assert_equal("man run", terminal_game.command_history[1], "Second command should be man run", test_name)
	assert_equal("info", terminal_game.command_history[2], "Third command should be info", test_name)

# Test game state commands
func test_game_state_commands():
	var test_name = "test_game_state_commands"
	print("Running " + test_name)
	# Test info command
	var output = _process_command_and_capture("info")
	assert_true(output.contains("GAME INFORMATION"), "Info command should display game info", test_name)
	
	# Test credits command
	output = _process_command_and_capture("credits")
	assert_true(output.contains("CREDIT ACCOUNT"), "Credits command should display credit info", test_name)
	assert_true(output.contains("5"), "Should display starting credit amount", test_name)
	
	# Test memory command
	output = _process_command_and_capture("memory")
	assert_true(output.contains("MEMORY USAGE"), "Memory command should display memory info", test_name)
	assert_true(output.contains("0/4"), "Should display correct memory usage", test_name)
