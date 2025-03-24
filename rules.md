# Neon Dominance Project Rules

* prefer relative paths in commands so we can avoid issues from changing directories
* the tests need to be run from the web directory where the Jest configuration is correctly set up.
When you run the tests from the web directory, Jest properly uses the TypeScript configuration in web/jest.config.js that we saw earlier, which is configured to use ts-jest for TypeScript files.

## bash commands

* we need to be in the `web` directory to run `npm` commands
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