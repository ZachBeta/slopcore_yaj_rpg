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
	
	# Allow frames for processing each command
	process_frame.connect(func(): print("Process frame in command sequence"))
	
	# First check the hand
	print("Testing 'hand' command...")
	command_input.text = "hand"
	command_input.text_submitted.emit("hand")
	await process_frame
	
	# Check output contains card information
	var output = output_text.text
	assert_true(output.contains("CURRENT FILES IN MEMORY"), "Hand command should show cards in hand", test_name)
	
	# Draw a card
	print("Testing 'draw' command...")
	command_input.text = "draw"
	command_input.text_submitted.emit("draw")
	await process_frame
	
	# Check output contains draw information
	output = output_text.text
	assert_true(output.contains("File retrieved"), "Draw command should show retrieved file", test_name)
	
	# Install a card (usually the first one)
	print("Testing 'install' command...")
	command_input.text = "install 1"
	command_input.text_submitted.emit("install 1")
	await process_frame
	
	# Check output contains installation information
	output = output_text.text
	assert_true(output.contains("INSTALLING"), "Install command should show installation notice", test_name)
	
	# Check installed programs
	print("Testing 'installed' command...")
	command_input.text = "installed"
	command_input.text_submitted.emit("installed")
	await process_frame
	
	# Check output contains installed programs
	output = output_text.text
	assert_true(output.contains("INSTALLED PROGRAMS"), "Installed command should show installed programs", test_name)
	
	# Run on a server
	print("Testing 'run' command...")
	command_input.text = "run R&D"
	command_input.text_submitted.emit("run R&D")
	await process_frame
	
	# Check output contains run information
	output = output_text.text
	assert_true(output.contains("INITIATING RUN"), "Run command should show run initiation", test_name)
	
	# End turn to see opponent's turn
	print("Testing 'end' command...")
	command_input.text = "end"
	command_input.text_submitted.emit("end")
	await process_frame
	
	# Check output contains end turn information
	output = output_text.text
	assert_true(output.contains("ENDING TURN"), "End command should show turn ending", test_name)
	assert_true(output.contains("CORPORATION TURN"), "Should show opponent's turn", test_name)

# Test the full game flow as specified by the user
func test_full_game_flow():
	var test_name = "test_full_game_flow"
	print("\n==== RUNNING FULL GAME FLOW TEST ====")
	
	# Check startup text
	print("Checking startup text...")
	var output = output_text.text
	assert_true(output.contains("INITIALIZING NEURAL INTERFACE"), "Startup should show initialization message", test_name)
	assert_true(output.contains("WELCOME TO THE NET"), "Startup should show welcome message", test_name)
	
	# Show hand and check cards
	print("Testing 'hand' command...")
	command_input.text = "hand"
	command_input.text_submitted.emit("hand")
	await process_frame
	
	# Check output contains card information
	output = output_text.text
	assert_true(output.contains("CURRENT FILES IN MEMORY"), "Hand command should show cards in hand", test_name)
	print("Hand output verified ✓")
	
	# Draw a card
	print("Testing 'draw' command...")
	command_input.text = "draw"
	command_input.text_submitted.emit("draw")
	await process_frame
	
	# Check output contains draw information
	output = output_text.text
	assert_true(output.contains("File retrieved"), "Draw command should show retrieved file", test_name)
	print("Draw output verified ✓")
	
	# Install a card (the first card)
	print("Testing 'install' command...")
	command_input.text = "install 1"
	command_input.text_submitted.emit("install 1")
	await process_frame
	
	# Check output contains installation information
	output = output_text.text
	assert_true(output.contains("INSTALLING"), "Install command should show installation notice", test_name)
	print("Install output verified ✓")
	
	# Run on a server
	print("Testing 'run' command...")
	command_input.text = "run R&D"
	command_input.text_submitted.emit("run R&D")
	await process_frame
	
	# Check output contains run information and outcome
	output = output_text.text
	assert_true(output.contains("INITIATING RUN ON R&D"), "Run command should show run initiation", test_name)
	assert_true(output.contains("Approaching server"), "Run should show run progress", test_name)
	assert_true(output.contains("RUN SUCCESSFUL") or output.contains("RUN FAILED"), "Run should show outcome", test_name)
	print("Run output verified ✓")
	
	# End turn to see opponent's turn
	print("Testing 'end' command and opponent turn...")
	command_input.text = "end"
	command_input.text_submitted.emit("end")
	await process_frame
	
	# Check output contains end turn information
	output = output_text.text
	assert_true(output.contains("ENDING TURN"), "End command should show turn ending", test_name)
	assert_true(output.contains("CORPORATION TURN"), "Should show opponent's turn", test_name)
	assert_true(output.contains("Corp is taking actions"), "Should show opponent's actions", test_name)
	assert_true(output.contains("Corp has ended their turn"), "Should show opponent's turn ending", test_name)
	print("End turn and opponent turn verified ✓")
	
	print("==== FULL GAME FLOW TEST COMPLETED SUCCESSFULLY ====")
