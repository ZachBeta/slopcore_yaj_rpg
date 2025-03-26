import * as THREE from 'three';

/**
 * World space direction constants
 */
export const WORLD_DIRECTIONS = {
  FORWARD: new THREE.Vector3(0, 0, -1),
  BACKWARD: new THREE.Vector3(0, 0, 1),
  LEFT: new THREE.Vector3(-1, 0, 0),
  RIGHT: new THREE.Vector3(1, 0, 0),
  UP: new THREE.Vector3(0, 1, 0),
  DOWN: new THREE.Vector3(0, -1, 0),
} as const;

/**
 * Ground level for all entities
 */
export const GROUND_LEVEL = 1;

/**
 * Movement constants
 */
export const MOVEMENT = {
  DEFAULT_SPEED: 5,
  JUMP_FORCE: 10,
  GRAVITY: 20,
} as const;

/**
 * Rotation constants
 */
export const ROTATION = {
  DEFAULT_SPEED: Math.PI, // 180 degrees per second
  MAX_PITCH: Math.PI / 2, // 90 degrees up/down
  MIN_PITCH: -Math.PI / 2,
} as const;
