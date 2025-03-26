#!/usr/bin/env python3
"""
Test runner for Neon Dominance terminal game tests
"""

import unittest
import sys
import os
import time

def run_tests():
    """Find and run all tests in the tests directory"""
    start_time = time.time()
    
    # Add the project root to the Python path
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    
    # Add the terminal_game directory to the path
    terminal_game_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    if terminal_game_dir not in sys.path:
        sys.path.insert(0, terminal_game_dir)
    
    # Print header
    print("\n" + "=" * 70)
    print(" NEON DOMINANCE TERMINAL GAME TEST SUITE ".center(70, "="))
    print("=" * 70 + "\n")
    
    # Discover and run tests
    test_suite = unittest.defaultTestLoader.discover(
        start_dir=os.path.dirname(__file__),
        pattern='test_*.py'
    )
    
    # Run tests with a test runner
    test_runner = unittest.TextTestRunner(verbosity=2)
    result = test_runner.run(test_suite)
    
    # Print summary
    elapsed_time = time.time() - start_time
    print("\n" + "=" * 70)
    print(f" TEST SUMMARY ".center(70, "="))
    print(f"{'Tests run:':25} {result.testsRun}")
    print(f"{'Failures:':25} {len(result.failures)}")
    print(f"{'Errors:':25} {len(result.errors)}")
    print(f"{'Skipped:':25} {len(result.skipped)}")
    print(f"{'Time elapsed:':25} {elapsed_time:.2f} seconds")
    print("=" * 70 + "\n")
    
    # Return exit code based on test results
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    sys.exit(run_tests()) 