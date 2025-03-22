import * as THREE from 'three';

export class Player {
  private id: string;
  private isLocal: boolean;
  private object: THREE.Group;
  private body: THREE.Mesh;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private movementKeys: { [key: string]: boolean } = {
    'KeyW': false,
    'KeyA': false,
    'KeyS': false,
    'KeyD': false,
    'Space': false,
    'KeyI': false,
    'KeyJ': false,
    'KeyK': false,
    'KeyL': false
  };
  private moveSpeed: number = 5;
  private gravity: number = 9.8;
  private jumpForce: number = 5;
  private isGrounded: boolean = false;
  private collisionEffect: THREE.Mesh | null = null;
  private collisionEffectDuration: number = 0.5;
  private collisionEffectTimer: number = 0;
  private rotation: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private lookSpeed: number = 2.0;

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
    
    // Create the player body (a simple cylinder for now)
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
    const material = new THREE.MeshLambertMaterial({ 
      color: isLocal ? 0x00ff00 : 0xff0000 
    });
    this.body = new THREE.Mesh(geometry, material);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.object.add(this.body);
    
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
   * Handle player movement based on keyboard input
   */
  private handleMovement(deltaTime: number): void {
    // Reset velocity for horizontal movement
    this.velocity.x = 0;
    this.velocity.z = 0;
    
    // Forward/Backward movement
    if (this.movementKeys['KeyW']) {
      this.velocity.z = -this.moveSpeed;
    } else if (this.movementKeys['KeyS']) {
      this.velocity.z = this.moveSpeed;
    }
    
    // Left/Right movement
    if (this.movementKeys['KeyA']) {
      this.velocity.x = -this.moveSpeed;
    } else if (this.movementKeys['KeyD']) {
      this.velocity.x = this.moveSpeed;
    }
    
    // Normalize diagonal movement
    if ((this.movementKeys['KeyW'] || this.movementKeys['KeyS']) && 
        (this.movementKeys['KeyA'] || this.movementKeys['KeyD'])) {
      const length = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
      this.velocity.x /= length;
      this.velocity.z /= length;
      this.velocity.x *= this.moveSpeed;
      this.velocity.z *= this.moveSpeed;
    }
    
    // Jump
    if (this.movementKeys['Space'] && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }
  }
  
  /**
   * Handle player rotation based on keyboard input (IJKL)
   */
  private handleRotation(deltaTime: number): void {
    // Look up/down (I/K)
    if (this.movementKeys['KeyI']) {
      this.rotation.x -= this.lookSpeed * deltaTime;
    } else if (this.movementKeys['KeyK']) {
      this.rotation.x += this.lookSpeed * deltaTime;
    }
    
    // Limit up/down look to prevent flipping over
    this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
    
    // Look left/right (J/L)
    if (this.movementKeys['KeyJ']) {
      this.rotation.y += this.lookSpeed * deltaTime;
    } else if (this.movementKeys['KeyL']) {
      this.rotation.y -= this.lookSpeed * deltaTime;
    }
  }
  
  /**
   * Handle key down event for player movement
   */
  public handleKeyDown(keyCode: string): void {
    if (keyCode in this.movementKeys) {
      this.movementKeys[keyCode] = true;
    }
  }
  
  /**
   * Handle key up event for player movement
   */
  public handleKeyUp(keyCode: string): void {
    if (keyCode in this.movementKeys) {
      this.movementKeys[keyCode] = false;
    }
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
} 