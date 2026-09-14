import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// 1. SCENE: Container for all 3D objects and lights
const scene = new THREE.Scene();

// 2. OBJECT: Geometry (shape) + Material (surface) = Mesh
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshStandardMaterial({
  color: 0x6366f1,
  roughness: 0.3,
  metalness: 0.2,
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const geometry1 = new THREE.BoxGeometry(2, 2, 2);
const material1 = new THREE.MeshStandardMaterial({
  color: "red",
  roughness: 1,
  metalness: 0.1,
});
const cube1 = new THREE.Mesh(geometry1, material1);
scene.add(cube1);

// LIGHTS: Required so we can see the 3D surface shading
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// 3. CAMERA: Point of view (FOV, Aspect Ratio, Near, Far)
const camera = new THREE.PerspectiveCamera(
  100,
  window.innerWidth / window.innerHeight,
  1,
  1000,
);
camera.position.z = 5;

// 4. RENDERER: Renders the scene via camera onto the screen
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 5. ORBIT CONTROLS: Enables mouse interaction (rotate, zoom, pan)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth motion
controls.dampingFactor = 0.05;

// 6. ANIMATION LOOP: Continuously rotates and renders every frame
function animate() {
  requestAnimationFrame(animate);

  // Update controls when damping is enabled
  controls.update();

  // Rotate the cube
  cube.rotation.x += 0.01;
  cube.rotation.z += 0.01;

  cube1.rotation.z += 0.01;
  cube1.rotation.y += 0.01;

  // Render Scene from Camera view
  renderer.render(scene, camera);
}

animate();

// Handle browser window resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
