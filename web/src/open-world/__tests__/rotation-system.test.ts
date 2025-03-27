import * as THREE from 'three';
import { Player } from '../player';
import { NetworkManager } from '../network-manager';
import { OpenWorldGame } from '../open-world';
import { Socket } from 'socket.io-client';
import { GameEvent } from '../../constants';

// Mock socket.io-client
jest.mock('socket.io-client');

// Mock THREE.WebGLRenderer
jest.mock('three', () => {
  const originalThree = jest.requireActual('three');
  return {
    ...originalThree,
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setSize: jest.fn(),
      setPixelRatio: jest.fn(),
      shadowMap: { enabled: false },
      domElement: document.createElement('canvas'),
      render: jest.fn(),
      dispose: jest.fn()
    })),
    CanvasTexture: jest.fn().mockImplementation(() => ({
      needsUpdate: false
    }))
  };
});

// Mock canvas operations
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  canvas: document.createElement('canvas'),
  fillStyle: '',
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  drawImage: jest.fn(),
  measureText: jest.fn(() => ({ width: 10 })),
  fillText: jest.fn(),
  font: '',
  textAlign: 'center',
  textBaseline: 'middle'
}));

// Mock window properties needed by THREE.js
global.innerWidth = 1024;
global.innerHeight = 768;
global.devicePixelRatio = 1;

describe('Quaternion Rotation System', () => {
  let player: Player;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(() => {
    player = new Player('test-player', true);
    mockSocket = {
      emit: jest.fn(),
      on: jest.fn(),
      removeAllListeners: jest.fn(),
      disconnect: jest.fn(),
    } as any;
  });

  describe('Player Rotation', () => {
    test('should maintain quaternion state internally', () => {
      const rotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, Math.PI / 2, 0)
      );
      
      player.setRotation(rotation);
      const currentRotation = player.getRotation();
      
      expect(currentRotation.x).toBeCloseTo(rotation.x, 6);
      expect(currentRotation.y).toBeCloseTo(rotation.y, 6);
      expect(currentRotation.z).toBeCloseTo(rotation.z, 6);
      expect(currentRotation.w).toBeCloseTo(rotation.w, 6);
    });

    test('should correctly transform direction vectors', () => {
      // Create a 90-degree rotation around Y axis (counter-clockwise)
      const rotation = new THREE.Quaternion();
      rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
      
      // Forward vector (0,0,-1) should become (1,0,0) after 90-degree Y rotation
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(rotation);
      expect(forward.x).toBeCloseTo(1, 6);
      expect(forward.y).toBeCloseTo(0, 6);
      expect(forward.z).toBeCloseTo(0, 6);
      
      // Right vector (1,0,0) should become (0,0,1)
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(rotation);
      expect(right.x).toBeCloseTo(0, 6);
      expect(right.y).toBeCloseTo(0, 6);
      expect(right.z).toBeCloseTo(1, 6);
    });

    it('should handle edge case rotations without gimbal lock', () => {
      const nearPoleRotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(Math.PI / 2, Math.PI / 4, 0)
      );
      
      player.setRotation(nearPoleRotation);
      const resultRotation = player.getRotation();
      
      expect(resultRotation.x).toBeCloseTo(nearPoleRotation.x, 6);
      expect(resultRotation.y).toBeCloseTo(nearPoleRotation.y, 6);
      expect(resultRotation.z).toBeCloseTo(nearPoleRotation.z, 6);
      expect(resultRotation.w).toBeCloseTo(nearPoleRotation.w, 6);
    });
  });

  describe('Network Transmission', () => {
    let networkManager: NetworkManager;
    let onPositionUpdate: jest.Mock;

    beforeEach(() => {
      onPositionUpdate = jest.fn();
      networkManager = new NetworkManager(
        player,
        jest.fn(),
        jest.fn(),
        onPositionUpdate,
        jest.fn()
      );
      // @ts-ignore - Accessing private field for testing
      networkManager.socket = mockSocket;
      // @ts-ignore - Accessing private field for testing
      networkManager.isConnected = true;
    });

    it('should correctly serialize quaternions for network transmission', () => {
      const rotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(Math.PI / 4, Math.PI / 3, Math.PI / 6)
      );
      
      const serialized = networkManager.serializeQuaternion(rotation);
      
      expect(serialized).toHaveLength(4);
      expect(typeof serialized[0]).toBe('number');
      expect(typeof serialized[1]).toBe('number');
      expect(typeof serialized[2]).toBe('number');
      expect(typeof serialized[3]).toBe('number');
    });

    it('should correctly deserialize quaternions from network data', () => {
      const originalRotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(Math.PI / 4, Math.PI / 3, Math.PI / 6)
      );
      
      const serialized = networkManager.serializeQuaternion(originalRotation);
      const deserialized = networkManager.deserializeQuaternion(serialized);
      
      expect(deserialized.x).toBeCloseTo(originalRotation.x, 6);
      expect(deserialized.y).toBeCloseTo(originalRotation.y, 6);
      expect(deserialized.z).toBeCloseTo(originalRotation.z, 6);
      expect(deserialized.w).toBeCloseTo(originalRotation.w, 6);
    });
  });

  describe('Camera System', () => {
    let game: OpenWorldGame;

    beforeEach(() => {
      // Create a mock container
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);
      
      game = new OpenWorldGame('test-container');
    });

    afterEach(() => {
      const container = document.getElementById('test-container');
      if (container) {
        document.body.removeChild(container);
      }
    });

    it('should correctly apply player rotation to cameras', () => {
      // @ts-ignore - Accessing private field for testing
      const mainCamera = game.mainCamera as THREE.PerspectiveCamera;
      // @ts-ignore - Accessing private field for testing
      const localPlayer = game.localPlayer as Player;

      const rotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, Math.PI / 2, 0)
      );
      localPlayer.setRotation(rotation);

      // Update camera
      // @ts-ignore - Accessing private method for testing
      game.updateCameraPositions(0);

      expect(mainCamera.quaternion.x).toBeCloseTo(rotation.x, 6);
      expect(mainCamera.quaternion.y).toBeCloseTo(rotation.y, 6);
      expect(mainCamera.quaternion.z).toBeCloseTo(rotation.z, 6);
      expect(mainCamera.quaternion.w).toBeCloseTo(rotation.w, 6);
    });
  });
}); 