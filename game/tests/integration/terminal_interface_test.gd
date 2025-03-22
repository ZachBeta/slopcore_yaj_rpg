extends SceneTree
class_name TerminalInterfaceTest

# Integration test for the Terminal Interface
# This tests the full terminal interface in a more integrated way,
# including loading the actual scene and testing real user interactions

var terminal_scene
var command_input: LineEdit
var output_text: RichTextLabel
var tests_failed = []
var root_node

func _init():
	print("Terminal Interface Integration Test initialized")
	
	# Create the root node
	root_node = Node.new()
	get_root().add_child(root_node)
	
	setup()
	run_all_tests()
	
	# Exit after tests complete
	quit()

func setup():
	print("Setting up terminal interface test")
	# Instance the actual terminal scene
	var scene_path = "res://game/scenes/terminal_game.tscn"
	print("Loading scene from: " + scene_path)
	
	var scene = load(scene_path)
	if scene == null:
		print("ERROR: Could not load scene from path: " + scene_path)
		return
		
	terminal_scene = scene.instantiate()
	if terminal_scene == null:
		print("ERROR: Could not instantiate terminal scene")
		return
		
	print("Adding terminal scene as child")
	root_node.add_child(terminal_scene)
	
	# We need to wait a frame for the _ready() function to complete
	print("Waiting for process frame")
	process_frame.connect(func(): print("Process frame occurred"))
	await process_frame
	
	# Get references to the real nodes
	print("Getting node references")
	command_input = terminal_scene.get_node("%CommandInput")
	output_text = terminal_scene.get_node("%OutputText")
	
	print("Setup complete")

func teardown():
	print("Tearing down terminal interface test")
	if is_instance_valid(terminal_scene):
		terminal_scene.queue_free()

# Run all test methods in this class
func run_all_tests():
	print("Running all terminal interface tests")
	
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
		
		# Call the test method
		call(method)
		
		# Check if the test failed
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
	
	# Clean up
	teardown()

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

# Test basic initialization and scene loading
func test_scene_loading():
	var test_name = "test_scene_loading"
	print("Running test_scene_loading")
	assert_not_null(terminal_scene, "Terminal scene should be loaded", test_name)
	assert_not_null(command_input, "Command input should be accessible", test_name)
	assert_not_null(output_text, "Output text should be accessible", test_name)
	
	# Check that the welcome message is displayed
	var output = output_text.text
	assert_true(output.contains("WELCOME TO THE NET"), "Welcome message should be displayed", test_name)
	assert_true(output.contains("Type 'help' for available commands"), "Help instruction should be displayed", test_name)

# Test command submission and response
func test_command_submission():
	var test_name = "test_command_submission"
	print("Running test_command_submission")
	# Enter and submit a command
	command_input.text = "help"
	command_input.text_submitted.emit("help")
	
	# Allow a frame for processing
	process_frame.connect(func(): print("Process frame after help command"))
	await process_frame
	
	# Check output contains help information
	var output = output_text.text
	assert_true(output.contains("Available commands"), "Help command should show available commands", test_name)
	
	# Enter another command
	command_input.text = "man help"
	command_input.text_submitted.emit("man help")
	
	# Allow a frame for processing
	process_frame.connect(func(): print("Process frame after man help command"))
	await process_frame
	
	# Check output contains man page information
	output = output_text.text
	assert_true(output.contains("NAME"), "Man command should show NAME section", test_name)
	assert_true(output.contains("SYNOPSIS"), "Man command should show SYNOPSIS section", test_name)
	assert_true(output.contains("DESCRIPTION"), "Man command should show DESCRIPTION section", test_name)

# Test game state commands interaction
func test_game_state_commands():
	var test_name = "test_game_state_commands"
	print("Running test_game_state_commands")
	# Test the info command
	command_input.text = "info"
	command_input.text_submitted.emit("info")
	
	# Allow a frame for processing
	process_frame.connect(func(): print("Process frame after info command"))
	await process_frame
	
	# Check output contains game information
	var output = output_text.text
	assert_true(output.contains("Game Information"), "Info command should display game info", test_name)
	
	# Test the credits command
	command_input.text = "credits"
	command_input.text_submitted.emit("credits")
	
	# Allow a frame for processing
	process_frame.connect(func(): print("Process frame after credits command"))
	await process_frame
	
	# Check output contains credit information
	output = output_text.text
	assert_true(output.contains("Credit Account"), "Credits command should display credit info", test_name)

# Test multiple command sequence
func test_command_sequence():
	var test_name = "test_command_sequence"
	print("Running test_command_sequence")
	# Run a sequence of commands that would occur in a typical game
	var commands = ["help", "system", "credits", "memory", "man install"]
	
	for cmd in commands:
		command_input.text = cmd
		command_input.text_submitted.emit(cmd)
		process_frame.connect(func(): print("Process frame after " + cmd + " command"))
		await process_frame
	
	# Check that command history contains all commands
	assert_equal(commands.size(), terminal_scene.command_history.size(), 
		"Command history should contain all executed commands", test_name)
	
	# Verify history order
	for i in range(commands.size()):
		assert_equal(commands[i], terminal_scene.command_history[i], 
			"Command history item %d should match" % i, test_name)
	
	# Verify final output contains content from the last command
	var output = output_text.text
	assert_true(output.contains("install"), "Output should contain results from last command", test_name)
	assert_true(output.contains("Installs a program from your hand"), "Manual page content should be shown", test_name)
