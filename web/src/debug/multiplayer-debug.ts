import * as THREE from 'three';
import { Player as _Player } from '../open-world/player';
import { Socket, io } from 'socket.io-client';
import { GameEvent } from '../constants';
import { Position, Rotation, Color } from '../types';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface DebugState {
  [key: string]: unknown;
}

interface Material extends THREE.Material {
  isArrowMaterial?: boolean;
}

interface ThreeGlobal {
  OrbitControls: typeof OrbitControls;
}

/**
 * Debug tool for visualizing multiplayer synchronization issues
 * This class creates a visual representation of all players in the game
 * to help diagnose position and color update problems
 */
export class MultiplayerDebugger {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private socket: Socket;
  private playerObjects: Map<string, THREE.Object3D> = new Map();
  private playerData: Map<string, {
    position: Position;
    rotation: Rotation;
    color: Color;
    lastUpdate: number;
  }> = new Map();
  private localPlayerId: string = '';
  private debugInfo: HTMLElement;
  private isRunning: boolean = false;
  private orbitControls: OrbitControls;

  constructor(serverUrl: string, containerId: string) {
    // Get or create container
    const existingContainer = document.getElementById(containerId);
    if (existingContainer) {
      this.container = existingContainer;
    } else {
      this.container = document.createElement('div');
      this.container.id = containerId;
      document.body.appendChild(this.container);
    }

    // Set up basic THREE.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222222);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, 
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 15, 30);
    this.camera.lookAt(0, 0, 0);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(globalThis.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
    
    // Add debugging info panel
    this.debugInfo = document.createElement('div');
    this.debugInfo.style.position = 'absolute';
    this.debugInfo.style.top = '10px';
    this.debugInfo.style.left = '10px';
    this.debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.debugInfo.style.color = 'white';
    this.debugInfo.style.padding = '10px';
    this.debugInfo.style.borderRadius = '5px';
    this.debugInfo.style.fontFamily = 'monospace';
    this.debugInfo.style.fontSize = '12px';
    this.debugInfo.style.whiteSpace = 'pre';
    this.debugInfo.style.maxHeight = '80vh';
    this.debugInfo.style.maxWidth = '400px';
    this.debugInfo.style.overflow = 'auto';
    this.container.appendChild(this.debugInfo);
    
    // Create socket connection
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true
    });
    
    // Set up scene
    this.setupScene();
    
    // Set up socket event handlers
    this.setupSocketEvents();
    
    // Set up orbit controls if available
    this.setupControls();
    
    // Handle window resize
    globalThis.addEventListener('resize', () => this.handleResize());
  }
  
  /**
   * Set up the basic scene elements
   */
  private setupScene(): void {
    // Add a grid for reference
    const grid = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
    this.scene.add(grid);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    
    // Add directional light for shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 15, 10);
    this.scene.add(dirLight);
  }
  
  /**
   * Set up orbit controls if available
   */
  private setupControls(): void {
    // Try to import orbit controls dynamically
    try {
      // Check if OrbitControls is available globally (e.g. from a script tag)
      const OrbitControlsClass = (globalThis as unknown as ThreeGlobal).OrbitControls || (THREE as unknown as ThreeGlobal).OrbitControls;
      
      if (OrbitControlsClass) {
        this.orbitControls = new OrbitControlsClass(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;
      } else {
        console.warn('OrbitControls not available. Camera will be static.');
      }
    } catch (err) {
      console.warn('Could not initialize OrbitControls:', err);
    }
  }
  
  /**
   * Set up socket event handlers
   */
  private setupSocketEvents(): void {
    // Handle connection
    this.socket.on('connect', () => {
      console.log('Connected to server, socket ID:', this.socket.id);
      this.localPlayerId = this.socket.id || '';
      
      // Join the game
      this.socket.emit(GameEvent.PLAYER_JOIN, {
        position: { x: 0, y: 1, z: 0 }
      });
      
      this.updateDebugInfo();
    });
    
    // Handle disconnection
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.updateDebugInfo();
    });
    
    // Handle player joined
    this.socket.on(GameEvent.PLAYER_JOINED, (data: {
      id: string;
      position: Position;
      rotation: Rotation;
      color: Color;
    }) => {
      console.log('Player joined:', data.id);
      this.addOrUpdatePlayer(data);
      this.updateDebugInfo();
    });
    
    // Handle players list
    this.socket.on(GameEvent.PLAYERS_LIST, (playersList: Array<{
      id: string;
      position: Position;
      rotation: Rotation;
      color: Color;
    }>) => {
      console.log('Received players list:', playersList.length, 'players');
      playersList.forEach(data => this.addOrUpdatePlayer(data));
      this.updateDebugInfo();
    });
    
    // Handle player movement
    this.socket.on(GameEvent.PLAYER_MOVED, (data: {
      id: string;
      position: Position;
      rotation: Rotation;
    }) => {
      this.updatePlayerPosition(data);
      this.updateDebugInfo();
    });
    
    // Handle player left
    this.socket.on(GameEvent.PLAYER_LEFT, (playerId: string) => {
      console.log('Player left:', playerId);
      this.removePlayer(playerId);
      this.updateDebugInfo();
    });
    
    // Handle debug state updates from server
    this.socket.on('debug_state', (state: DebugState) => {
      console.log('Debug state:', state);
      this.updateServerDebugInfo(state);
    });
    
    // Handle color correction events
    this.socket.on('force_state_correction', (data: {
      color: Color;
      position: Position;
    }) => {
      console.log('Received force state correction:', data);
      
      // Update local player with server's authoritative data
      if (this.playerData.has(this.localPlayerId)) {
        const playerData = this.playerData.get(this.localPlayerId)!;
        playerData.color = data.color;
        playerData.position = data.position;
        playerData.lastUpdate = Date.now();
        
        // Update visual representation
        const object = this.playerObjects.get(this.localPlayerId);
        if (object) {
          object.position.set(data.position.x, data.position.y, data.position.z);
          this.updatePlayerColor(this.localPlayerId, data.color);
        }
      }
      
      this.updateDebugInfo();
    });
  }
  
  /**
   * Add or update a player in the scene
   */
  private addOrUpdatePlayer(data: {
    id: string;
    position: Position;
    rotation: Rotation;
    color: Color;
  }): void {
    // Store player data
    this.playerData.set(data.id, {
      position: data.position,
      rotation: data.rotation,
      color: data.color,
      lastUpdate: Date.now()
    });
    
    // Check if player already exists
    if (this.playerObjects.has(data.id)) {
      // Update existing player
      const object = this.playerObjects.get(data.id)!;
      object.position.set(data.position.x, data.position.y, data.position.z);
      this.updatePlayerColor(data.id, data.color);
      return;
    }
    
    // Create a new player representation
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
    const material = new THREE.MeshLambertMaterial({
      color: new THREE.Color(data.color.r, data.color.g, data.color.b)
    });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(data.position.x, data.position.y, data.position.z);
    
    // Add directional indicator (arrow)
    const arrowGeometry = new THREE.ConeGeometry(0.3, 1, 8);
    const arrowMaterial = new THREE.MeshLambertMaterial({
      color: 0xFFFFFF
    });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.position.set(0, 0, 0.7);
    arrow.rotation.x = Math.PI / 2;
    
    // Create group to hold everything
    const group = new THREE.Group();
    group.add(cylinder);
    group.add(arrow);
    
    // Add player ID text
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(data.id.substring(0, 6), 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    const textGeometry = new THREE.PlaneGeometry(2, 0.5);
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 1.5, 0);
    textMesh.rotation.y = Math.PI / 2;
    group.add(textMesh);
    
    // Highlight local player
    if (data.id === this.localPlayerId) {
      const highlightGeometry = new THREE.RingGeometry(1.2, 1.3, 16);
      const highlightMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF00,
        side: THREE.DoubleSide
      });
      const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
      highlightMesh.rotation.x = Math.PI / 2;
      highlightMesh.position.y = -1;
      group.add(highlightMesh);
    }
    
    // Set position and rotation
    group.position.set(data.position.x, data.position.y, data.position.z);
    
    // Apply rotation
    const euler = new THREE.Euler(
      data.rotation.x,
      data.rotation.y,
      data.rotation.z,
      'YXZ'
    );
    group.quaternion.setFromEuler(euler);
    
    // Add to scene and track
    this.scene.add(group);
    this.playerObjects.set(data.id, group);
  }
  
  /**
   * Update a player's position
   */
  private updatePlayerPosition(data: {
    id: string;
    position: Position;
    rotation: Rotation;
  }): void {
    // Update stored data
    if (this.playerData.has(data.id)) {
      const playerData = this.playerData.get(data.id)!;
      playerData.position = data.position;
      playerData.rotation = data.rotation;
      playerData.lastUpdate = Date.now();
    } else {
      // If we don't have data for this player yet, create a placeholder
      this.playerData.set(data.id, {
        position: data.position,
        rotation: data.rotation,
        color: { r: 0.5, g: 0.5, b: 0.5 },  // Default gray
        lastUpdate: Date.now()
      });
    }
    
    // Update visual representation
    const object = this.playerObjects.get(data.id);
    if (object) {
      // Smoothly interpolate to new position
      const targetPosition = new THREE.Vector3(
        data.position.x,
        data.position.y,
        data.position.z
      );
      
      // Set position directly for now (can add interpolation later)
      object.position.copy(targetPosition);
      
      // Set rotation
      const euler = new THREE.Euler(
        data.rotation.x,
        data.rotation.y,
        data.rotation.z,
        'YXZ'
      );
      object.quaternion.setFromEuler(euler);
    }
  }
  
  /**
   * Update a player's color
   */
  private updatePlayerColor(id: string, color: Color): void {
    const object = this.playerObjects.get(id);
    if (!object) return;
    
    // Find mesh in the group and update its material
    object.traverse(child => {
      if (child instanceof THREE.Mesh && 
          child.material instanceof THREE.MeshLambertMaterial &&
          !(child.material as Material).isArrowMaterial) {
        child.material.color.setRGB(color.r, color.g, color.b);
      }
    });
  }
  
  /**
   * Remove a player from the scene
   */
  private removePlayer(id: string): void {
    const object = this.playerObjects.get(id);
    if (object) {
      this.scene.remove(object);
      this.playerObjects.delete(id);
    }
    
    this.playerData.delete(id);
  }
  
  /**
   * Update debug info panel with current state
   */
  private updateDebugInfo(): void {
    let info = `Server URL: ${this.socket.io.uri || 'unknown'}\n`;
    info += `Socket ID: ${this.socket.id}\n`;
    info += `Connected: ${this.socket.connected}\n`;
    info += `Players: ${this.playerData.size}\n\n`;
    
    info += 'PLAYER LIST:\n';
    this.playerData.forEach((data, id) => {
      const isLocal = id === this.localPlayerId;
      const age = Date.now() - data.lastUpdate;
      
      info += `${isLocal ? '* ' : '  '}${id.substring(0, 6)}: `;
      info += `pos: (${data.position.x.toFixed(1)}, ${data.position.y.toFixed(1)}, ${data.position.z.toFixed(1)}) | `;
      info += `color: rgb(${Math.floor(data.color.r * 255)}, ${Math.floor(data.color.g * 255)}, ${Math.floor(data.color.b * 255)}) | `;
      info += `update: ${age}ms ago\n`;
    });
    
    this.debugInfo.textContent = info;
  }
  
  /**
   * Update debug info with server state
   */
  private updateServerDebugInfo(state: DebugState): void {
    // Add server state information to the debug panel
    if (!state) return;
    
    let serverInfo = '\n\nSERVER STATE:\n';
    serverInfo += `Players: ${state.players?.length || 0}\n`;
    
    if (state.colorPool) {
      serverInfo += `Color Pool: `;
      serverInfo += `available: ${state.colorPool.available?.length || 0}, `;
      serverInfo += `locked: ${state.colorPool.locked?.length || 0}, `;
      serverInfo += `random: ${state.colorPool.random?.length || 0}\n`;
    }
    
    if (state.diagnostics) {
      serverInfo += `Connections: ${state.diagnostics.connections || 0}\n`;
      serverInfo += `Messages: ${state.diagnostics.totalMessages || 0}\n`;
    }
    
    // Append server info to the existing debug info
    this.debugInfo.textContent += serverInfo;
  }
  
  /**
   * Handle window resize
   */
  private handleResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }
  
  /**
   * Animation loop
   */
  private animate(): void {
    if (!this.isRunning) return;
    
    requestAnimationFrame(() => this.animate());
    
    // Update controls if available
    if (this.orbitControls) {
      this.orbitControls.update();
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Request a debug state update from the server
   */
  public requestDebugState(): void {
    this.socket.emit('request_debug_state');
  }
  
  /**
   * Send a position update to the server
   */
  public sendPositionUpdate(position: Position, rotation: Rotation): void {
    this.socket.emit(GameEvent.POSITION_UPDATE, {
      position,
      rotation
    });
  }
  
  /**
   * Start the debugger
   */
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.animate();
    
    // Start requesting debug state periodically
    setInterval(() => {
      this.requestDebugState();
    }, 2000);
  }
  
  /**
   * Stop the debugger
   */
  public stop(): void {
    this.isRunning = false;
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    this.stop();
    
    // Disconnect socket
    this.socket.disconnect();
    
    // Remove event listeners
    globalThis.removeEventListener('resize', () => this.handleResize());
    
    // Clean up THREE.js resources
    this.playerObjects.forEach(object => {
      object.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    });
    
    // Clean up DOM
    this.container.removeChild(this.renderer.domElement);
    this.container.removeChild(this.debugInfo);
  }
}

// Helper to create a debugger instance easily
export function createMultiplayerDebugger(serverUrl: string, containerId: string = 'multiplayer-debug'): MultiplayerDebugger {
  const debuggerInstance = new MultiplayerDebugger(serverUrl, containerId);
  debuggerInstance.start();
  return debuggerInstance;
}

// Add to global scope for debugging
declare global {
  var createMultiplayerDebugger: typeof createMultiplayerDebugger;
}
globalThis.createMultiplayerDebugger = createMultiplayerDebugger; 