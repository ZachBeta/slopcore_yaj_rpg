# Testing with Real THREE.js Objects

This directory contains utilities for testing THREE.js code with real THREE.js objects instead of mocks. This approach provides more accurate and less brittle tests while still maintaining testability in a Node.js environment.

## Benefits of Using Real THREE.js Objects

1. **More accurate tests**: Testing with real THREE.js objects ensures that your tests verify behavior that will actually work in a real browser environment.

2. **Easier maintenance**: When THREE.js updates, your tests won't need to be updated as long as your usage remains compatible.

3. **Better test coverage**: Tests can verify real geometric operations, transformations, and other THREE.js-specific behaviors.

## Test Environment Setup

The test environment is set up in `setup-real-three.js`, which is loaded by Jest for tests matching the `*-real.test.ts` pattern. This setup:

1. Ensures a window object exists
2. Provides mock implementations of browser APIs like requestAnimationFrame
3. Provides a minimal WebGL context for THREE.js to use

## Test Utilities

### ThreeTestEnvironment

`ThreeTestEnvironment` provides a complete environment for testing THREE.js code, including:

- A THREE.js Scene
- A Camera
- An EventEmitter for game events
- Clean resource management

```typescript
import { createTestEnvironment } from '../test/three-test-environment';

// In your test
let testEnv = createTestEnvironment();
let worldManager = new WorldManager(testEnv.scene);

// After your test
testEnv.cleanup();
```

### Utility Functions

The `three-test-utils.ts` file contains utility functions for working with THREE.js in tests:

- `createTestVector`, `createTestColor`: Create common test objects
- `expectVectorClose`, `expectColorClose`: Compare vectors and colors with tolerance
- `createTestMesh`: Create a test mesh for object testing
- `simulateGameUpdates`: Run game update cycles
- `findAllMeshes`: Find all meshes in a scene

## Writing Tests with Real THREE.js

To write tests with real THREE.js objects:

1. Name your test file with a `-real.test.ts` suffix
2. Import the test environment and utilities
3. Use the ThreeTestEnvironment in your tests
4. Clean up resources after each test

Example:

```typescript
import { ThreeTestEnvironment, createTestEnvironment } from '../../test/three-test-environment';
import { expectVectorClose } from '../../test/three-test-utils';

describe('MyComponent with Real THREE.js', () => {
  let testEnv: ThreeTestEnvironment;
  
  beforeEach(() => {
    testEnv = createTestEnvironment();
  });
  
  afterEach(() => {
    testEnv.cleanup();
  });
  
  it('should position objects correctly', () => {
    // Test with real THREE.js objects
    const vector = new THREE.Vector3(1, 2, 3);
    const expected = new THREE.Vector3(1, 2, 3);
    
    expectVectorClose(vector, expected);
  });
});
```

## Hybrid Approach

For some tests, you may need to use a hybrid approach where you mock some browser-specific functionality but use real THREE.js objects:

```typescript
// Mock just the CSS2DRenderer, not all of THREE.js
jest.mock('three/examples/jsm/renderers/CSS2DRenderer', () => {
  return {
    CSS2DObject: jest.fn((element) => ({
      element,
      position: new THREE.Vector3(),
    })),
    CSS2DRenderer: jest.fn(),
  };
});
```

## Running Tests

To run just the real THREE.js tests:

```bash
npm test -- --selectProjects=real-three
``` 