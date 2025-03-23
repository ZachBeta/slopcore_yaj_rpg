import * as THREE from 'three';
import { InputAction } from '../constants/input';

export class Player {
  private id: string;
  private isLocal: boolean;
  private object: THREE.Group;
  private body: THREE.Mesh;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private activeActions: Set<InputAction> = new Set();
  private moveSpeed: number = 5;
  private gravity: number = 9.8;
  private jumpForce: number = 5;
  private isGrounded: boolean = false;
  private collisionEffect: THREE.Mesh | null = null;
  private collisionEffectDuration: number = 0.5;
  private collisionEffectTimer: number = 0;
  private rotation: THREE.Euler = new THREE.Euler(0, Math.PI, 0, 'YXZ');
  private lookSpeed: number = 2.0;
  private color: THREE.Color;

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
    
    // For non-local players, add a name tag
    if (!isLocal) {
      this.addNameTag(id);
    }
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
   * Update the player's position and state
   * @param deltaTime Time since last update in seconds
   */
  public update(deltaTime: number): void {
    // Apply gravity if not grounded
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * deltaTime;
    }
    
    // Handle movement based on input
    if (this.isLocal) {
      this.handleMovement(deltaTime);
      this.handleRotation(deltaTime);
    }
    
    // Get movement direction based on player rotation
    const direction = new THREE.Vector3(
      this.velocity.x,
      0,
      this.velocity.z
    );
    
    // Apply rotation to movement direction
    direction.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
    
    // Update position
    this.object.position.x += direction.x * deltaTime;
    this.object.position.y += this.velocity.y * deltaTime;
    this.object.position.z += direction.z * deltaTime;
    
    // Update rotation
    this.object.rotation.y = this.rotation.y;
    
    // Detect ground collision
    if (this.object.position.y < 1) {
      this.object.position.y = 1;
      this.velocity.y = 0;
      this.isGrounded = true;
    }
    
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
  
  /**
   * Handle player movement based on active input actions
   */
  private handleMovement(deltaTime: number): void {
    // Reset velocity for horizontal movement
    this.velocity.x = 0;
    this.velocity.z = 0;
    
    const frameSpeed = this.moveSpeed * deltaTime;
    
    // Forward/Backward movement
    if (this.activeActions.has(InputAction.MOVE_FORWARD)) {
      console.log('Moving forward');
      this.velocity.z = -frameSpeed;
    } else if (this.activeActions.has(InputAction.MOVE_BACKWARD)) {
      console.log('Moving backward');
      this.velocity.z = frameSpeed;
    }
    
    // Left/Right movement
    if (this.activeActions.has(InputAction.MOVE_LEFT)) {
      console.log('Moving left');
      this.velocity.x = -frameSpeed;
    } else if (this.activeActions.has(InputAction.MOVE_RIGHT)) {
      console.log('Moving right');
      this.velocity.x = frameSpeed;
    }
    
    // Normalize diagonal movement
    if ((this.activeActions.has(InputAction.MOVE_FORWARD) || this.activeActions.has(InputAction.MOVE_BACKWARD)) && 
        (this.activeActions.has(InputAction.MOVE_LEFT) || this.activeActions.has(InputAction.MOVE_RIGHT))) {
      console.log('Normalizing diagonal movement');
      const length = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
      this.velocity.x /= length;
      this.velocity.z /= length;
      this.velocity.x *= frameSpeed;
      this.velocity.z *= frameSpeed;
    }
    
    // Jump
    if (this.activeActions.has(InputAction.JUMP) && this.isGrounded) {
      console.log('Jumping');
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }
  }
  
  /**
   * Handle player rotation based on active input actions
   */
  private handleRotation(deltaTime: number): void {
    // Look up/down
    if (this.activeActions.has(InputAction.LOOK_UP)) {
      console.log('Looking up');
      this.rotation.x -= this.lookSpeed * deltaTime;
    } else if (this.activeActions.has(InputAction.LOOK_DOWN)) {
      console.log('Looking down');
      this.rotation.x += this.lookSpeed * deltaTime;
    }
    
    // Limit up/down look to prevent flipping over
    this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
    
    // Look left/right
    if (this.activeActions.has(InputAction.LOOK_LEFT)) {
      console.log('Looking left');
      this.rotation.y += this.lookSpeed * deltaTime;
    } else if (this.activeActions.has(InputAction.LOOK_RIGHT)) {
      console.log('Looking right');
      this.rotation.y -= this.lookSpeed * deltaTime;
    }
  }
  
  /**
   * Handle input action activation
   */
  public handleActionDown(action: InputAction): void {
    console.log('Player action down:', action);
    this.activeActions.add(action);
    console.log('Active actions:', Array.from(this.activeActions));
  }
  
  /**
   * Handle input action deactivation
   */
  public handleActionUp(action: InputAction): void {
    console.log('Player action up:', action);
    this.activeActions.delete(action);
    console.log('Active actions:', Array.from(this.activeActions));
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
    return this.rotation.clone();
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
} 