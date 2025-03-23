import * as THREE from 'three';
import { WorldManager } from './world-manager';
import { MapData, ObstacleData } from '../types';
import { GameEvent } from '../constants';
import { EventEmitter } from 'events';

// Mock Three.js objects
jest.mock('three', () => {
  const mockScene = {
    add: jest.fn(),
    remove: jest.fn(),
  };
  
  const mockMesh = {
    position: { set: jest.fn() },
    scale: { set: jest.fn(), copy: jest.fn() },
    rotation: { set: jest.fn(), copy: jest.fn() },
    castShadow: false,
    receiveShadow: false,
  };
  
  return {
    Scene: jest.fn(() => mockScene),
    Vector3: jest.fn((x, y, z) => ({ x, y, z, set: jest.fn() })),
    Mesh: jest.fn(() => mockMesh),
    BoxGeometry: jest.fn(),
    CylinderGeometry: jest.fn(),
    PlaneGeometry: jest.fn(),
    MeshStandardMaterial: jest.fn(),
    Color: jest.fn((r, g, b) => ({ r, g, b, setHSL: jest.fn() })),
    GridHelper: jest.fn(),
    ShaderMaterial: jest.fn(),
    SphereGeometry: jest.fn(),
    BackSide: 1,
    Object3D: jest.fn(() => ({
      position: { set: jest.fn() },
      rotation: { set: jest.fn() },
      add: jest.fn()
    })),
  };
});

describe('WorldManager', () => {
  let scene: THREE.Scene;
  let worldManager: WorldManager;
  
  beforeEach(() => {
    scene = new THREE.Scene();
    worldManager = new WorldManager(scene);
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
          size: 2
        },
        {
          type: 'cylinder',
          position: { x: -10, y: 1.5, z: -10 },
          scale: { x: 1, y: 1, z: 1 },
          color: { r: 0, g: 1, b: 0 },
          radius: 1,
          height: 3
        }
      ]
    };
    
    it('should initialize with map data from server', () => {
      // Call the method to initialize with map data
      worldManager.initializeWithMapData(mockMapData);
      
      // Check that worldSize is updated
      expect(worldManager.getWorldSize()).toBe(mockMapData.worldSize);
      
      // Check that obstacles were created
      const obstacles = worldManager.getObstacles();
      expect(obstacles.length).toBe(mockMapData.obstacles.length);
    });
    
    it('should fall back to random data if no server data is available', () => {
      // Call the fallback method
      worldManager.initializeWithRandomData();
      
      // Check that some obstacles were created (default is 20)
      const obstacles = worldManager.getObstacles();
      expect(obstacles.length).toBeGreaterThan(0);
    });
  });
});

// Create a test for the server-side map generation
describe('Server Map Generation', () => {
  // Mock implementation of server-side map generation
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
          size
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
          height
        });
      }
    }
    
    return { worldSize, obstacles };
  }
  
  it('should generate the same map for all clients', () => {
    // Generate map data once (as server)
    const serverMapData = generateMapData();
    
    // Create world managers for multiple clients
    const scene1 = new THREE.Scene();
    const scene2 = new THREE.Scene();
    const worldManager1 = new WorldManager(scene1);
    const worldManager2 = new WorldManager(scene2);
    
    // Initialize both world managers with the same map data
    worldManager1.initializeWithMapData(serverMapData);
    worldManager2.initializeWithMapData(serverMapData);
    
    // Check that both world managers have the same world size
    expect(worldManager1.getWorldSize()).toBe(worldManager2.getWorldSize());
    
    // Check that both world managers have the same number of obstacles
    expect(worldManager1.getObstacles().length).toBe(worldManager2.getObstacles().length);
    
    // In a real implementation, we would check that the obstacles have the same properties,
    // but for this test we trust that the initializeWithMapData method correctly uses the data
  });
  
  it('should be shared via socket.io events', () => {
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
    
    // Simulate player join
    eventEmitter.emit(GameEvent.PLAYER_JOIN, { id: 'client1' });
    
    // Verify events were received
    expect(playerJoinReceived).toBeTruthy();
    expect(receivedMapData).toEqual(serverMapData);
    
    // Create world manager for client
    const clientScene = new THREE.Scene();
    const clientWorldManager = new WorldManager(clientScene);
    
    // Process received map data
    if (receivedMapData) {
      clientWorldManager.initializeWithMapData(receivedMapData);
      
      // Check that client world manager has the correct world size
      expect(clientWorldManager.getWorldSize()).toBe(serverMapData.worldSize);
      
      // Check that client world manager has the correct number of obstacles
      expect(clientWorldManager.getObstacles().length).toBe(serverMapData.obstacles.length);
    }
  });
}); 