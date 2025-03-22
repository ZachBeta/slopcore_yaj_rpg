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

    // Remove the inner cube and instead add glowing edges for more visibility
    const glowGeometry = new THREE.BoxGeometry(3.05, 3.05, 3.05);
    const glowEdges = new THREE.EdgesGeometry(glowGeometry);
    const glowMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00aaff, 
      transparent: true,
      opacity: 0.4,
      linewidth: 1
    });
    this.glowingEdges = new THREE.LineSegments(glowEdges, glowMaterial);
    this.scene.add(this.glowingEdges);

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

    // Create a hidden d20 die (icosahedron)
    const d20Geometry = new THREE.IcosahedronGeometry(0.7);
    const d20Material = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      emissive: 0x330033,
      shininess: 100,
      transparent: true,
      opacity: 0.1,
      flatShading: true
    });
    this.d20 = new THREE.Mesh(d20Geometry, d20Material);
    
    // Add wireframe overlay to make it look like a d20
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0xff88ff,
      transparent: true,
      opacity: 0.1
    });
    const wireframeGeometry = new THREE.WireframeGeometry(d20Geometry);
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    this.d20.add(wireframe);
    
    // Hide the d20 somewhere in the scene
    this.d20.position.set(15, 5, -10);
    this.d20.scale.set(0.5, 0.5, 0.5);
    this.scene.add(this.d20);

    // Add particle system for cyberpunk effect
    this.addParticles();

    // Add event listeners for window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Add event listeners for mouse interaction
    container.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));

    // Add easter egg - "hack" button to reveal d20
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
   * Add a hidden "hack" button to reveal the d20
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
      // Reveal the d20 and make it follow the mouse
      this.revealD20();
      
      // Remove the button after click
      document.body.removeChild(hackButton);
    });
    
    document.body.appendChild(hackButton);
    
    // Add click handler to document to stop d20 from following
    document.addEventListener('click', (event) => {
      // Only respond if the d20 is currently following
      if (this.d20FollowingMouse) {
        // Make sure we're not clicking on any important UI elements
        const target = event.target as HTMLElement;
        if (target.tagName !== 'BUTTON' && !target.closest('.menu-container')) {
          this.d20FollowingMouse = false;
          
          // Fix the d20 in its current position
          // Add a small bounce effect
          const currentY = this.d20.position.y;
          const bounceAnimation = () => {
            const startTime = Date.now();
            const duration = 1000; // ms
            const startPosition = this.d20.position.clone();
            
            const animateBounce = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              if (progress < 1) {
                // Simple bounce using sine function
                const bounce = Math.sin(progress * Math.PI * 4) * (1 - progress) * 0.5;
                this.d20.position.y = currentY + bounce;
                
                // Continue rotation
                this.d20.rotation.x += 0.01;
                this.d20.rotation.y += 0.01;
                this.d20.rotation.z += 0.01;
                
                requestAnimationFrame(animateBounce);
              }
            };
            
            requestAnimationFrame(animateBounce);
          };
          
          bounceAnimation();
          
          // Roll the d20 and show a random number
          const randomRoll = Math.floor(Math.random() * 20) + 1;
          
          // Log message about capturing the d20
          console.log(`%cD20 captured! You rolled a ${randomRoll}!`, 
            "color: #ff00ff; font-weight: bold; font-size: 16px;");
        }
      }
    });
  }

  /**
   * Reveal the d20 by animating it to follow the mouse
   */
  private revealD20(): void {
    if (!this.d20) return;
    
    // Change material to make it visible
    (this.d20.material as THREE.MeshPhongMaterial).opacity = 0.9;
    (this.d20.material as THREE.MeshPhongMaterial).color.set(0xff00ff);
    (this.d20.material as THREE.MeshPhongMaterial).emissive.set(0x330033);
    
    // Make wireframe visible too
    if (this.d20.children.length > 0) {
      const wireframe = this.d20.children[0] as THREE.LineSegments;
      (wireframe.material as THREE.LineBasicMaterial).opacity = 0.7;
      (wireframe.material as THREE.LineBasicMaterial).color.set(0xff88ff);
    }
    
    // Animate it from its hidden position to the center first
    const targetPosition = new THREE.Vector3(0, 0, 0);
    const duration = 2000; // ms
    const startPosition = this.d20.position.clone();
    const startTime = Date.now();
    
    const animateD20 = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for smooth motion
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      this.d20.position.lerpVectors(
        startPosition,
        targetPosition,
        easedProgress
      );
      
      this.d20.rotation.x += 0.05;
      this.d20.rotation.y += 0.05;
      this.d20.rotation.z += 0.03;
      
      if (progress < 1) {
        requestAnimationFrame(animateD20);
      } else {
        // Once the d20 reaches the center, make it follow the mouse
        this.d20FollowingMouse = true;
      }
    };
    
    // Start animation
    requestAnimationFrame(animateD20);
    
    // Display message
    console.log("%cYou found the hidden d20! It will follow your mouse until you click to capture it and roll.", 
      "color: #ff00ff; font-weight: bold; font-size: 16px;");
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
    if (this.cube) {
      this.cube.rotation.x += 0.005;
      this.cube.rotation.y += 0.01;
      
      // Make the glowing edges follow the cube
      if (this.glowingEdges) {
        this.glowingEdges.rotation.copy(this.cube.rotation);
      }
    }
    
    // If d20 is revealed and following mouse, update its position
    if (this.d20FollowingMouse && this.d20) {
      // Convert mouse coordinates to 3D space
      const vector = new THREE.Vector3();
      vector.set(
        (this.controls.mouseX / window.innerWidth) * 2 - 1,
        -(this.controls.mouseY / window.innerHeight) * 2 + 1,
        0.5
      );
      
      vector.unproject(this.camera);
      const dir = vector.sub(this.camera.position).normalize();
      const distance = -this.camera.position.z / dir.z;
      const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
      
      // Limit how close the d20 can get to the edges
      pos.x = Math.max(-5, Math.min(5, pos.x));
      pos.y = Math.max(-3, Math.min(3, pos.y));
      
      // Smooth transition to new position
      this.d20.position.lerp(new THREE.Vector3(pos.x, pos.y, 0), 0.05);
      
      // Make d20 rotate continuously while following
      this.d20.rotation.x += 0.01;
      this.d20.rotation.y += 0.02;
      this.d20.rotation.z += 0.01;
    }
    
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
   * Handle mouse move events
   * @param event Mouse event
   */
  private onMouseMove(event: MouseEvent): void {
    // Always update the mouse position for d20 following
    this.controls.mouseX = event.clientX;
    this.controls.mouseY = event.clientY;
    
    // Handle cube rotation if mouse is down
    if (this.controls.isRotating) {
      const deltaX = event.clientX - this.controls.lastX;
      const deltaY = event.clientY - this.controls.lastY;
      
      this.cube.rotation.y += deltaX * 0.01;
      this.cube.rotation.x += deltaY * 0.01;
      
      this.controls.lastX = event.clientX;
      this.controls.lastY = event.clientY;
    }
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
    
    if (this.glowingEdges) {
      if (this.glowingEdges.geometry) this.glowingEdges.geometry.dispose();
      if (this.glowingEdges.material) {
        if (Array.isArray(this.glowingEdges.material)) {
          this.glowingEdges.material.forEach(material => material.dispose());
        } else {
          this.glowingEdges.material.dispose();
        }
      }
    }
    
    if (this.d20) {
      if (this.d20.geometry) this.d20.geometry.dispose();
      if (this.d20.material) {
        if (Array.isArray(this.d20.material)) {
          this.d20.material.forEach(material => material.dispose());
        } else {
          this.d20.material.dispose();
        }
      }
      // Dispose of wireframe child
      if (this.d20.children.length > 0) {
        const wireframe = this.d20.children[0] as THREE.LineSegments;
        if (wireframe.geometry) wireframe.geometry.dispose();
        if (wireframe.material) {
          if (Array.isArray(wireframe.material)) {
            wireframe.material.forEach(material => material.dispose());
          } else {
            wireframe.material.dispose();
          }
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