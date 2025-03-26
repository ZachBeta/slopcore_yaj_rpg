# Color Management System

## Current Implementation

### Color Pool System
- Predefined pool of visually distinct colors
- Primary colors (Red, Green, Blue)
- Secondary colors (Yellow, Cyan, Magenta)
- Tertiary colors and additional variations
- Colors are locked while in use and recycled on disconnect
- Uses RGB color space with values between 0-1
- Color uniqueness determined by Euclidean distance > 0.3

### Color Assignment Strategy
1. Try to assign from predefined pool first
   ```javascript
   // Example from current implementation
   if (this.availableColors.length > 0) {
     const colorIndex = Math.floor(Math.random() * this.availableColors.length);
     const color = this.availableColors[colorIndex];
     this.availableColors.splice(colorIndex, 1);
     return color;
   }
   ```

2. If pool is exhausted, generate random colors with constraints:
   - Minimum brightness (0.3)
   - Normalized for vibrancy
   - Minimum distance from existing colors (0.3)
   ```javascript
   // Color distance calculation
   const getColorDistance = (c1, c2) => Math.sqrt(
     Math.pow(c1.r - c2.r, 2) +
     Math.pow(c1.g - c2.g, 2) +
     Math.pow(c1.b - c2.b, 2)
   );
   ```

3. Last resort: Modify a base color from pool
   - Applies random variation to existing colors
   - Maintains some visual consistency with base colors

### Data Structures
- `colorPool`: Array of predefined colors (immutable)
- `availableColors`: Working copy of pool (mutable)
- `lockedColors`: Map of socket.id to active colors
- Color format: `{ r: number, g: number, b: number }`

### Test Coverage
- `color-management.test.js` covers:
  - Unique color assignment from pool
  - Color recycling on disconnect
  - Random color generation when pool exhausted
  - Rapid connection handling
  - Color locking during player lifetime

## Known Issues

### Memory Management
1. Potential memory leak observed during testing
   - RAM utilization creeping up during extended test runs
   - May be related to socket connections or color management
   - Need to investigate socket cleanup and color state management

#### Debugging Steps
1. Run with Node.js memory profiling:
   ```bash
   # Generate heap snapshot
   node --heap-prof test/color-management.test.js

   # Run with memory inspector
   node --inspect test/color-management.test.js
   ```

2. Monitor memory usage during tests:
   ```bash
   # Using node-memwatch
   npm install --save-dev @airbnb/node-memwatch
   ```

3. Check for leaked event listeners:
   ```javascript
   // Add to test setup
   require('events').EventEmitter.defaultMaxListeners = 15;
   ```

### Race Conditions
1. Color Assignment
   - Possible race condition during rapid connections
   - Current mitigation: Wait time between operations
   - Need more robust locking mechanism

#### Proposed Solutions
1. Implement async mutex:
   ```javascript
   const mutex = new AsyncMutex();
   
   async generatePlayerColor() {
     const release = await mutex.acquire();
     try {
       // Color assignment logic
     } finally {
       release();
     }
   }
   ```

2. Queue-based assignment:
   ```javascript
   const colorQueue = new AsyncQueue();
   // Process one color request at a time
   ```

### Test Improvements Needed
1. Reduce verbosity
   - Currently generates excessive console output
   - Need to focus on essential logging
   ```javascript
   // Add selective logging
   const DEBUG = process.env.DEBUG === 'true';
   const log = DEBUG ? console.log : () => {};
   ```

2. Stability
   - Tests occasionally timeout
   - Need to improve cleanup between tests
   - Add proper teardown for sockets

3. Coverage
   - Add stress tests for memory leaks
   - Test color recycling under load
   - Test concurrent disconnects

## Next Steps

### Immediate
1. Restart development environment
2. Run memory profiling to identify leaks:
   ```bash
   # Install clinic.js
   npm install -g clinic
   # Run profiling
   clinic doctor -- node test/color-management.test.js
   ```
3. Improve test stability

### Short Term
1. Implement proper mutex for color assignment
   - Use `async-mutex` or similar library
   - Add request queuing for color assignments
2. Add better cleanup in disconnect handlers
   - Ensure all event listeners are removed
   - Properly clear color locks
3. Improve error handling in color assignment
   - Add timeout for color assignment
   - Handle edge cases (no colors available)

### Long Term
1. Consider alternative color management strategies:
   - HSL color space for better distinction
   ```javascript
   // Convert RGB to HSL for better control
   const rgbToHsl = (r, g, b) => {
     // Implementation
   };
   ```
   - Dynamic color pool sizing
   - Color preference system

2. Add monitoring for:
   - Color assignment patterns
   - Connection/disconnection rates
   - Memory usage
   ```javascript
   // Example monitoring
   setInterval(() => {
     const used = process.memoryUsage();
     log({
       rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
       heap: `${Math.round(used.heapUsed / 1024 / 1024)}MB`
     });
   }, 30000);
   ```

## Testing Instructions

```bash
# Run color management tests
npm test -- color-management.test.js --detectOpenHandles --silent

# For debugging
npm test -- color-management.test.js --detectOpenHandles --verbose

# Memory profiling
npm test -- --expose-gc color-management.test.js

# Run with increased memory
node --max-old-space-size=4096 node_modules/.bin/jest color-management.test.js
```

## References
- Current implementation in `game-server.js`
- Test suite in `color-management.test.js`
- Color distance calculation using RGB Euclidean distance
- [Socket.IO documentation](https://socket.io/docs/v4/)
- [Jest testing framework](https://jestjs.io/docs/getting-started)
- [Node.js memory profiling](https://nodejs.org/en/docs/guides/diagnostics/memory/using-heap-snapshot) 