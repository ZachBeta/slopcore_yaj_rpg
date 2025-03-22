extends SceneTree

# Test runner script for Neon Dominance
# This script will discover and run all tests in the project

var _tests_run = 0
var _tests_passed = 0
var _tests_failed = 0

func _init():
	print("\n=== Starting Neon Dominance Test Suite ===\n")
	
	# Run all test categories
	run_unit_tests()
	run_integration_tests()
	run_system_tests()
	
	# Report results
	print("\n=== Test Results ===")
	print("Tests run: %d" % _tests_run)
	print("Tests passed: %d" % _tests_passed)
	print("Tests failed: %d" % _tests_failed)
	print("Success rate: %.1f%%" % (float(_tests_passed) / max(1, _tests_run) * 100))
	print("\n=== End of Test Suite ===\n")
	
	# Exit with appropriate code in CI environments
	quit(_tests_failed)

func run_unit_tests():
	print("\n--- Running Unit Tests ---\n")
	var test_files = find_test_files("res://tests/unit/")
	for test_file in test_files:
		run_test_file(test_file)

func run_integration_tests():
	print("\n--- Running Integration Tests ---\n")
	var test_files = find_test_files("res://tests/integration/")
	for test_file in test_files:
		run_test_file(test_file)

func run_system_tests():
	print("\n--- Running System Tests ---\n")
	var test_files = find_test_files("res://tests/system/")
	for test_file in test_files:
		run_test_file(test_file)

func find_test_files(path: String) -> Array:
	var files = []
	var dir = DirAccess.open(path)
	
	if not dir:
		print("Warning: Could not open directory: " + path)
		return files
	
	dir.list_dir_begin()
	var file_name = dir.get_next()
	
	while file_name != "":
		if not dir.current_is_dir() and file_name.ends_with("_test.gd"):
			files.append(path + file_name)
		file_name = dir.get_next()
	
	return files

func run_test_file(file_path: String):
	print("Running test file: " + file_path)
	
	var script = load(file_path)
	if not script:
		print("  Error: Could not load test script: " + file_path)
		_tests_failed += 1
		return
	
	var test_instance = script.new()
	
	# Track test results
	_tests_run += 1
	
	# Run the test
	var result = test_instance.run_tests() if test_instance.has_method("run_tests") else false
	
	if result:
		_tests_passed += 1
		print("  Test passed: " + file_path.get_file())
	else:
		_tests_failed += 1
		print("  Test failed: " + file_path.get_file())
	
	# Clean up
	test_instance.free()
