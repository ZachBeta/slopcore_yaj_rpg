# Neon Dominance Project Rules

## bash commands

* run npm from web directory
* prefix the the correct directory for npm stuff so we are guaranteed to be in the correct directory when we run
* prefer ts over js in web

## Testing
* Prefer realistic system tests: Avoid using mocks, use real objects wherever possible in tests
* Use deterministic random seeds in tests for reproducible results
* Terminal-based implementation should be used for testing core gameplay mechanics
* Godot-based implementation should be used for testing UI and rendering features

## Versioning

- Follow [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html): MAJOR.MINOR.PATCH
- Use consistent git tag format: `0.5.1` (without 'v' prefix)
- Keep CHANGELOG.md updated with every version
- Before release, check existing tags with `git tag -l`


## Development
* CLI terminal game implementation should mirror the Godot terminal game interface
* Keep core game logic separate from rendering concerns in both implementations
* Maintain feature parity between CLI and Godot implementations when adding new gameplay features

## OO Design
* Try to keep the classes as SOLID as possible so that they're easy to reason about, have a reasonable abstraction, and are easy to test
* Use consistent naming conventions across Python and GDScript implementations