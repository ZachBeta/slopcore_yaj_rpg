import * as THREE from 'three';
import { EventEmitter } from 'events';
import { ThreeTestEnvironment } from './three-test-environment';

/**
 * Creates a test vector for position comparison
 */
export function createTestVector(x = 0, y = 0, z = 0): THREE.Vector3 {
  return new THREE.Vector3(x, y, z);
}

/**
 * Creates a test color for material testing
 */
export function createTestColor(r = 1, g = 1, b = 1): THREE.Color {
  return new THREE.Color(r, g, b);
}

/**
 * Helper to test if two positions are approximately equal
 */
export function expectVectorClose(
  actual: THREE.Vector3, 
  expected: THREE.Vector3, 
  precision = 0.001
): void {
  expect(actual.x).toBeCloseTo(expected.x, precision);
  expect(actual.y).toBeCloseTo(expected.y, precision);
  expect(actual.z).toBeCloseTo(expected.z, precision);
}

/**
 * Helper to test if two colors are approximately equal
 */
export function expectColorClose(
  actual: THREE.Color, 
  expected: THREE.Color,
  precision = 0.001
): void {
  expect(actual.r).toBeCloseTo(expected.r, precision);
  expect(actual.g).toBeCloseTo(expected.g, precision);
  expect(actual.b).toBeCloseTo(expected.b, precision);
}

/**
 * Creates a test mesh for object testing
 */
export function createTestMesh(
  position = new THREE.Vector3(0, 0, 0),
  color = new THREE.Color(1, 1, 1),
  size = 1
): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  return mesh;
}

/**
 * Simulates game update cycles
 * @param objects Array of objects to update (must have update method)
 * @param duration Total duration to simulate
 * @param fps Frames per second 
 */
export function simulateGameUpdates(
  objects: { update: (delta: number) => void }[],
  duration = 1, // seconds
  fps = 60
): void {
  const deltaTime = 1 / fps;
  const iterations = Math.floor(duration * fps);
  
  for (let i = 0; i < iterations; i++) {
    objects.forEach(obj => obj.update(deltaTime));
  }
}

/**
 * Creates a mock event for input testing
 */
export function createInputEvent(
  type: string, 
  value: boolean | number = true
): { type: string; value: boolean | number } {
  return { type, value };
}

/**
 * Finds all meshes in a scene
 */
export function findAllMeshes(scene: THREE.Scene): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      meshes.push(object);
    }
  });
  
  return meshes;
}

/**
 * Mock renderer for testing without DOM
 */
export class MockRenderer {
  domElement = document.createElement('div');
  
  render(scene: THREE.Scene, camera: THREE.Camera): void {
    // No-op for testing
  }
  
  setSize(width: number, height: number): void {
    // No-op for testing
  }
  
  dispose(): void {
    // No-op for testing
  }
}

/**
 * Complements ThreeTestEnvironment with a renderer
 */
export function createTestRendererEnvironment(): ThreeTestEnvironment & { renderer: MockRenderer } {
  const env = new ThreeTestEnvironment() as ThreeTestEnvironment & { renderer: MockRenderer };
  env.renderer = new MockRenderer();
  return env;
} 