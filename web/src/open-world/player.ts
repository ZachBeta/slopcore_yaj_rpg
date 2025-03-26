import * as THREE from 'three';
import { InputAction } from '../constants/input';
import { InputManager } from './input-manager';
import { GROUND_LEVEL, MOVEMENT, ROTATION, WORLD_DIRECTIONS } from '../constants/directions';

export class Player {
  private id: string;
  private isLocal: boolean;
  private object: THREE.Group;
  private body!: THREE.Mesh;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private moveSpeed: number = MOVEMENT.DEFAULT_SPEED;
  private gravity: number = MOVEMENT.GRAVITY;
  private jumpForce: number = MOVEMENT.JUMP_FORCE;
  private isGrounded: boolean = false;
  private collisionEffect: THREE.Mesh | null = null;
  private collisionEffectDuration: number = 0.5;
  private collisionEffectTimer: number = 0;
  private rotation: THREE.Quaternion = new THREE.Quaternion();
  private lookEuler: THREE.Euler = new THREE.Euler(0, Math.PI, 0, 'YXZ');
  private lookSpeed: number = 2.0;
  private color: THREE.Color;
  private inputManager: InputManager = new InputManager(
    (action: InputAction) => this.handleActionDown(action),
    (action: InputAction) => this.handleActionUp(action),
  );

  // Forward direction (in world space)
  private forward: THREE.Vector3 = new THREE.Vector3(0, 0, -1);
  // Right direction (in world space)
  private right: THREE.Vector3 = new THREE.Vector3(1, 0, 0);

  /**
   * Create a new player
   * @param id Unique identifier for the player
   * @param isLocal Whether this is the local player
   */
  constructor(id: string, isLocal: boolean) {
    this.id = id;
    this.isLocal = isLocal;
    this.object = new THREE.Group();
    this.object.position.set(0, 1, 0);

    // Set initial rotation
    this.rotation.setFromEuler(this.lookEuler);
    this.object.quaternion.copy(this.rotation);

    // Set initial color to gray (will be updated by server)
    this.color = new THREE.Color(0xCCCCCC);

    // Create a drone-like player model
    this.createDroneModel();

    // Add a name tag
    this.addNameTag(`Drone-${id.substring(0, 4)}`);
  }

