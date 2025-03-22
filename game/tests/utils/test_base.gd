extends Node
class_name TestBase

# Base class for all test cases
# Provides common functionality for testing

var _assertions_passed = 0
var _assertions_failed = 0

func run_tests() -> bool:
	print("Running test: " + name)
	
	# Reset counters
	_assertions_passed = 0
	_assertions_failed = 0
	
	# Call test setup
	if has_method("setup"):
		call("setup")
	
	# Find and run all test_* methods
	var methods = get_method_list()
	for method in methods:
		if method.name.begins_with("test_"):
			print("  Running: " + method.name)
			call(method.name)
	
	# Call test teardown
	if has_method("teardown"):
		call("teardown")
	
	# Report results
	print("  Assertions: %d passed, %d failed" % [_assertions_passed, _assertions_failed])
	
	return _assertions_failed == 0

# Assertion methods
func assert_true(condition: bool, message: String = "") -> bool:
	if condition:
		_assertions_passed += 1
		return true
	else:
		_assertions_failed += 1
		print("    Assertion failed: Expected true but got false - " + message)
		return false

func assert_false(condition: bool, message: String = "") -> bool:
	if not condition:
		_assertions_passed += 1
		return true
	else:
		_assertions_failed += 1
		print("    Assertion failed: Expected false but got true - " + message)
		return false

func assert_equal(expected, actual, message: String = "") -> bool:
	if expected == actual:
		_assertions_passed += 1
		return true
	else:
		_assertions_failed += 1
		print("    Assertion failed: Expected %s but got %s - %s" % [str(expected), str(actual), message])
		return false

func assert_not_equal(expected, actual, message: String = "") -> bool:
	if expected != actual:
		_assertions_passed += 1
		return true
	else:
		_assertions_failed += 1
		print("    Assertion failed: Expected not equal to %s but got %s - %s" % [str(expected), str(actual), message])
		return false

func assert_null(value, message: String = "") -> bool:
	if value == null:
		_assertions_passed += 1
		return true
	else:
		_assertions_failed += 1
		print("    Assertion failed: Expected null but got %s - %s" % [str(value), message])
		return false

func assert_not_null(value, message: String = "") -> bool:
	if value != null:
		_assertions_passed += 1
		return true
	else:
		_assertions_failed += 1
		print("    Assertion failed: Expected not null but got null - " + message)
		return false
