/**
 * Three.js Scene Manager for Neon Dominance game
 * Handles 3D scene with spinning cube and hidden d20 die
 */
import * as THREE from 'three';

export class ThreeScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cube: THREE.LineSegments;
  private glowingEdges: THREE.LineSegments;
  private d20: THREE.Mesh;
  private animating: boolean = false;
  private d20FollowingMouse: boolean = false;
  private controls: {
    mouseX: number;
    mouseY: number;
    lastX: number;
    lastY: number;
    isRotating: boolean;
  } = {
    mouseX: 0,
    mouseY: 0,
    lastX: 0,
    lastY: 0,
    isRotating: false,
  };

  /**
   * Initialize the Three.js scene
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

    // Add a neon cyberpunk feel to the background
    this.scene.background = new THREE.Color(0x0a0a14);

    // Add a subtle fog for depth
    this.scene.fog = new THREE.FogExp2(0x0a0a14, 0.01);

    // Set up the camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      globalThis.innerWidth / globalThis.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.z = 5;

    // Set up the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);
    this.renderer.setPixelRatio(globalThis.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Set up lighting
    const ambientLight = new THREE.AmbientLight(0x333333);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);

    // Create a cube with neon wireframe
    const geometry = new THREE.BoxGeometry(3, 3, 3);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9,
      linewidth: 2,
    });
    this.cube = new THREE.LineSegments(edges, material);
    this.scene.add(this.cube);

    // Create a glowing edge effect
    const glowGeometry = new THREE.BoxGeometry(3.05, 3.05, 3.05);
    const glowEdges = new THREE.EdgesGeometry(glowGeometry);
    const glowMaterial = new THREE.LineBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.4,
      linewidth: 1,
    });
    this.glowingEdges = new THREE.LineSegments(glowEdges, glowMaterial);
    this.scene.add(this.glowingEdges);

    // Create a hidden d20 die (icosahedron)
    const d20Geometry = new THREE.IcosahedronGeometry(0.7);
    const d20Material = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      emissive: 0x330033,
      shininess: 100,
      transparent: true,
      opacity: 0.1,
      flatShading: true,
    });
    this.d20 = new THREE.Mesh(d20Geometry, d20Material);
    this.d20.position.set(15, 5, -10);
    this.scene.add(this.d20);

    // Add event listeners
    globalThis.addEventListener('resize', this.onWindowResize.bind(this));
    container.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  /**
   * Start the animation loop
   */
  public start(): void {
    if (!this.animating) {
      this.animating = true;
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

    // Rotate the cube
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;

    // Rotate the glowing edges
    this.glowingEdges.rotation.x = this.cube.rotation.x;
    this.glowingEdges.rotation.y = this.cube.rotation.y;

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize event
   */
  private onWindowResize(): void {
    this.camera.aspect = globalThis.innerWidth / globalThis.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);
  }

  /**
   * Handle mouse down event
   */
  private onMouseDown(event: MouseEvent): void {
    this.controls.isRotating = true;
    this.controls.lastX = event.clientX;
    this.controls.lastY = event.clientY;
  }

  /**
   * Handle mouse move event
   */
  private onMouseMove(event: MouseEvent): void {
    this.controls.mouseX = event.clientX;
    this.controls.mouseY = event.clientY;

    if (this.controls.isRotating) {
      const deltaX = this.controls.mouseX - this.controls.lastX;
      const deltaY = this.controls.mouseY - this.controls.lastY;

      this.cube.rotation.y += deltaX * 0.01;
      this.cube.rotation.x += deltaY * 0.01;

      this.glowingEdges.rotation.y = this.cube.rotation.y;
      this.glowingEdges.rotation.x = this.cube.rotation.x;

      this.controls.lastX = this.controls.mouseX;
      this.controls.lastY = this.controls.mouseY;
    }

    if (this.d20FollowingMouse) {
      // Convert mouse position to 3D coordinates
      const mouseX = (event.clientX / globalThis.innerWidth) * 2 - 1;
      const mouseY = -(event.clientY / globalThis.innerHeight) * 2 + 1;

      // Update d20 position
      this.d20.position.x = mouseX * 5;
      this.d20.position.y = mouseY * 3;
      this.d20.position.z = 0;

      // Rotate the d20
      this.d20.rotation.x += 0.05;
      this.d20.rotation.y += 0.05;
    }
  }

  /**
   * Handle mouse up event
   */
  private onMouseUp(): void {
    this.controls.isRotating = false;
  }

  /**
   * Clean up resources when the scene is destroyed
   */
  public dispose(): void {
    this.stop();

    // Clean up event listeners
    globalThis.removeEventListener('resize', this.onWindowResize.bind(this));

    // Dispose of geometries and materials
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();

        if (object.material instanceof Array) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    // Dispose of the renderer
    this.renderer.dispose();
  }
}
