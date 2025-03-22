import * as THREE from 'three';

export class WorldManager {
  private scene: THREE.Scene;
  private worldSize: number = 100;
  private gridSize: number = 1;
  private obstacles: THREE.Object3D[] = [];

  /**
   * Create a new world manager
   * @param scene The Three.js scene to add world elements to
   */
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initialize();
  }

  /**
   * Initialize the world
   */
  private initialize(): void {
    // Create the ground
    this.createGround();
    
    // Create obstacles
    this.createObstacles();
    
    // Add a skybox
    this.createSkybox();
  }

  /**
   * Create the ground plane
   */
  private createGround(): void {
    // Create a ground plane
    const geometry = new THREE.PlaneGeometry(this.worldSize, this.worldSize, this.worldSize / this.gridSize, this.worldSize / this.gridSize);
    const material = new THREE.MeshStandardMaterial({
      color: 0x88aa88,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true
    });
    
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // Add a grid helper for visual reference
    const gridHelper = new THREE.GridHelper(this.worldSize, this.worldSize / this.gridSize, 0x000000, 0x444444);
    gridHelper.position.y = 0.01; // Slightly above the ground to avoid z-fighting
    this.scene.add(gridHelper);
  }

  /**
   * Create obstacles in the world
   */
  private createObstacles(): void {
    // Create some random obstacles - cubes and cylinders
    for (let i = 0; i < 20; i++) {
      this.createRandomObstacle();
    }
  }

  /**
   * Create a random obstacle
   */
  private createRandomObstacle(): void {
    // Decide on shape type
    const shapeType = Math.random() > 0.5 ? 'cube' : 'cylinder';
    
    let geometry: THREE.BufferGeometry;
    let position: THREE.Vector3;
    let scale: THREE.Vector3;
    
    // Generate random position
    const x = (Math.random() - 0.5) * (this.worldSize - 10);
    const z = (Math.random() - 0.5) * (this.worldSize - 10);
    
    if (shapeType === 'cube') {
      // Create a cube with random size
      const size = 0.5 + Math.random() * 2;
      geometry = new THREE.BoxGeometry(size, size, size);
      position = new THREE.Vector3(x, size / 2, z);
      scale = new THREE.Vector3(1, 1 + Math.random() * 3, 1);
    } else {
      // Create a cylinder with random height and radius
      const radius = 0.5 + Math.random() * 1;
      const height = 1 + Math.random() * 3;
      geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
      position = new THREE.Vector3(x, height / 2, z);
      scale = new THREE.Vector3(1, 1, 1);
    }
    
    // Random color
    const hue = Math.random();
    const color = new THREE.Color().setHSL(hue, 0.7, 0.5);
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.3
    });
    
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.copy(position);
    obstacle.scale.copy(scale);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    
    this.scene.add(obstacle);
    this.obstacles.push(obstacle);
  }

  /**
   * Create a simple skybox
   */
  private createSkybox(): void {
    // Create a large sphere with sky gradient
    const geometry = new THREE.SphereGeometry(this.worldSize * 0.9, 32, 32);
    
    // Create a shader material for a gradient sky
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `;
    
    const uniforms = {
      topColor: { value: new THREE.Color(0x0077ff) },
      bottomColor: { value: new THREE.Color(0xffffff) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    };
    
    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
      side: THREE.BackSide
    });
    
    const skybox = new THREE.Mesh(geometry, material);
    this.scene.add(skybox);
  }

  /**
   * Get all obstacles in the world
   */
  public getObstacles(): THREE.Object3D[] {
    return this.obstacles;
  }

  /**
   * Get the world size
   */
  public getWorldSize(): number {
    return this.worldSize;
  }
} 