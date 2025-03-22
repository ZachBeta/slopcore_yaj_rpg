import * as THREE from 'three';

// Initialize the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111133);

// Create a camera
const camera = new THREE.PerspectiveCamera(
  75, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000 // Far clipping plane
);
camera.position.z = 5;

// Create a renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Add renderer to the DOM
const container = document.getElementById('canvas-container');
if (container) {
  container.appendChild(renderer.domElement);
}

// Create a cube
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshPhongMaterial({
  color: 0x00aaff,
  specular: 0x555555,
  shininess: 30,
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Handle window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Rotate the cube
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render(scene, camera);
}

// Start the animation loop
animate();

// Button event listeners
document.getElementById('start-game')?.addEventListener('click', () => {
  alert('Game starting! (This would load the game screen)');
});

document.getElementById('options')?.addEventListener('click', () => {
  alert('Options coming soon!');
});

document.getElementById('about')?.addEventListener('click', () => {
  alert('Slopcore YAJ RPG - A web version of the terminal-based RPG!');
}); 