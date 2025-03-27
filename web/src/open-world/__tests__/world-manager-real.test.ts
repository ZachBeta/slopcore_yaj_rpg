import * as THREE from 'three';
import { WorldManager } from '../world-manager';
import { MapData, ObstacleData } from '../../types';
import { GameEvent } from '../../constants';
import { EventEmitter } from 'events';
import { ThreeTestEnvironment, createTestEnvironment } from '../../test/three-test-environment';

describe('WorldManager with Real THREE.js', () => {
  let testEnv: ThreeTestEnvironment;
  let worldManager: WorldManager;

  beforeEach(() => {
    // Set up a real THREE.js test environment
    testEnv = createTestEnvironment();
    
    // Create a real world manager with the real scene
    worldManager = new WorldManager(testEnv.scene);
  });

  afterEach(() => {
    // Clean up THREE.js resources
    testEnv.cleanup();
  });

  describe('Map Data Handling', () => {
    // Test map data
    const mockMapData: MapData = {
      worldSize: 100,
      obstacles: [
        {
          type: 'cube',
          position: { x: 10, y: 1, z: 10 },
          scale: { x: 1, y: 2, z: 1 },
          color: { r: 1, g: 0, b: 0 },
          size: 2,
        },
        {
          type: 'cylinder',
          position: { x: -10, y: 1.5, z: -10 },
          scale: { x: 1, y: 1, z: 1 },
          color: { r: 0, g: 1, b: 0 },
          radius: 1,
          height: 3,
        },
      ],
    };

    it('should initialize with map data', () => {
      // Get initial mesh count before adding obstacles
      const initialMeshes = findObstacleMeshes(testEnv.scene);
      const initialCount = initialMeshes.length;
      
      // Call the method to initialize with map data
      worldManager.initializeWithMapData(mockMapData);

      // Check that worldSize is updated
      expect(worldManager.getWorldSize()).toBe(mockMapData.worldSize);

      // Check that obstacles were created by counting children in the scene
      // Find all meshes that aren't the ground or grid
      const meshes = findObstacleMeshes(testEnv.scene);
      
      // Should have the number of obstacles plus any initial meshes
      // Note: The real THREE.js code might create ground or skybox meshes
      expect(meshes.length - initialCount).toBe(mockMapData.obstacles.length);
      
      // Verify position of one of the obstacles - it should match our map data
      // Find an obstacle at the expected position
      const cubeObstacle = meshes.find(mesh => {
        return mesh.position.x === 10 && mesh.position.z === 10;
      });
      
      expect(cubeObstacle).toBeDefined();
      if (cubeObstacle) {
        expect(cubeObstacle.position.y).toBeCloseTo(1);
      }
    });

    it('should fall back to random data if no server data is available', () => {
      // Get initial mesh count
      const initialMeshes = findObstacleMeshes(testEnv.scene);
      const initialCount = initialMeshes.length;
      
      // Call the fallback method
      worldManager.initializeWithRandomData();

      // Check that some obstacles were created (default is 20)
      const meshes = findObstacleMeshes(testEnv.scene);
      expect(meshes.length).toBeGreaterThan(initialCount);
    });
  });
  
  describe('Server Map Generation', () => {
    // Function to generate test map data
    function generateMapData(): MapData {
      const worldSize = 100;
      const obstacles: ObstacleData[] = [];

      // Create a deterministic set of obstacles for testing
      for (let i = 0; i < 5; i++) {
        // Alternating cube and cylinder in a grid pattern
        const type = i % 2 === 0 ? 'cube' as const : 'cylinder' as const;
        const x = ((i % 3) - 1) * 20;
        const z = (Math.floor(i / 3) - 1) * 20;

        if (type === 'cube') {
          const size = 1 + (i * 0.5);
          obstacles.push({
            type,
            position: { x, y: size / 2, z },
            scale: { x: 1, y: 1, z: 1 },
            color: { r: 1, g: 0, b: 0 },
            size,
          });
        } else {
          const radius = 0.5 + (i * 0.25);
          const height = 2 + (i * 0.5);
          obstacles.push({
            type,
            position: { x, y: height / 2, z },
            scale: { x: 1, y: 1, z: 1 },
            color: { r: 0, g: 1, b: 0 },
            radius,
            height,
          });
        }
      }

      return { worldSize, obstacles };
    }

    it('should generate the same world for all clients', () => {
      // Generate map data once (as server)
      const serverMapData = generateMapData();

      // Create two test environments and world managers
      const testEnv1 = createTestEnvironment();
      const testEnv2 = createTestEnvironment();
      const worldManager1 = new WorldManager(testEnv1.scene);
      const worldManager2 = new WorldManager(testEnv2.scene);

      // Get initial mesh counts
      const initialMeshes1 = findObstacleMeshes(testEnv1.scene);
      const initialCount1 = initialMeshes1.length;
      const initialMeshes2 = findObstacleMeshes(testEnv2.scene);
      const initialCount2 = initialMeshes2.length;

      // Initialize both world managers with the same map data
      worldManager1.initializeWithMapData(serverMapData);
      worldManager2.initializeWithMapData(serverMapData);

      // Check that both world managers have the same world size
      expect(worldManager1.getWorldSize()).toBe(worldManager2.getWorldSize());

      // Check that both world managers have the same number of obstacles
      const meshes1 = findObstacleMeshes(testEnv1.scene);
      const meshes2 = findObstacleMeshes(testEnv2.scene);
      expect(meshes1.length - initialCount1).toBe(meshes2.length - initialCount2);
      expect(meshes1.length - initialCount1).toBe(serverMapData.obstacles.length);

      // Clean up resources
      testEnv1.cleanup();
      testEnv2.cleanup();
    });

    it('should be shared via events', () => {
      // Create real event emitter to simulate socket.io events
      const eventEmitter = new EventEmitter();
      const serverMapData = generateMapData();

      // Track if map data was received
      let receivedMapData: MapData | null = null;
      let playerJoinReceived = false;

      // Set up event handlers
      eventEmitter.on(GameEvent.MAP_DATA, (data: MapData) => {
        receivedMapData = data;
      });

      eventEmitter.on(GameEvent.PLAYER_JOIN, () => {
        playerJoinReceived = true;
        // Server would typically send map data after player join
        eventEmitter.emit(GameEvent.MAP_DATA, serverMapData);
      });

      // Simulate player join event
      eventEmitter.emit(GameEvent.PLAYER_JOIN, { id: 'player1' });

      // Verify that events were processed correctly
      expect(playerJoinReceived).toBe(true);
      expect(receivedMapData).not.toBeNull();
      expect(receivedMapData).toEqual(serverMapData);
    });
  });
});

/**
 * Helper function to find obstacle meshes in a scene
 */
function findObstacleMeshes(scene: THREE.Scene): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  
  // Filter out ground and grid objects
  scene.traverse((object) => {
    // Only include objects that are:
    // 1. Meshes
    // 2. Not the ground plane (which is flat on XZ plane)
    // 3. Not grid helpers (which have very specific position)
    if (
      object instanceof THREE.Mesh && 
      !(object.rotation.x === -Math.PI / 2) && // Ground plane is rotated
      !(object instanceof THREE.GridHelper)
    ) {
      meshes.push(object);
    }
  });
  
  return meshes;
} 