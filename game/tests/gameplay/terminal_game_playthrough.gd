extends SceneTree
class_name TerminalGamePlaythrough

# Full game playthrough test for Terminal Mode
# This runs through a complete game with scripted moves
# and fixed random seed for reproducible results

# Terminal scene and controls
var terminal_scene
var command_input: LineEdit
var output_text: RichTextLabel
var root_node

# Test configuration
var RANDOM_SEED = 12345  # Consistent seed for reproducible tests
var DISPLAY_TERMINAL_OUTPUT = true  # Set to true to see gameplay in console
var DELAY_BETWEEN_COMMANDS = 0.5  # Seconds between commands
var SCREENSHOT_MODE = false  # Set to true to pause after key moments

# Script scenarios - different sequences of actions
enum ScenarioType {
    QUICK_TEST,       # Basic functionality test
    INSTALLATION_FOCUS, # Focus on installing programs
    SERVER_RUN_FOCUS, # Focus on running servers
    FULL_GAME        # Complete game from start to finish
}

# Current scenario to run
var CURRENT_SCENARIO = ScenarioType.FULL_GAME

# Scripted commands by scenario
var scenario_commands = {
    ScenarioType.QUICK_TEST: [
        "hand",
        "draw",
        "install 1",
        "run R&D",
        "end"
    ],
    
    ScenarioType.INSTALLATION_FOCUS: [
        "hand",
        "draw",
        "install 1",
        "installed",
        "memory",
        "credits",
        "draw",
        "install 2",
        "installed",
        "memory"
    ],
    
    ScenarioType.SERVER_RUN_FOCUS: [
        "hand",
        "draw",
        "install 1",
        "run R&D",
        "run HQ",
        "run Archives",
        "end"
    ],
    
    ScenarioType.FULL_GAME: [
        # Turn 1 - Installation and basic actions
        "help",         # Start with basic help to see available commands
        "system",       # Check system status
        "hand",         # Check initial hand
        "credits",      # Check credits
        "memory",       # Check memory status
        "draw",         # Draw a card (+1 click)
        "hand",         # Check updated hand after drawing
        "install 1",    # Install first card (+3 click)
        "installed",    # Check installed programs
        "memory",       # Check memory status after installation
        "run R&D",      # Run on R&D server (+4 click)
        "end",          # End turn to see corporation's turn
        
        # Turn 2 - More installations and runs
        "hand",         # Check hand after corp turn
        "draw",         # Draw a card (+1 click)
        "install 2",    # Install second card (+2 click)
        "install 3",    # Install third card (+3 click)
        "run HQ",       # Run on HQ server (+4 click)
        "end",          # End turn
        
        # Turn 3 - Economic actions and server run
        "credits",      # Check credit status
        "draw",         # Draw a card (+1 click)
        "draw",         # Draw another card (+2 click)
        "hand",         # Check hand
        "run Archives", # Run archives (+3 click)
        "run R&D",      # Run R&D (+4 click)
        "end"           # End final turn
    ]
}

# The commands to execute for the current scenario
var commands_to_execute = []

func _init():
    print("\n========== NEON DOMINANCE TERMINAL GAME PLAYTHROUGH TEST ==========")
    print("Using random seed: " + str(RANDOM_SEED))
    
    # Set the commands based on selected scenario
    commands_to_execute = scenario_commands[CURRENT_SCENARIO]
    print("Running scenario: " + get_scenario_name(CURRENT_SCENARIO))
    
    # Create the root node
    root_node = Node.new()
    get_root().add_child(root_node)
    
    setup()
    run_playthrough()
    
    # Exit after tests complete
    print("\n========== TEST COMPLETED ==========")
    await get_tree().create_timer(1.0).timeout
    quit()

func get_scenario_name(scenario_type: int) -> String:
    match scenario_type:
        ScenarioType.QUICK_TEST: return "QUICK TEST"
        ScenarioType.INSTALLATION_FOCUS: return "INSTALLATION FOCUS"
        ScenarioType.SERVER_RUN_FOCUS: return "SERVER RUN FOCUS"
        ScenarioType.FULL_GAME: return "FULL GAME"
        _: return "UNKNOWN"

