import * as THREE from 'three';
import { EventEmitter } from 'events';

/**
 * Creates a headless THREE.js test environment
 * This allows us to test THREE.js code without browser dependencies
 */
export class ThreeTestEnvironment {
  // Core THREE.js objects
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  eventEmitter: EventEmitter;
  
  // Track objects for cleanup
  private objects: THREE.Object3D[] = [];
  
  constructor() {
    // Create a real THREE.js scene
    this.scene = new THREE.Scene();
    
    // Create a camera
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 5;
    
    // Event emitter for game events
    this.eventEmitter = new EventEmitter();
  }
  
  /**
   * Add an object to the scene and track it for cleanup
   */
  add(object: THREE.Object3D): void {
    this.scene.add(object);
    this.objects.push(object);
  }
  
  /**
   * Remove an object from the scene and tracking
   */
  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
    const index = this.objects.indexOf(object);
    if (index !== -1) {
      this.objects.splice(index, 1);
    }
  }
  
  /**
   * Clean up all resources
   */
  cleanup(): void {
    // Remove all objects from the scene
    this.objects.forEach(obj => {
      this.scene.remove(obj);
      
      // Dispose of geometries and materials if available
      if ('geometry' in obj && obj.geometry instanceof THREE.BufferGeometry) {
        obj.geometry.dispose();
      }
      
      if ('material' in obj) {
        const material = (obj as THREE.Mesh).material;
        if (material instanceof THREE.Material) {
          material.dispose();
        } else if (Array.isArray(material)) {
          material.forEach(m => m.dispose());
        }
      }
    });
    
    this.objects = [];
  }
}

/**
 * Create a test environment with common objects needed for testing
 */
export function createTestEnvironment(): ThreeTestEnvironment {
  return new ThreeTestEnvironment();
} 