# testing
* avoid using mocks, use real objects wherever possible in tests
* use deterministic random seeds in tests for reproducible results
* terminal-based implementation should be used for testing core gameplay mechanics
* Godot-based implementation should be used for testing UI and rendering features

# development
* CLI terminal game implementation should mirror the Godot terminal game interface
* keep core game logic separate from rendering concerns in both implementations
* maintain feature parity between CLI and Godot implementations when adding new gameplay features

# OO design
* try to keep the classes as SOLID as possible so that they're easy to reason about, have a reasonable abstraction, and are easy to test
* use consistent naming conventions across Python and GDScript implementations