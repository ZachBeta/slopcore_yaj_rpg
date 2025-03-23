import * as THREE from 'three';
import { Player } from './player';
import { WorldManager } from './world-manager';
import { NetworkManager } from './network-manager';
import { ConnectionStatus } from '../types';
import { GameEvent, GameEventPayloads } from '../constants';
import { InputAction, getActionFromKeyCode } from '../constants/input';

export class OpenWorldGame {
  // Core three.js components
  private scene: THREE.Scene;
  private mainCamera: THREE.PerspectiveCamera;
  private chaseCamera: THREE.PerspectiveCamera;
  private orbitCamera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private chasePipRenderer: THREE.WebGLRenderer;
  private orbitPipRenderer: THREE.WebGLRenderer;
  private orbitAngle: number = 0;
  private orbitSpeed: number = 0.2; // radians per second
  
  // Game components
  private worldManager: WorldManager;
  private localPlayer: Player;
  private networkManager: NetworkManager;
  private players: Map<string, Player> = new Map();
  
  // Game state
  private animating: boolean = false;
  private lastTime: number = 0;
  
  // Control display
  private controlElements: Map<string, HTMLElement> = new Map();
  
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
    this.mainCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    // Create chase camera
    this.chaseCamera = new THREE.PerspectiveCamera(
      75,
      1, // 1:1 aspect ratio for PIP
      0.1,
      1000
    );
    this.chaseCamera.position.set(0, 5, 10);
    
    // Create orbit camera
    this.orbitCamera = new THREE.PerspectiveCamera(
      75,
      1, // 1:1 aspect ratio for PIP
      0.1,
      1000
    );
    this.orbitCamera.position.set(10, 5, 0);
    this.orbitCamera.lookAt(0, 0, 0);
    
    // Set up the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Set up PIP renderers
    const pipSize = 200; // Size of PIP displays
    
    // Chase camera PIP
    this.chasePipRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.chasePipRenderer.setSize(pipSize, pipSize);
    this.chasePipRenderer.setPixelRatio(window.devicePixelRatio);
    this.chasePipRenderer.shadowMap.enabled = true;
    this.chasePipRenderer.domElement.style.position = 'absolute';
    this.chasePipRenderer.domElement.style.bottom = '20px';
    this.chasePipRenderer.domElement.style.right = '20px';
    this.chasePipRenderer.domElement.style.border = '2px solid rgba(255, 255, 255, 0.5)';
    this.chasePipRenderer.domElement.style.borderRadius = '5px';
    container.appendChild(this.chasePipRenderer.domElement);
    
    // Orbit camera PIP
    this.orbitPipRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.orbitPipRenderer.setSize(pipSize, pipSize);
    this.orbitPipRenderer.setPixelRatio(window.devicePixelRatio);
    this.orbitPipRenderer.shadowMap.enabled = true;
    this.orbitPipRenderer.domElement.style.position = 'absolute';
    this.orbitPipRenderer.domElement.style.bottom = '20px';
    this.orbitPipRenderer.domElement.style.left = '20px';
    this.orbitPipRenderer.domElement.style.border = '2px solid rgba(255, 255, 255, 0.5)';
    this.orbitPipRenderer.domElement.style.borderRadius = '5px';
    container.appendChild(this.orbitPipRenderer.domElement);

    // Set up lighting
    this.setupLighting();

    // Create world manager and set up the environment
    this.worldManager = new WorldManager(this.scene);
    
    // Create local player
    const playerId = 'player_' + Math.floor(Math.random() * 1000000);
    this.localPlayer = new Player(playerId, true);
    this.scene.add(this.localPlayer.getObject());
    
    // Position camera to follow the player
    this.updateCameraPositions(0);
    
    // Initialize the network manager with color support
    this.networkManager = new NetworkManager(
      this.localPlayer, 
      (id: string, position: THREE.Vector3, color: THREE.Color) => this.handlePlayerJoin(id, position, color),
      (id: string) => this.handlePlayerLeave(id),
      (id: string, position: THREE.Vector3) => this.updatePlayerPosition(id, position),
      (status: ConnectionStatus, error?: Error) => this.handleConnectionStatus(status, error)
    );
    
    // Connect to the server
    this.networkManager.connect();
    
