# Testing Framework for Neon Dominance

This directory contains the testing framework for the Neon Dominance project.

## Overview

The testing framework is built using Godot's built-in testing capabilities and follows a structured approach to ensure comprehensive test coverage across all aspects of the game.

## Test Structure

- `unit/`: Unit tests for individual components
- `integration/`: Tests for interactions between components
- `system/`: End-to-end tests for complete game flows
- `performance/`: Tests for performance benchmarks
- `utils/`: Utility scripts for testing

## Running Tests

1. From the Godot editor:
   - Open the project
   - Navigate to the test scene you want to run
   - Press F6 or click the "Play Current Scene" button

2. From the command line (requires Godot CLI):
   ```bash
   godot --path /path/to/project --script tests/run_tests.gd
   ```

## Writing Tests

### Test Case Template

```gdscript
extends Node

func _ready():
    run_tests()

func run_tests():
    print("Starting test: " + name)
    
    # Setup
    var test_passed = true
    
    # Test cases
    test_passed = test_passed and test_case_1()
    test_passed = test_passed and test_case_2()
    
    # Report results
    if test_passed:
        print("Test passed: " + name)
    else:
        print("Test failed: " + name)

func test_case_1():
    # Test implementation
    var expected = true
    var actual = true
    
    if expected == actual:
        print("  Case 1: Passed")
        return true
    else:
        print("  Case 1: Failed - Expected " + str(expected) + " but got " + str(actual))
        return false

func test_case_2():
    # Another test implementation
    return true
```

## Best Practices

1. Each test should be independent and not rely on the state from other tests
2. Use descriptive test names that indicate what is being tested
3. Include both positive and negative test cases
4. Mock external dependencies when necessary
5. Keep tests fast and focused
6. Test edge cases and boundary conditions

## Continuous Integration

Tests are automatically run as part of the CI/CD pipeline. See the `.github/workflows/test.yml` file for details.
