import * as THREE from 'three';
import { InputAction } from '../constants/input';
import { InputManager } from './input-manager';
import { WORLD_DIRECTIONS, MOVEMENT, ROTATION, GROUND_LEVEL } from '../constants/directions';

export class Player {
  private id: string;
  private isLocal: boolean;
  private object: THREE.Group;
  private body: THREE.Mesh;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private moveSpeed: number = 5;
  private gravity: number = 20;
  private jumpForce: number = 10;
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
    (action: InputAction) => this.handleActionUp(action)
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
    
    // Create the player body (a cylinder with a sphere on top)
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshLambertMaterial({ color: this.color });
    
    this.body = new THREE.Mesh(bodyGeometry, material);
    this.body.position.y = 0.75; // Center the body
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.object.add(this.body);
    
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 1.75; // Place the head on top of the body
    head.castShadow = true;
    head.receiveShadow = true;
    this.object.add(head);
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
      depthWrite: false
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
    const moveDirection = new THREE.Vector3();
    
    // Reset velocity
    this.velocity.x = 0;
    this.velocity.z = 0;
    
    // Forward/Backward movement
    if (activeActions.has(InputAction.MOVE_FORWARD)) {
      console.log('Moving forward');
      moveDirection.add(this.forward);
    } else if (activeActions.has(InputAction.MOVE_BACKWARD)) {
      console.log('Moving backward');
      moveDirection.sub(this.forward);
    }
    
    // Left/Right movement
    if (activeActions.has(InputAction.MOVE_LEFT)) {
      console.log('Moving left');
      moveDirection.sub(this.right);
    } else if (activeActions.has(InputAction.MOVE_RIGHT)) {
      console.log('Moving right');
      moveDirection.add(this.right);
    }
    
    // Normalize diagonal movement
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      
      // Apply movement speed
      this.velocity.x = moveDirection.x * this.moveSpeed;
      this.velocity.z = moveDirection.z * this.moveSpeed;
    }
    
    // Jump
    if (activeActions.has(InputAction.JUMP) && this.isGrounded) {
      console.log('Jumping');
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }
    
    // Apply gravity
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * deltaTime;
    }
    
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
   * Handle player rotation based on active input actions
   */
  private handleRotation(deltaTime: number): void {
    const activeActions = this.inputManager.getActiveActions();
    
    // Look up/down (pitch)
    if (activeActions.has(InputAction.LOOK_UP)) {
      console.log('Looking up');
      this.lookEuler.x -= this.lookSpeed * deltaTime;
    } else if (activeActions.has(InputAction.LOOK_DOWN)) {
      console.log('Looking down');
      this.lookEuler.x += this.lookSpeed * deltaTime;
    }
    
    // Limit up/down look to prevent flipping over
    this.lookEuler.x = Math.max(ROTATION.MIN_PITCH, Math.min(ROTATION.MAX_PITCH, this.lookEuler.x));
    
    // Look left/right (yaw)
    if (activeActions.has(InputAction.LOOK_LEFT)) {
      console.log('Looking left');
      this.lookEuler.y += this.lookSpeed * deltaTime;
    } else if (activeActions.has(InputAction.LOOK_RIGHT)) {
      console.log('Looking right');
      this.lookEuler.y -= this.lookSpeed * deltaTime;
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
      opacity: 0.5
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
  public setRotation(rotation: THREE.Euler): void {
    this.lookEuler.copy(rotation);
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