import * as THREE from 'three';
import { Player } from './player';
import { WorldManager } from './world-manager';
import { NetworkManager } from './network-manager';
import { ConnectionStatus } from '../types';
import { GameEvent, GameEventPayloads } from '../constants';
import { InputAction, getActionFromKeyCode } from '../constants/input';
import { ControlsDisplay } from '../ui/controls/controls-display';
import { JoystickConfig } from '../ui/controls/joystick-display';

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
  
  // Controls display
  private controlsDisplay!: ControlsDisplay; // Using definite assignment assertion
  
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
      globalThis.innerWidth / globalThis.innerHeight,
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
    this.renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);
    this.renderer.setPixelRatio(globalThis.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Set up PIP renderers
    const pipSize = 200; // Size of PIP displays
    
    // Chase camera PIP
    this.chasePipRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.chasePipRenderer.setSize(pipSize, pipSize);
    this.chasePipRenderer.setPixelRatio(globalThis.devicePixelRatio);
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
    this.orbitPipRenderer.setPixelRatio(globalThis.devicePixelRatio);
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
    
    // Set up network event listeners
    this.setupNetworkEvents();
    
    // Connect to the server
    this.networkManager.connect();
    
    // Set up event listeners
    globalThis.addEventListener('resize', this.onWindowResize);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);

    // Add instructions
    this.addControlsInstructions(container);
    
    // Set up and add the controls display
    this.setupControlsDisplay(container);
    
    // Start the animation loop
    this.animating = true;
    this.lastTime = performance.now();
    this.animate();
  }

  /**
   * Set up the controls display with joysticks
   */
  private setupControlsDisplay(container: HTMLElement): void {
    // Create the controls display
    this.controlsDisplay = new ControlsDisplay(container, this.localPlayer.getInputManager());
    
    // Movement Controls Stick configuration
    const movementConfig: JoystickConfig = {
      title: 'Movement',
      axes: {
        vertical: { up: 'KeyW', down: 'KeyS' },
        horizontal: { left: 'KeyA', right: 'KeyD' }
      },
      labels: [
        { key: 'KeyW', label: 'W', position: 'top' },
        { key: 'KeyS', label: 'S', position: 'bottom' },
        { key: 'KeyA', label: 'A', position: 'left' },
        { key: 'KeyD', label: 'D', position: 'right' }
      ]
    };
    
    // Attitude Controls Stick configuration
    const attitudeConfig: JoystickConfig = {
      title: 'Attitude',
      axes: {
        vertical: { up: 'KeyI', down: 'KeyK' },
        horizontal: { left: 'KeyJ', right: 'KeyL' }
      },
      labels: [
        { key: 'KeyI', label: 'I', position: 'top' },
        { key: 'KeyK', label: 'K', position: 'bottom' },
        { key: 'KeyJ', label: 'J', position: 'left' },
        { key: 'KeyL', label: 'L', position: 'right' }
      ]
    };
    
    // Add joysticks to the controls display
    this.controlsDisplay.addJoystick('movement', movementConfig);
    this.controlsDisplay.addJoystick('attitude', attitudeConfig);
    
    // Start the controls display update loop
    this.controlsDisplay.start();
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
    this.mainCamera.aspect = globalThis.innerWidth / globalThis.innerHeight;
    this.mainCamera.updateProjectionMatrix();
    this.renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);
    
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
      // Initialize world with random data if disconnected
      this.worldManager.initializeWithRandomData();
    } else if (status === 'error') {
      console.error('Error connecting to multiplayer server:', error);
      // Initialize world with random data if connection error
      this.worldManager.initializeWithRandomData();
    }
  }
  
  /**
   * Set up network event listeners
   */
  private setupNetworkEvents(): void {
    // Listen for connection status updates
    this.networkManager.on(GameEvent.CONNECTION_STATUS, (status: GameEventPayloads[typeof GameEvent.CONNECTION_STATUS]) => {
      console.log(`Connection status: ${status}`);
    });
    
    // Listen for player moves (local tracking for animation)
    this.networkManager.on(GameEvent.PLAYER_MOVED, () => {
      // We handle this via direct callback instead
    });
    
    // Listen for map data from server
    this.networkManager.on(GameEvent.MAP_DATA, (mapData: GameEventPayloads[typeof GameEvent.MAP_DATA]) => {
      console.log('Initializing world with server map data');
      this.worldManager.initializeWithMapData(mapData);
    });
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
    globalThis.removeEventListener('resize', this.onWindowResize);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    
    // Dispose of controls display
    if (this.controlsDisplay) {
      this.controlsDisplay.dispose();
    }
    
    // Disconnect from network and destroy manager
    this.networkManager.destroy();
    
    // Clean up all players
    this.players.forEach(player => {
      this.scene.remove(player.getObject());
      player.dispose();
    });
    this.players.clear();
    
    // Clean up local player
    this.scene.remove(this.localPlayer.getObject());
    this.localPlayer.dispose();
    
    // Clean up Three.js resources
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
    
    this.renderer.dispose();
    this.chasePipRenderer.dispose();
    this.orbitPipRenderer.dispose();
    
    // Remove all DOM elements
    const container = document.getElementById('open-world-container');
    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
  }
} 