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

## Best Practices

1. **Use Silent Logging**: Always use the silenceConsole utility or similar approaches to prevent console logs from cluttering test output.

2. **Mock External Dependencies**: Make sure to properly mock external dependencies, especially those that interact with the DOM or make network requests.

3. **Isolate Tests**: Each test should be independent and not rely on the state of other tests.

4. **Clean Up After Tests**: Always clean up resources in the afterEach or afterAll blocks to prevent memory leaks.

5. **Focus on Testing Behavior**: Tests should focus on verifying the behavior of the code, not the implementation details.

## Troubleshooting

If you encounter issues with the tests:

- Make sure you have all dependencies installed (`npm ci`)
- Check that you're using the correct Node.js version (v18+)
- Try running tests with `--silent` flag for cleaner output
- Run specific test modules to isolate issues 