    // Set up event listeners
    window.addEventListener('resize', this.onWindowResize);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);

    // Add instructions
    this.addControlsInstructions(container);
    
    // Add controls display
    this.addControlsDisplay(container);
    
    // Start the animation loop
    this.animating = true;
    this.lastTime = performance.now();
    this.animate();

    // Update event handlers with type-safe events
    this.networkManager.on(GameEvent.CONNECTION_STATUS, (status: GameEventPayloads[typeof GameEvent.CONNECTION_STATUS]) => {
      this.handleConnectionStatus(status);
    });

    this.networkManager.on(GameEvent.PLAYER_MOVED, () => {
      // ... existing code ...
    });
  }

  /**
   * Add controls instructions overlay
   */
  private addControlsInstructions(container: HTMLElement): void {
    const instructions = document.createElement('div');
    instructions.style.position = 'absolute';
    instructions.style.top = '10px';
    instructions.style.width = '100%';
    instructions.style.textAlign = 'center';
    instructions.style.padding = '10px';
    instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    instructions.style.color = 'white';
    instructions.style.fontFamily = 'monospace';
    instructions.style.pointerEvents = 'none';
    instructions.style.zIndex = '100';
    instructions.innerHTML = `
      <h2>Drone Control System</h2>
      <strong>Main Controls:</strong><br>
      W/S: Move Up/Down (relative to drone orientation)<br>
      R/F: Throttle Forward/Backward<br>
      A/D: Rotate Left/Right (Yaw)<br>
      I/K: Tilt Forward/Backward (Pitch)<br>
      J/L: Bank Left/Right (Roll)<br>
      Space: Quick Boost<br>
      Escape: Return to Menu<br><br>
      <strong>Views:</strong><br>
      Main: First-Person View (FPV)<br>
      Bottom-Left: Orbit Camera<br>
      Bottom-Right: Chase Camera<br><br>
      <strong>Note:</strong> Active controls are shown in the grids at the bottom center
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
   * Update the camera positions based on player position and rotation
   */
  private updateCameraPositions(deltaTime: number): void {
    const playerPosition = this.localPlayer.getPosition();
    const playerRotation = this.localPlayer.getRotation();
    
    // Update FPV (main) camera - position inside the player model
    // and rotated exactly with player rotation
    this.mainCamera.position.copy(playerPosition);
    // Offset slightly upward to represent eyes/camera position
    this.mainCamera.position.y += 0.5;
    
    // Apply player rotation directly to camera
    this.mainCamera.quaternion.setFromEuler(
      new THREE.Euler(playerRotation.x, playerRotation.y, playerRotation.z, 'YXZ')
    );
    
    // Update chase camera (behind player)
    const cameraDistance = 10;
    const cameraHeight = 3;
    const cameraOffset = new THREE.Vector3(
      0,
      cameraHeight,
      cameraDistance
    );
    
    // Apply the rotation to the chase camera offset
    cameraOffset.applyEuler(new THREE.Euler(0, playerRotation.y, 0));
    
    // Set the chase camera position
    this.chaseCamera.position.copy(playerPosition).add(cameraOffset);
    this.chaseCamera.lookAt(playerPosition);
    
    // Update orbit camera (rotating around player)
    this.orbitAngle += this.orbitSpeed * deltaTime;
    
    const orbitDistance = 15;
    const orbitHeight = 8;
    const orbitX = Math.cos(this.orbitAngle) * orbitDistance;
    const orbitZ = Math.sin(this.orbitAngle) * orbitDistance;
    
    this.orbitCamera.position.set(
      playerPosition.x + orbitX,
      playerPosition.y + orbitHeight,
      playerPosition.z + orbitZ
    );
    this.orbitCamera.lookAt(playerPosition);
  }
  
  /**
   * Handle player joining the game
   */
  private handlePlayerJoin(id: string, position: THREE.Vector3, color: THREE.Color): void {
    console.log(`handlePlayerJoin called for ${id} at position:`, position);
    if (id !== this.localPlayer.getId() && !this.players.has(id)) {
      console.log(`Creating new player object for ${id} with color:`, color);
      const player = new Player(id, false);
      player.setPosition(position);
      player.setColor(color);
      this.scene.add(player.getObject());
      console.log(`Added player ${id} to scene. Current player count:`, this.players.size + 1);
      this.players.set(id, player);
    } else {
      console.log(`Skipping player join for ${id}. Local player: ${this.localPlayer.getId()}, Already exists: ${this.players.has(id)}`);
    }
  }
  
  /**
   * Handle player leaving the game
   */
  private handlePlayerLeave(id: string): void {
    if (this.players.has(id)) {
      console.log(`Player ${id} left`);
      const player = this.players.get(id);
      if (player) {
        this.scene.remove(player.getObject());
        this.players.delete(id);
      }
    }
  }
  
  /**
   * Update player position from network data
   */
  private updatePlayerPosition(id: string, position: THREE.Vector3): void {
    if (this.players.has(id)) {
      const player = this.players.get(id);
      if (player) {
        player.setPosition(position);
      }
    }
  }
  
  /**
   * Handle window resize event
   */
  private onWindowResize = (): void => {
    // Update main camera aspect ratio
    this.mainCamera.aspect = window.innerWidth / window.innerHeight;
    this.mainCamera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // No need to resize PIP cameras as they maintain square aspect ratio
  }
  
  /**
   * Handle key down events for player movement
   */
  private onKeyDown = (event: KeyboardEvent): void => {
    console.log('Key down:', event.code);
    this.localPlayer.getInputManager().handleKeyDown(event);

    // Handle special actions
    const action = getActionFromKeyCode(event.code);
    if (action === InputAction.VERIFY_STATE) {
      event.preventDefault();
      this.networkManager.verifyClientState();
      console.log('State verification requested...');
    }
  }
  
  /**
   * Handle key up events for player movement
   */
  private onKeyUp = (event: KeyboardEvent): void => {
    console.log('Key up:', event.code);
    this.localPlayer.getInputManager().handleKeyUp(event);
  }
  
  /**
   * Handle connection status changes
   */
  private handleConnectionStatus(status: ConnectionStatus, error?: Error): void {
    console.log(`Connection status: ${status}`, error || '');
    
    // You can add UI indicators here to show connection status
    if (status === 'connected') {
      console.log('Successfully connected to multiplayer server');
    } else if (status === 'disconnected') {
      console.log('Disconnected from multiplayer server');
    } else if (status === 'error') {
      console.error('Error connecting to multiplayer server:', error);
    }
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
    
    // Update all camera positions
    this.updateCameraPositions(deltaTime);
    
    // Send player position update to network
    this.networkManager.sendPositionUpdate(this.localPlayer.getPosition());
    
    // Render the main view
    this.renderer.render(this.scene, this.mainCamera);
    
    // Render the chase camera PIP
    this.chasePipRenderer.render(this.scene, this.chaseCamera);
    
    // Render the orbit camera PIP
    this.orbitPipRenderer.render(this.scene, this.orbitCamera);
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
    window.removeEventListener('resize', this.onWindowResize);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('keydown', this.updateControlDisplay);
    document.removeEventListener('keyup', this.updateControlDisplay);
    
    // Disconnect from network
    this.networkManager.disconnect();
    
    // Dispose of Three.js resources
    this.renderer.dispose();
    this.chasePipRenderer.dispose();
    this.orbitPipRenderer.dispose();
  }

  /**
   * Add drone controls display (two grids) at the bottom center of the screen
   */
  private addControlsDisplay(container: HTMLElement): void {
    const displayContainer = document.createElement('div');
    displayContainer.style.position = 'absolute';
    displayContainer.style.bottom = '20px';
    displayContainer.style.left = '50%';
    displayContainer.style.transform = 'translateX(-50%)';
    displayContainer.style.display = 'flex';
    displayContainer.style.gap = '30px';
    displayContainer.style.zIndex = '100';
    
    // Movement Controls Grid (W/S/R/F)
    const movementGrid = this.createControlGrid([
      { label: '', key: '' },
      { label: 'W', key: 'KeyW', tooltip: 'Up' },
      { label: '', key: '' },
      { label: 'R', key: 'KeyR', tooltip: 'Forward' },
      { label: 'A', key: 'KeyA', tooltip: 'Yaw Left' },
      { label: 'S', key: 'KeyS', tooltip: 'Down' },
      { label: 'D', key: 'KeyD', tooltip: 'Yaw Right' },
      { label: 'F', key: 'KeyF', tooltip: 'Backward' }
    ], 'Movement');
    
    // Attitude Controls Grid (I/J/K/L)
    const attitudeGrid = this.createControlGrid([
      { label: '', key: '' },
      { label: 'I', key: 'KeyI', tooltip: 'Pitch Down' },
      { label: '', key: '' },
      { label: '', key: '' },
      { label: 'J', key: 'KeyJ', tooltip: 'Roll Left' },
      { label: 'K', key: 'KeyK', tooltip: 'Pitch Up' },
      { label: 'L', key: 'KeyL', tooltip: 'Roll Right' },
      { label: '', key: '' }
    ], 'Attitude');
    
    displayContainer.appendChild(movementGrid);
    displayContainer.appendChild(attitudeGrid);
    container.appendChild(displayContainer);
    
    // Store references to the control elements to update them in the animate loop
    this.controlElements = new Map();
    
    // Add event listener to update the control display
    document.addEventListener('keydown', this.updateControlDisplay);
    document.addEventListener('keyup', this.updateControlDisplay);
  }

  /**
   * Create a control grid for the drone display
   */
  private createControlGrid(buttons: Array<{label: string, key: string, tooltip?: string}>, title: string): HTMLElement {
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'flex';
    gridContainer.style.flexDirection = 'column';
    gridContainer.style.alignItems = 'center';
    gridContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    gridContainer.style.borderRadius = '10px';
    gridContainer.style.padding = '10px';
    
    // Add title
    const gridTitle = document.createElement('div');
    gridTitle.textContent = title;
    gridTitle.style.color = 'white';
    gridTitle.style.fontFamily = 'monospace';
    gridTitle.style.marginBottom = '8px';
    gridTitle.style.fontSize = '14px';
    gridTitle.style.fontWeight = 'bold';
    gridContainer.appendChild(gridTitle);
    
    // Create the grid
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 45px)';
    grid.style.gridTemplateRows = 'repeat(3, 45px)';
    grid.style.gap = '5px';
    
    buttons.forEach(({ label, key, tooltip }) => {
      const button = document.createElement('div');
      button.style.width = '45px';
      button.style.height = '45px';
      button.style.backgroundColor = 'rgba(40, 40, 40, 0.7)';
      button.style.border = '1px solid rgba(100, 100, 100, 0.5)';
      button.style.borderRadius = '5px';
      button.style.display = 'flex';
      button.style.justifyContent = 'center';
      button.style.alignItems = 'center';
      button.style.color = 'white';
      button.style.fontFamily = 'monospace';
      button.style.fontSize = '18px';
      button.style.fontWeight = 'bold';
      button.style.userSelect = 'none';
      button.style.position = 'relative';
      button.textContent = label;
      
      // Add tooltip if provided
      if (tooltip && label) {
        const tooltipElement = document.createElement('div');
        tooltipElement.textContent = tooltip;
        tooltipElement.style.position = 'absolute';
        tooltipElement.style.bottom = '-18px';
        tooltipElement.style.left = '50%';
        tooltipElement.style.transform = 'translateX(-50%)';
        tooltipElement.style.fontSize = '10px';
        tooltipElement.style.color = 'rgba(255, 255, 255, 0.7)';
        tooltipElement.style.whiteSpace = 'nowrap';
        button.appendChild(tooltipElement);
      }
      
      if (key) {
        // Store the element reference for active key highlighting
        this.controlElements.set(key, button);
      }
      
      grid.appendChild(button);
    });
    
    gridContainer.appendChild(grid);
    return gridContainer;
  }

  /**
   * Update the control display based on key events
   */
  private updateControlDisplay = (event: KeyboardEvent): void => {
    const isKeyDown = event.type === 'keydown';
    const keyCode = event.code;
    
    // Only process if we have this key in our control elements
    if (this.controlElements.has(keyCode)) {
      const button = this.controlElements.get(keyCode);
      if (button) {
        if (isKeyDown) {
          button.style.backgroundColor = 'rgba(0, 200, 100, 0.8)';
          button.style.boxShadow = '0 0 10px rgba(0, 255, 100, 0.7)';
          button.style.transform = 'scale(1.1)';
          button.style.border = '1px solid rgba(0, 255, 100, 0.9)';
        } else {
          button.style.backgroundColor = 'rgba(40, 40, 40, 0.7)';
          button.style.boxShadow = 'none';
          button.style.transform = 'scale(1)';
          button.style.border = '1px solid rgba(100, 100, 100, 0.5)';
        }
      }
    }
  }
} 