extends Node
class_name TestBase

# Base class for all test cases in the game
# Provides common functionality for testing

signal test_completed

func _ready():
	print("TestBase ready")

# Run all test methods in this class
func run_all_tests():
	print("Running all tests in " + self.get_class())
	
	# Get all methods in this class
	var methods = []
	for method in get_method_list():
		if method.name.begins_with("test_"):
			methods.append(method.name)
	
	print("Found " + str(methods.size()) + " test methods")
	
	# Run setup before each test
	if has_method("setup"):
		print("Running setup...")
		call("setup")
	
	# Run each test method
	var passed = 0
	var failed = 0
	for method in methods:
		print("Running test: " + method)
		var success = true
		
		# Try to run the test method
		try:
			# Call the test method
			call(method)
			success = true
		catch(error):
			print("Test failed with error: " + str(error))
			success = false
		
		if success:
			print("Test passed: " + method)
			passed += 1
		else:
			print("Test failed: " + method)
			failed += 1
	
	# Run teardown after all tests
	if has_method("teardown"):
		print("Running teardown...")
		call("teardown")
	
	# Print test summary
	print("Test summary:")
	print("  Passed: " + str(passed))
	print("  Failed: " + str(failed))
	print("  Total: " + str(methods.size()))
	
	# Signal that testing is complete
	test_completed.emit()
	
	return failed == 0

# Assert functions for use in tests
func assert_true(condition, message = ""):
	if not condition:
		print("Assertion failed: Expected true, got false. " + message)
		assert(false, message)

func assert_false(condition, message = ""):
	if condition:
		print("Assertion failed: Expected false, got true. " + message)
		assert(false, message)

func assert_equal(expected, actual, message = ""):
	if expected != actual:
		print("Assertion failed: Expected '" + str(expected) + "', got '" + str(actual) + "'. " + message)
		assert(false, message)

func assert_not_equal(expected, actual, message = ""):
	if expected == actual:
		print("Assertion failed: Expected not equal to '" + str(expected) + "'. " + message)
		assert(false, message)

func assert_null(value, message = ""):
	if value != null:
		print("Assertion failed: Expected null, got '" + str(value) + "'. " + message)
		assert(false, message)

func assert_not_null(value, message = ""):
	if value == null:
		print("Assertion failed: Expected not null. " + message)
		assert(false, message)

# Utility method to check if an object has a method
func has_method(method_name):
	for method in get_method_list():
		if method.name == method_name:
			return true
	return false
