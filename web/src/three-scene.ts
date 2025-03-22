/**
 * Three.js Scene Manager for Neon Dominance game
 * Handles 3D scene with spinning cube and hidden teapot
 */
import * as THREE from 'three';

export class ThreeScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cube: THREE.LineSegments;
  private teapot: THREE.Mesh;
  private animating: boolean = false;
  private controls: { mouseX: number; mouseY: number; lastX: number; lastY: number; isRotating: boolean } = {
    mouseX: 0,
    mouseY: 0,
    lastX: 0,
    lastY: 0,
    isRotating: false
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
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Set up the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
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
      linewidth: 2
    });
    this.cube = new THREE.LineSegments(edges, material);
    this.scene.add(this.cube);

    // Add a subtle pulsating internal cube for effect
    const innerGeometry = new THREE.BoxGeometry(2.9, 2.9, 2.9);
    const innerMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.2,
      wireframe: true
    });
    const innerCube = new THREE.Mesh(innerGeometry, innerMaterial);
    this.scene.add(innerCube);

    // Add stronger point lights for better visibility
    const pointLight1 = new THREE.PointLight(0x00ffff, 2, 20);
    pointLight1.position.set(2, 1, 2);
    this.scene.add(pointLight1);

    // Add another light for contrast
    const pointLight2 = new THREE.PointLight(0xff00ff, 2, 20);
    pointLight2.position.set(-2, 1, -2);
    this.scene.add(pointLight2);

    // Add a spotlight to highlight the cube
    const spotlight = new THREE.SpotLight(0xffffff, 1.5);
    spotlight.position.set(0, 5, 5);
    spotlight.target = this.cube;
    spotlight.angle = 0.3;
    spotlight.penumbra = 0.3;
    this.scene.add(spotlight);

    // Create a hidden teapot
    // We'll use a simplified proxy geometry since the TeapotGeometry requires extra imports
    const teapotGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const teapotMaterial = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      emissive: 0x330033,
      shininess: 100,
      transparent: true,
      opacity: 0.1
    });
    this.teapot = new THREE.Mesh(teapotGeometry, teapotMaterial);
    // Hide the teapot somewhere in the scene
    this.teapot.position.set(15, 5, -10);
    this.teapot.scale.set(0.5, 0.5, 0.5);
    this.scene.add(this.teapot);

    // Add particle system for cyberpunk effect
    this.addParticles();

    // Add event listeners for window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Add event listeners for mouse interaction
    container.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));

    // Add easter egg - "hack" button to reveal teapot
    this.addHackButton();
  }

  /**
   * Add a cyberpunk particle system
   */
  private addParticles(): void {
    const particleCount = 300;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      // Create a sphere of particles
      const radius = 20 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i+1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i+2] = radius * Math.cos(phi);
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    this.scene.add(particleSystem);
  }

  /**
   * Add a hidden "hack" button to reveal the teapot
   */
  private addHackButton(): void {
    const hackButton = document.createElement('button');
    hackButton.style.position = 'fixed';
    hackButton.style.bottom = '10px';
    hackButton.style.right = '10px';
    hackButton.style.padding = '5px 10px';
    hackButton.style.fontSize = '10px';
    hackButton.style.background = 'transparent';
    hackButton.style.color = '#121212'; // Almost invisible
    hackButton.style.border = '1px solid #121212'; // Almost invisible
    hackButton.style.borderRadius = '3px';
    hackButton.style.cursor = 'pointer';
    hackButton.style.fontFamily = 'monospace';
    hackButton.style.opacity = '0.1';
    hackButton.textContent = 'HACK';
    
    hackButton.addEventListener('click', () => {
      // Reveal the teapot by animating it to center
      const revealTeapot = () => {
        if (!this.teapot) return;
        
        // Change material to make it visible
        (this.teapot.material as THREE.MeshPhongMaterial).opacity = 0.9;
        (this.teapot.material as THREE.MeshPhongMaterial).color.set(0xff00ff);
        (this.teapot.material as THREE.MeshPhongMaterial).emissive.set(0x330033);
        
        // Animate it to a visible position
        const targetPosition = new THREE.Vector3(0, 0, 0);
        const duration = 2000; // ms
        const startPosition = this.teapot.position.clone();
        const startTime = Date.now();
        
        const animateTeapot = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Use easing function for smooth motion
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          
          this.teapot.position.lerpVectors(
            startPosition,
            targetPosition,
            easedProgress
          );
          
          this.teapot.rotation.x += 0.05;
          this.teapot.rotation.y += 0.05;
          
          if (progress < 1) {
            requestAnimationFrame(animateTeapot);
          }
        };
        
        // Start animation
        requestAnimationFrame(animateTeapot);
        
        // Display message
        console.log("%cYou found the hidden teapot! Neon Dominance easter egg unlocked!", 
          "color: #ff00ff; font-weight: bold; font-size: 16px;");
      };
      
      revealTeapot();
      
      // Remove the button after click
      document.body.removeChild(hackButton);
    });
    
    document.body.appendChild(hackButton);
  }

  /**
   * Start the animation loop
   */
  public start(): void {
    if (this.animating) return;
    this.animating = true;
    this.animate();
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

    // Add a subtle pulsating effect
    const time = Date.now() * 0.001; // time in seconds
    this.cube.scale.x = 1 + 0.05 * Math.sin(time * 2);
    this.cube.scale.y = 1 + 0.05 * Math.sin(time * 2);
    this.cube.scale.z = 1 + 0.05 * Math.sin(time * 2);

    // Slowly rotate the teapot
    this.teapot.rotation.x += 0.01;
    this.teapot.rotation.y += 0.01;

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
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
    if (!this.controls.isRotating) return;

    const deltaX = event.clientX - this.controls.lastX;
    const deltaY = event.clientY - this.controls.lastY;

    this.controls.lastX = event.clientX;
    this.controls.lastY = event.clientY;

    this.controls.mouseX += deltaX * 0.01;
    this.controls.mouseY += deltaY * 0.01;

    // Update the cube rotation based on mouse movement
    this.cube.rotation.y = this.controls.mouseX;
    this.cube.rotation.x = this.controls.mouseY;
  }

  /**
   * Handle mouse up event
   */
  private onMouseUp(): void {
    this.controls.isRotating = false;
  }

  /**
   * Disposes of Three.js resources
   */
  public dispose(): void {
    this.stop();
    
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    
    // Dispose of geometries and materials
    if (this.cube) {
      if (this.cube.geometry) this.cube.geometry.dispose();
      if (this.cube.material) {
        if (Array.isArray(this.cube.material)) {
          this.cube.material.forEach(material => material.dispose());
        } else {
          this.cube.material.dispose();
        }
      }
    }
    
    if (this.teapot) {
      if (this.teapot.geometry) this.teapot.geometry.dispose();
      if (this.teapot.material) {
        if (Array.isArray(this.teapot.material)) {
          this.teapot.material.forEach(material => material.dispose());
        } else {
          this.teapot.material.dispose();
        }
      }
    }
    
    // Remove renderer
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
} 