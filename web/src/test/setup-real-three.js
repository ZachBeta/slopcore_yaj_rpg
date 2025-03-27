/**
 * Setup file for real THREE.js tests
 * 
 * This file is loaded before tests run to set up the test environment
 * for using real THREE.js objects without mocks.
 */

// Make sure we have a window and document in the test environment
if (typeof window === 'undefined') {
  globalThis.window = {};
}

// Basic requestAnimationFrame implementation for animations
globalThis.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

globalThis.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Set up canvas mock for WebGL context
class MockCanvasContext {
  constructor() {
    this.canvas = {
      width: 800,
      height: 600,
      style: {},
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      getBoundingClientRect: () => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600,
      }),
      getContext: (contextType) => {
        if (contextType === '2d') {
          return {
            drawImage: jest.fn(),
            fillRect: jest.fn(),
            clearRect: jest.fn(),
            getImageData: jest.fn(() => ({ data: new Uint8Array(4) })),
            putImageData: jest.fn(),
            createImageData: jest.fn(() => ({ data: new Uint8Array(4) })),
            setTransform: jest.fn(),
            save: jest.fn(),
            restore: jest.fn(),
            scale: jest.fn(),
            translate: jest.fn(),
            transform: jest.fn(),
            rotate: jest.fn(),
            measureText: jest.fn(() => ({ width: 10 })),
            fillText: jest.fn(),
            strokeText: jest.fn(),
            createPattern: jest.fn(),
            createLinearGradient: jest.fn(),
            createRadialGradient: jest.fn(),
            beginPath: jest.fn(),
            closePath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            bezierCurveTo: jest.fn(),
            quadraticCurveTo: jest.fn(),
            arc: jest.fn(),
            arcTo: jest.fn(),
            ellipse: jest.fn(),
            rect: jest.fn(),
            fill: jest.fn(),
            stroke: jest.fn(),
            clip: jest.fn(),
            isPointInPath: jest.fn(),
            isPointInStroke: jest.fn(),
            drawFocusIfNeeded: jest.fn(),
            scrollPathIntoView: jest.fn(),
            createImageBitmap: jest.fn(),
          };
        } else if (contextType === 'webgl' || contextType === 'webgl2') {
          return {
            getContextAttributes: jest.fn(() => ({
              alpha: true,
              antialias: true,
              depth: true,
              failIfMajorPerformanceCaveat: false,
              powerPreference: 'default',
              premultipliedAlpha: true,
              preserveDrawingBuffer: false,
              stencil: true,
            })),
            // WebGL specific methods
            bindBuffer: jest.fn(),
            bindFramebuffer: jest.fn(),
            bindTexture: jest.fn(),
            blendFunc: jest.fn(),
            clear: jest.fn(),
            clearColor: jest.fn(),
            clearDepth: jest.fn(),
            clearStencil: jest.fn(),
            colorMask: jest.fn(),
            disable: jest.fn(),
            drawArrays: jest.fn(),
            drawElements: jest.fn(),
            enable: jest.fn(),
            finish: jest.fn(),
            flush: jest.fn(),
            framebufferRenderbuffer: jest.fn(),
            framebufferTexture2D: jest.fn(),
            frontFace: jest.fn(),
            generateMipmap: jest.fn(),
            getExtension: jest.fn(() => null),
            getParameter: jest.fn(() => null),
            getProgramParameter: jest.fn(() => true),
            getShaderParameter: jest.fn(() => true),
            viewport: jest.fn(),
            useProgram: jest.fn(),
          };
        }
        return null;
      }
    };
  }
}

// Override document.createElement to return a canvas with WebGL context
const originalCreateElement = document.createElement;
document.createElement = (tag) => {
  if (tag.toLowerCase() === 'canvas') {
    const mockCanvas = new MockCanvasContext();
    return mockCanvas.canvas;
  }
  return originalCreateElement(tag);
};

// Message to indicate the environment is using real THREE.js
console.log('Setup real THREE.js test environment');

// Set up a mock window object for THREE.js
beforeAll(() => {
  globalThis.window = {};
  // ... existing code ...
});

// Set up requestAnimationFrame and cancelAnimationFrame
beforeEach(() => {
  globalThis.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 0);
  };

  globalThis.cancelAnimationFrame = (id) => {
    clearTimeout(id);
  };
  // ... existing code ...
}); 