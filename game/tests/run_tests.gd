extends SceneTree

# Main test runner script that discovers and runs all tests in the project
# This script should be executed with: godot --headless --script res://game/tests/run_tests.gd

var test_count = 0
var tests_passed = 0
var tests_failed = 0
var current_test = null

func _init():
	print("\n========================================")
	print("      NEON DOMINANCE TEST RUNNER        ")
	print("========================================\n")
	
	# Discover and run all tests
	print("Discovering tests...")
	
	# Find and run unit tests
	print("\n[UNIT TESTS]")
	var unit_dir = "res://game/tests/unit"
	run_tests_in_directory(unit_dir)
	
	# Find and run integration tests
	print("\n[INTEGRATION TESTS]")
	var integration_dir = "res://game/tests/integration"
	run_tests_in_directory(integration_dir)
	
	# Print overall results
	print("\n========================================")
	print("           TEST RESULTS                ")
	print("========================================")
	print("Tests run:  " + str(test_count))
	print("Passed:     " + str(tests_passed))
	print("Failed:     " + str(tests_failed))
	print("========================================\n")
	
	# Exit with appropriate code
	quit(0 if tests_failed == 0 else 1)

# Run all tests in a directory
func run_tests_in_directory(dir_path):
	var dir = DirAccess.open(dir_path)
	if dir == null:
		print("Error: Could not open directory: " + dir_path)
		return
	
	dir.list_dir_begin()
	var file_name = dir.get_next()
	
	while file_name != "":
		if !file_name.begins_with(".") and file_name.ends_with(".gd"):
			var path = dir_path + "/" + file_name
			print("\nRunning test file: " + path)
			run_test_file(path)
		
		file_name = dir.get_next()
	
	dir.list_dir_end()

# Run a specific test file
func run_test_file(file_path):
	var script = load(file_path)
	if script == null:
		print("Error: Could not load script: " + file_path)
		tests_failed += 1
		return
	
	# Check if this is a test script (must have class_name ending with "Test")
	var script_class_name = script.get_path().get_file().get_basename()
	if not script_class_name.ends_with("_test"):
		print("Skipping non-test script: " + file_path)
		return
	
	print("Instantiating test: " + script_class_name)
	
	# Create a new instance of the test
	var test_instance = script.new()
	test_count += 1
	current_test = test_instance
	
	# The test instance should be a node that we can add to the scene tree
	if test_instance is Node:
		# Add the test to the root so it can properly execute
		get_root().add_child(test_instance)
		
		print("Running tests for: " + script_class_name)
		
		# Connect to the test_completed signal if available
		if test_instance.has_signal("test_completed"):
			test_instance.test_completed.connect(_on_test_completed)
		
		# Run the tests
		var success = false
		if test_instance.has_method("run_all_tests"):
			success = test_instance.run_all_tests()
		else:
			print("Error: Test does not have run_all_tests method")
			success = false
		
		# Record results
		if success:
			tests_passed += 1
			print("✓ " + script_class_name + " PASSED")
		else:
			tests_failed += 1
			print("✗ " + script_class_name + " FAILED")
		
		# Clean up
		test_instance.queue_free()
	else:
		print("Error: Test instance is not a Node")
		tests_failed += 1

# Called when a test is completed
func _on_test_completed():
	print("Test completed signal received")
