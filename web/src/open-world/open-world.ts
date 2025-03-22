import * as THREE from 'three';
import { Player } from './player';
import { WorldManager } from './world-manager';
import { NetworkManager } from './network-manager';

export class OpenWorldGame {
  // Core three.js components
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  
  // Game components
  private worldManager: WorldManager;
  private localPlayer: Player;
  private networkManager: NetworkManager;
  private players: Map<string, Player> = new Map();
  
  // Game state
  private animating: boolean = false;
  private lastTime: number = 0;
  
  /**
   * Initialize the Open World game scene
   * @param containerId The ID of the container element
   */
  constructor(containerId: string) {
    // Get the container element
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container element with ID '${containerId}' not found.`);
      throw new Error(`Container element with ID '${containerId}' not found.`);
    }

    // Set up the scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x88ccff); // Sky blue
    this.scene.fog = new THREE.FogExp2(0xcccccc, 0.02);

    // Set up the camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // Set up the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Set up lighting
    this.setupLighting();

    // Create world manager and set up the environment
    this.worldManager = new WorldManager(this.scene);
    
    // Create local player
    const playerId = 'player_' + Math.floor(Math.random() * 1000000);
    this.localPlayer = new Player(playerId, true);
    this.scene.add(this.localPlayer.getObject());
    
    // Position camera to follow the player
    this.updateCameraPosition();
    
    // Initialize the network manager with color support
    this.networkManager = new NetworkManager(
      this.localPlayer, 
      (id: string, position: THREE.Vector3, color: THREE.Color) => this.handlePlayerJoin(id, position, color),
      (id: string) => this.handlePlayerLeave(id),
      (id: string, position: THREE.Vector3) => this.updatePlayerPosition(id, position)
    );
    
    // Set up event listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));

    // Add instructions
    this.addControlsInstructions(container);
  }

  /**
   * Add controls instructions overlay
   */
  private addControlsInstructions(container: HTMLElement): void {
    const instructions = document.createElement('div');
    instructions.style.position = 'absolute';
    instructions.style.bottom = '10px';
    instructions.style.left = '10px';
    instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    instructions.style.color = 'white';
    instructions.style.padding = '10px';
    instructions.style.borderRadius = '5px';
    instructions.style.fontFamily = 'Arial, sans-serif';
    instructions.style.fontSize = '14px';
    instructions.style.zIndex = '1000';
    instructions.innerHTML = `
      <strong>Controls:</strong><br>
      WASD - Move<br>
      IJKL - Look around<br>
      SPACE - Jump
    `;
    container.appendChild(instructions);
  }
  
  /**
   * Set up the lighting for the scene
   */
  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 30, 10);
    directionalLight.castShadow = true;
    
    // Optimize shadow settings
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    
    this.scene.add(directionalLight);
  }
  
  /**
   * Update the camera to follow the player and account for rotation
   */
  private updateCameraPosition(): void {
    const playerPosition = this.localPlayer.getPosition();
    const playerRotation = this.localPlayer.getRotation();
    
    // Create the camera offset based on player rotation
    const cameraDistance = 10;
    const cameraHeight = 5;
    const cameraOffset = new THREE.Vector3(
      0,
      cameraHeight,
      cameraDistance
    );
    
    // Apply the rotation to the camera offset
    cameraOffset.applyEuler(new THREE.Euler(0, playerRotation.y, 0));
    
    // Set the camera position
    this.camera.position.copy(playerPosition).add(cameraOffset);
    
    // Make the camera look at the player with the x-rotation applied
    const lookAtPosition = playerPosition.clone();
    const lookDirection = new THREE.Vector3(0, 0, -1);
    lookDirection.applyEuler(playerRotation);
    lookDirection.multiplyScalar(10); // Look 10 units ahead
    lookAtPosition.add(lookDirection);
    
    this.camera.lookAt(lookAtPosition);
    
    // Apply the up/down rotation
    this.camera.rotation.x += playerRotation.x;
  }
  
  /**
   * Handle player joining the game
   */
  private handlePlayerJoin(id: string, position: THREE.Vector3, color: THREE.Color): void {
    if (id !== this.localPlayer.getId() && !this.players.has(id)) {
      console.log(`Player ${id} joined`);
      const player = new Player(id, false);
      player.setPosition(position);
      player.setColor(color);
      this.scene.add(player.getObject());
      this.players.set(id, player);
    }
  }
  
  /**
   * Handle player leaving the game
   */
  private handlePlayerLeave(id: string): void {
    if (this.players.has(id)) {
      console.log(`Player ${id} left`);
      const player = this.players.get(id);
      this.scene.remove(player.getObject());
      this.players.delete(id);
    }
  }
  
  /**
   * Update player position from network data
   */
  private updatePlayerPosition(id: string, position: THREE.Vector3): void {
    if (this.players.has(id)) {
      const player = this.players.get(id);
      player.setPosition(position);
    }
  }
  
  /**
   * Handle window resize event
   */
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  /**
   * Handle key down events for player movement
   */
  private onKeyDown(event: KeyboardEvent): void {
    this.localPlayer.handleKeyDown(event.code);
  }
  
  /**
   * Handle key up events for player movement
   */
  private onKeyUp(event: KeyboardEvent): void {
    this.localPlayer.handleKeyUp(event.code);
  }
  
  /**
   * Start the animation loop
   */
  public start(): void {
    if (!this.animating) {
      this.animating = true;
      this.lastTime = performance.now();
      this.animate();
    }
  }
  
  /**
   * Stop the animation loop
   */
  public stop(): void {
    this.animating = false;
  }
  
  /**
   * Animation loop
   */
  private animate(): void {
    if (!this.animating) return;
    
    requestAnimationFrame(this.animate.bind(this));
    
    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = now;
    
    // Update local player
    this.localPlayer.update(deltaTime);
    
    // Check for collisions with other players
    this.checkPlayerCollisions();
    
    // Update camera to follow player
    this.updateCameraPosition();
    
    // Send player position update to network
    this.networkManager.sendPositionUpdate(this.localPlayer.getPosition());
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Check for collisions between players
   */
  private checkPlayerCollisions(): void {
    const localPlayerPosition = this.localPlayer.getPosition();
    const collisionDistance = 2; // Distance for collision detection
    
    // Check collision with each other player
    this.players.forEach((player, id) => {
      const playerPosition = player.getPosition();
      const distance = localPlayerPosition.distanceTo(playerPosition);
      
      if (distance < collisionDistance) {
        // Handle collision - simple bounce effect
        const direction = new THREE.Vector3()
          .subVectors(localPlayerPosition, playerPosition)
          .normalize();
        
        // Apply a small force to both players
        this.localPlayer.applyForce(direction.multiplyScalar(2));
        player.applyForce(direction.multiplyScalar(-2));
        
        // Visual feedback for collision
        this.localPlayer.showCollisionEffect();
        player.showCollisionEffect();
        
        // Provide some feedback
        console.log(`Collided with player ${id}`);
      }
    });
  }
  
  /**
   * Clean up resources when the game is destroyed
   */
  public dispose(): void {
    this.stop();
    
    // Clean up event listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
    
    // Disconnect from network
    this.networkManager.disconnect();
    
    // Dispose of Three.js resources
    this.renderer.dispose();
  }
} 