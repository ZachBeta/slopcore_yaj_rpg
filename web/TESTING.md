# Testing Guidelines for Slopcore YAJ RPG

This document explains how to run tests for the Slopcore YAJ RPG project and describes recent improvements to the testing infrastructure.

## Test Structure

Tests are organized into several projects:

1. **open-world**: Tests for the 3D open world drone flight mechanics
2. **node**: Tests for server-side functionality
3. **dom**: Tests for UI components and browser interactions
4. **default**: Tests for terminal game functionality

## Running Tests

We provide several npm scripts for running tests:

```bash
# Run all tests
npm test

# Run tests with minimal console output
npm run test:quiet

# Run tests for CI environments
npm run test:ci

# Run only open-world module tests 
npm run test:open-world

# Run only server tests
npm run test:server

# Run only UI tests
npm run test:ui

# Run tests with code coverage report
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

## Recent Improvements

### Reduced Console Noise

We've added a utility to silence console output during tests. This makes test output cleaner and more focused on actual test results rather than debug logs.

```typescript
// Example usage in a test file
import { silenceConsole, type ConsoleSilencer } from '../../test/test-utils';

describe('Some Test Suite', () => {
  let consoleControl: ConsoleSilencer;

  beforeEach(() => {
    consoleControl = silenceConsole();
    // ... test setup
  });

  afterEach(() => {
    consoleControl.restore();
    // ... test teardown
  });

  // ... tests
});
```

### Conditional Logging in Player Class

The Player class now uses conditional logging that respects the NODE_ENV environment variable. During tests, logs are suppressed automatically.

```typescript
private log(message: string): void {
  if (process.env.NODE_ENV !== 'test') {
    console.log(message);
  }
}
```

### CI/CD Integration

The GitHub workflow has been updated to run tests for each module separately, making it easier to identify which module has failing tests.

## Socket Testing Improvements

We've made several improvements to the socket testing framework:

1. **Constants for Event Names**: Added `SOCKET_EVENTS` object to eliminate string literals for socket events
2. **Improved Client Tracking**: All socket clients are now tracked and can be cleanly disconnected
3. **Enhanced Cleanup**: Added `disconnectAll()` helper to ensure all clients are properly disconnected
4. **Shorter Timeouts**: Reduced timeouts for faster tests and earlier failure detection
5. **Safety Timeouts**: Added unref'd timeouts to prevent test hangs
6. **Return Values**: Enhanced `connectAndJoinGame()` to return both client and player data
7. **Event Matching**: Fixed tests to match actual server behavior (using player_joined instead of self_data)

## Known Issues

- Tests may occasionally report "worker process has failed to exit gracefully" - this is related to Socket.IO's internal timers
- Running with `--detectOpenHandles` can help identify any resources that aren't being properly closed

## Best Practices

1. **Use Silent Logging**: Always use the silenceConsole utility or similar approaches to prevent console logs from cluttering test output.

2. **Mock External Dependencies**: Make sure to properly mock external dependencies, especially those that interact with the DOM or make network requests.

3. **Isolate Tests**: Each test should be independent and not rely on the state of other tests.

4. **Clean Up After Tests**: Always clean up resources in the afterEach or afterAll blocks to prevent memory leaks.

5. **Focus on Testing Behavior**: Tests should focus on verifying the behavior of the code, not the implementation details.

6. **Always call `disconnectAll()` in afterEach hooks**: This ensures that all socket clients are properly disconnected after each test.

7. **Use the `SOCKET_EVENTS` constants instead of string literals**: This helps prevent typos and makes the code more readable and maintainable.

8. **Keep timeouts short (500ms or less) for faster test runs**: This helps ensure that tests complete quickly and reliably.

9. **Make sure all timeouts are unref'd to allow the process to exit cleanly**: This helps prevent test hangs and ensures that the process can exit cleanly.

10. **Prefer `await` with explicit cleanup over raw Promises**: This helps ensure that resources are properly cleaned up and prevents memory leaks.

## Troubleshooting

If you encounter issues with the tests:

- Make sure you have all dependencies installed (`npm ci`)
- Check that you're using the correct Node.js version (v18+)
- Try running tests with `--silent` flag for cleaner output
- Run specific test modules to isolate issues 