#!/usr/bin/env -S godot --headless --script

extends SceneTree

func _init():
	print("\n=== Starting Test Runner via Command Line ===\n")
	
	# Load and instance the test runner scene
	var test_scene = load("res://tests/test_runner.tscn").instantiate()
	root.add_child(test_scene)
	
	# Wait a moment for tests to complete
	await get_tree().create_timer(0.5).timeout
	
	print("\n=== Tests Complete ===\n")
	quit()
