# Neon Dominance Project Rules

* use quarternion over euler everywhere
* when we catch an error, make sure the error is at least logged

## bash commands

* long timeouts are a symptom of something else going wrong, we need more assertions
* mock dom is ok, use real objects for everything else
* run npm from web directory
* prefix the the correct directory for npm stuff so we are guaranteed to be in the correct directory when we run
* prefer ts over js in web

## Testing
* Prefer realistic system tests: Avoid using mocks, use real objects wherever possible in tests
* Use deterministic random seeds in tests for reproducible results
* Terminal-based implementation should be used for testing core gameplay mechanics

## Versioning

* make sure the package.json version stays up to date
- Follow [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html): MAJOR.MINOR.PATCH
- Use consistent git tag format: `0.5.1` (without 'v' prefix)
- Keep CHANGELOG.md updated with every version
- Before release, check existing tags with `git tag -l`


## Development
* Keep core game logic separate from rendering concerns in both implementations

## OO Design
* Try to keep the classes as SOLID as possible so that they're easy to reason about, have a reasonable abstraction, and are easy to test
* Use consistent naming conventions across Python and GDScript implementations