func setup():
    print("\nSetting up terminal game test...")
    
    # Instance the terminal scene
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
    
    # Set the random seed before initialization
    terminal_scene.set_random_seed(RANDOM_SEED)
    
    # Wait a frame for the _ready() function to complete
    await get_tree().process_frame
    
    # Get references to the nodes
    command_input = terminal_scene.get_node("%CommandInput")
    output_text = terminal_scene.get_node("%OutputText")
    
    print("Setup complete - terminal game initialized with seed: " + str(RANDOM_SEED))

func teardown():
    print("Tearing down terminal game test")
    if is_instance_valid(terminal_scene):
        terminal_scene.queue_free()

func run_playthrough():
    print("\n========== BEGINNING PLAYTHROUGH ==========")
    print("Will execute " + str(commands_to_execute.size()) + " commands")
    
    # Display initial terminal content
    if DISPLAY_TERMINAL_OUTPUT:
        print("\n" + "="*50)
        print("INITIAL TERMINAL STATE")
        print("="*50)
        print(output_text.get_text())
        print("="*50 + "\n")
    
    # Execute each command in sequence
    for i in range(commands_to_execute.size()):
        var cmd = commands_to_execute[i]
        print("\n>> EXECUTING COMMAND " + str(i+1) + "/" + str(commands_to_execute.size()) + ": '" + cmd + "'")
        
        # Send the command
        command_input.text = cmd
        command_input.text_submitted.emit(cmd)
        
        # Wait for processing
        await get_tree().create_timer(DELAY_BETWEEN_COMMANDS).timeout
        
        # Display the terminal output after command
        if DISPLAY_TERMINAL_OUTPUT:
            print("\n" + "-"*50)
            print("TERMINAL OUTPUT AFTER '" + cmd + "':")
            print("-"*50)
            
            # Extract the latest content (last 20 lines or less)
            var lines = output_text.get_text().split("\n")
            var start_idx = max(0, lines.size() - 20)
            var recent_output = lines.slice(start_idx).join("\n")
            print(recent_output)
            print("-"*50)
        
        # Pause at key moments if in screenshot mode
        if SCREENSHOT_MODE and is_key_moment(cmd):
            print("\n[PAUSED AT KEY MOMENT: " + cmd + "] Press Enter to continue...")
            OS.alert("Paused at key moment: " + cmd + "\nClick OK to continue...")
    
    print("\n========== PLAYTHROUGH COMMANDS COMPLETED ==========")
    
    # Analyze the game state at the end
    analyze_final_state()
    
    # Allow time to see final state
    await get_tree().create_timer(1.0).timeout
    
    # Clean up
    teardown()

func is_key_moment(cmd: String) -> bool:
    # Commands that represent significant game state changes
    var key_commands = ["run", "install", "end"]
    
    for key in key_commands:
        if cmd.begins_with(key):
            return true
    
    return false

func analyze_final_state():
    print("\n========== FINAL GAME STATE ANALYSIS ==========")
    
    # Get key game state information
    var credits = terminal_scene.player_credits
    var memory_used = terminal_scene.memory_units_used
    var memory_total = terminal_scene.memory_units_available
    var hand_size = terminal_scene.hand_cards.size()
    var installed_size = terminal_scene.played_cards.size()
    
    print("Player Credits: " + str(credits))
    print("Memory Usage: " + str(memory_used) + "/" + str(memory_total))
    print("Cards in Hand: " + str(hand_size))
    print("Installed Cards: " + str(installed_size))
    
    # List installed cards
    if installed_size > 0:
        print("\nInstalled Programs:")
        for i in range(installed_size):
            var card = terminal_scene.played_cards[i]
            print("  " + str(i+1) + ". " + card.name + " (" + card.card_type + ")")
    
    print("="*50)

# Entry point when running script directly
func _main():
    # This function is called when the script is the main script
    print("Starting terminal game playthrough test...")