  /**
   * Create a drone-like model for the player
   */
  private createDroneModel(): void {
    // Create the main body (central box)
    const bodyGeometry = new THREE.BoxGeometry(1.5, 0.4, 1.5);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: this.color });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.object.add(this.body);

    // Create 4 arms extending from the center
    const armLength = 1.2;
    const armWidth = 0.2;
    const armHeight = 0.1;
    const armGeometry = new THREE.BoxGeometry(armWidth, armHeight, armLength);

    // Front-left arm
    const frontLeftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    frontLeftArm.position.set(-0.65, 0, -0.65);
    frontLeftArm.rotation.y = Math.PI / 4; // 45 degrees
    this.object.add(frontLeftArm);

    // Front-right arm
    const frontRightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    frontRightArm.position.set(0.65, 0, -0.65);
    frontRightArm.rotation.y = -Math.PI / 4; // -45 degrees
    this.object.add(frontRightArm);

    // Back-left arm
    const backLeftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    backLeftArm.position.set(-0.65, 0, 0.65);
    backLeftArm.rotation.y = -Math.PI / 4; // -45 degrees
    this.object.add(backLeftArm);

    // Back-right arm
    const backRightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    backRightArm.position.set(0.65, 0, 0.65);
    backRightArm.rotation.y = Math.PI / 4; // 45 degrees
    this.object.add(backRightArm);

    // Create 4 rotors
    const rotorRadius = 0.5;
    const rotorHeight = 0.05;
    const rotorGeometry = new THREE.CylinderGeometry(rotorRadius, rotorRadius, rotorHeight, 16);
    const rotorMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

    // Create rotor positions
    const rotorPositions = [
      { x: -1.0, y: 0, z: -1.0 }, // Front-left
      { x: 1.0, y: 0, z: -1.0 }, // Front-right
      { x: -1.0, y: 0, z: 1.0 }, // Back-left
      { x: 1.0, y: 0, z: 1.0 }, // Back-right
    ];

    // Add rotors
    rotorPositions.forEach((pos) => {
      const rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
      rotor.position.set(pos.x, pos.y, pos.z);
      rotor.rotation.x = Math.PI / 2; // Make the rotor flat
      this.object.add(rotor);
    });

    // Add a camera at the front of the drone
    const cameraGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const cameraMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const cameraModel = new THREE.Mesh(cameraGeometry, cameraMaterial);
    cameraModel.position.set(0, -0.1, -0.9); // Positioned at the front
    this.object.add(cameraModel);

    // Add lens detail to camera
    const lensGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16);
    const lensMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.set(0, 0, -0.2);
    lens.rotation.x = Math.PI / 2;
    cameraModel.add(lens);
  }

  /**
   * Add a name tag above the player
   */
  private addNameTag(name: string): void {
    // Create a canvas for the name tag
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = 256;
    canvas.height = 64;

    // Draw the name tag
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.font = '30px Arial';
    context.textAlign = 'center';
    context.fillText(name, canvas.width / 2, canvas.height / 2 + 10);

    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });

    // Create a plane for the name tag
    const geometry = new THREE.PlaneGeometry(2, 0.5);
    const nameTag = new THREE.Mesh(geometry, material);
    nameTag.position.set(0, 1.5, 0);
    nameTag.rotation.x = -Math.PI / 4; // Angle it toward the camera

    this.object.add(nameTag);
  }

  /**
   * Update the player's state
   * @param deltaTime Time since last update in seconds
   */
  public update(deltaTime: number): void {
    if (this.isLocal) {
      this.handleMovement(deltaTime);
      this.handleRotation(deltaTime);
    }
    this.updateCollisionEffect(deltaTime);
  }

  /**
   * Handle player movement based on active input actions
   */
  private handleMovement(deltaTime: number): void {
    const activeActions = this.inputManager.getActiveActions();

    // Reset velocity
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.velocity.z = 0;

    // Get the movement vectors in the drone's local space
    const { forwardVector, upVector } = this.getLocalDirectionVectors();

    // W/S keys should move along the drone's local up/down axis (MOVE_UP/MOVE_DOWN)
    if (activeActions.has(InputAction.MOVE_UP)) {
      console.log('Player moving up');
      // Use the local up vector instead of global Y
      const moveVector = upVector.clone().multiplyScalar(this.moveSpeed);
      this.velocity.add(moveVector);
    } else if (activeActions.has(InputAction.MOVE_DOWN)) {
      console.log('Player moving down');
      // Use the local down vector instead of global -Y
      const moveVector = upVector.clone().multiplyScalar(-this.moveSpeed);
      this.velocity.add(moveVector);
    }

    // Legacy controls for ASCEND/DESCEND (if used)
    if (activeActions.has(InputAction.ASCEND)) {
      console.log('Drone ascending along local up axis');
      const moveVector = upVector.clone().multiplyScalar(this.moveSpeed);
      this.velocity.add(moveVector);
    } else if (activeActions.has(InputAction.DESCEND)) {
      console.log('Drone descending along local down axis');
      const moveVector = upVector.clone().multiplyScalar(-this.moveSpeed);
      this.velocity.add(moveVector);
    }

    // R/F controls throttle - movement along the drone's forward/backward axis
    if (activeActions.has(InputAction.THROTTLE_FORWARD)) {
      console.log('Drone throttle forward');
      const thrustVector = forwardVector.clone().multiplyScalar(this.moveSpeed);
      this.velocity.add(thrustVector);
    } else if (activeActions.has(InputAction.THROTTLE_BACKWARD)) {
      console.log('Drone throttle backward');
      const thrustVector = forwardVector.clone().multiplyScalar(-this.moveSpeed);
      this.velocity.add(thrustVector);
    }

    // Apply a small constant downward force to simulate gravity
    // Using world space for gravity
    this.velocity.y -= this.gravity * deltaTime;

    // Update position
    this.object.position.x += this.velocity.x * deltaTime;
    this.object.position.y += this.velocity.y * deltaTime;
    this.object.position.z += this.velocity.z * deltaTime;

    // Check ground collision
    if (this.object.position.y <= GROUND_LEVEL) {
      this.object.position.y = GROUND_LEVEL;
      this.velocity.y = 0;
      this.isGrounded = true;
    }
  }

  /**
   * Get the local direction vectors based on the drone's current orientation
   */
  private getLocalDirectionVectors(): { forwardVector: THREE.Vector3; upVector: THREE.Vector3 } {
    // Calculate direction vectors based on drone's current orientation
    const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(this.rotation);
    const upVector = new THREE.Vector3(0, 1, 0).applyQuaternion(this.rotation);

    return { forwardVector, upVector };
  }

  /**
   * Handle player rotation based on active input actions
   */
  private handleRotation(deltaTime: number): void {
    const activeActions = this.inputManager.getActiveActions();

    // Rotation around y-axis (yaw)
    if (activeActions.has(InputAction.ROTATE_LEFT)) {
      console.log('Drone rotating left (yaw)');
      this.lookEuler.y += this.lookSpeed * deltaTime;
    } else if (activeActions.has(InputAction.ROTATE_RIGHT)) {
      console.log('Drone rotating right (yaw)');
      this.lookEuler.y -= this.lookSpeed * deltaTime;
    }

    // Look up/down (pitch)
    if (activeActions.has(InputAction.LOOK_UP)) {
      console.log('Drone pitching forward');
      this.lookEuler.x -= this.lookSpeed * deltaTime;
    } else if (activeActions.has(InputAction.LOOK_DOWN)) {
      console.log('Drone pitching backward');
      this.lookEuler.x += this.lookSpeed * deltaTime;
    }

    // Limit up/down look to prevent flipping over
    this.lookEuler.x = Math.max(ROTATION.MIN_PITCH, Math.min(ROTATION.MAX_PITCH, this.lookEuler.x));

    // Roll left/right
    if (activeActions.has(InputAction.ROLL_LEFT)) {
      console.log('Drone banking left (roll)');
      this.lookEuler.z += this.lookSpeed * deltaTime;
    } else if (activeActions.has(InputAction.ROLL_RIGHT)) {
      console.log('Drone banking right (roll)');
      this.lookEuler.z -= this.lookSpeed * deltaTime;
    }

    // Update rotation quaternion from Euler angles
    this.rotation.setFromEuler(this.lookEuler);
    this.object.quaternion.copy(this.rotation);

    // Update forward and right vectors
    this.forward.copy(WORLD_DIRECTIONS.FORWARD).applyQuaternion(this.rotation);
    this.right.copy(WORLD_DIRECTIONS.RIGHT).applyQuaternion(this.rotation);
  }

  /**
   * Handle input action activation
   */
  private handleActionDown(action: InputAction): void {
    console.log('Player action down:', action);
  }

  /**
   * Handle input action deactivation
   */
  private handleActionUp(action: InputAction): void {
    console.log('Player action up:', action);
  }

  /**
   * Get the input manager instance
   */
  public getInputManager(): InputManager {
    return this.inputManager;
  }

  /**
   * Apply a force to the player
   */
  public applyForce(force: THREE.Vector3): void {
    this.velocity.add(force);
  }

  /**
   * Show a collision effect
   */
  public showCollisionEffect(): void {
    // Remove any existing collision effect
    if (this.collisionEffect) {
      this.object.remove(this.collisionEffect);
    }

    // Create a new collision effect
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.5,
    });
    this.collisionEffect = new THREE.Mesh(geometry, material);
    this.object.add(this.collisionEffect);

    // Set the timer
    this.collisionEffectTimer = this.collisionEffectDuration;
  }

  /**
   * Get the player's position
   */
  public getPosition(): THREE.Vector3 {
    return this.object.position.clone();
  }

  /**
   * Set the player's position
   */
  public setPosition(position: THREE.Vector3): void {
    this.object.position.copy(position);
  }

  /**
   * Get the player's Three.js object
   */
  public getObject(): THREE.Group {
    return this.object;
  }

  /**
   * Get the player's ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get the player's rotation
   */
  public getRotation(): THREE.Euler {
    return this.lookEuler.clone();
  }

  /**
   * Set the player's rotation
   */
  public setRotation(rotation: THREE.Quaternion): void {
    this.rotation.copy(rotation);
    this.object.quaternion.copy(this.rotation);
  }

  /**
   * Reset rotation to default orientation
   */
  public resetRotation(): void {
    this.lookEuler.set(0, Math.PI, 0, 'YXZ');
    this.rotation.setFromEuler(this.lookEuler);
    this.object.quaternion.copy(this.rotation);

    // Update forward and right vectors
    this.forward.copy(WORLD_DIRECTIONS.FORWARD).applyQuaternion(this.rotation);
    this.right.copy(WORLD_DIRECTIONS.RIGHT).applyQuaternion(this.rotation);
  }

  /**
   * Set rotation from Euler angles
   */
  public setRotationFromEuler(euler: THREE.Euler): void {
    this.lookEuler.copy(euler);
    this.rotation.setFromEuler(this.lookEuler);
    this.object.quaternion.copy(this.rotation);

    // Update forward and right vectors
    this.forward.copy(WORLD_DIRECTIONS.FORWARD).applyQuaternion(this.rotation);
    this.right.copy(WORLD_DIRECTIONS.RIGHT).applyQuaternion(this.rotation);
  }

  /**
   * Set the player's color
   */
  public setColor(color: THREE.Color): void {
    this.color = color;

    // Update all meshes in the player model
    this.object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
        child.material.color = color.clone();
      }
    });
  }

  /**
   * Get the player's current color
   */
  public getColor(): THREE.Color {
    return this.color.clone();
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.inputManager.dispose();
  }

  private updateCollisionEffect(deltaTime: number): void {
    // Update collision effect if active
    if (this.collisionEffect) {
      this.collisionEffectTimer -= deltaTime;

      if (this.collisionEffectTimer <= 0) {
        // Remove the collision effect when the timer expires
        this.object.remove(this.collisionEffect);
        this.collisionEffect = null;
      } else {
        // Scale the effect based on remaining time
        const scale = this.collisionEffectTimer / this.collisionEffectDuration;
        this.collisionEffect.scale.set(scale * 3, scale * 3, scale * 3);
      }
    }
  }
}
