import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// =========================================================================
// 1. SCENE: Container for all 3D objects, lights, and helpers
// =========================================================================
const scene = new THREE.Scene();

// =========================================================================
// 2. SINGLE ROUND OBJECT IN CENTER (Sphere with Solid Color)
// =========================================================================
const sphereGeometry = new THREE.SphereGeometry(2, 64, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({
  color: 0x6366f1, // Normal solid indigo color
  roughness: 0.3,
  metalness: 0.4,
});
const centerSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
centerSphere.position.set(0, 0, 0); // Positioned exactly at center
scene.add(centerSphere);

// =========================================================================
// 3. 4 LIGHTS ON THE 4 CORNERS + DEVTOOL HELPERS
// =========================================================================

// Base ambient light for subtle visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// Corner Directional Light 1: Front-Right (+X, +Y, +Z)
const light1 = new THREE.DirectionalLight(0xffffff, 1.5);
light1.position.set(6, 0, 6);
scene.add(light1);
const helper1 = new THREE.DirectionalLightHelper(light1, 1.0);
scene.add(helper1);

// Corner Directional Light 2: Front-Left (-X, +Y, +Z)
const light2 = new THREE.DirectionalLight(0xffffff, 1.5);
light2.position.set(-6, 0, 6);
scene.add(light2);
const helper2 = new THREE.DirectionalLightHelper(light2, 1.0);
scene.add(helper2);

// Corner Directional Light 3: Back-Left (-X, +Y, -Z)
const light3 = new THREE.DirectionalLight(0xffffff, 1.5);
light3.position.set(-6, 0, -6);
scene.add(light3);
const helper3 = new THREE.DirectionalLightHelper(light3, 1.0);
scene.add(helper3);

// Corner Directional Light 4: Back-Right (+X, +Y, -Z)
const light4 = new THREE.DirectionalLight(0xffffff, 1.5);
light4.position.set(6, 0, -6);
scene.add(light4);
const helper4 = new THREE.DirectionalLightHelper(light4, 1.0);
scene.add(helper4);

// =========================================================================
// 4. DEV TOOLS / HELPERS: Visualizing Axes and Ground Grid
// =========================================================================

// 1. Axes Helper: Red = X, Green = Y, Blue = Z
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 2. Grid Helper: Floor grid reference
const gridHelper = new THREE.GridHelper(16, 16, 0x6366f1, 0x334155);
gridHelper.position.y = -2; // Just below the sphere
scene.add(gridHelper);

// =========================================================================
// 5. CAMERA: Perspective View
// =========================================================================
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 6, 10);
camera.lookAt(0, 0, 0);

// =========================================================================
// 6. RENDERER & CANVAS
// =========================================================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// =========================================================================
// 7. ORBIT CONTROLS: Mouse interaction
// =========================================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// =========================================================================
// 8. ANIMATION LOOP
// =========================================================================
let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // Smooth orbit controls
  controls.update();

  // Rotate the center sphere
  centerSphere.rotation.y = elapsedTime * 0.3;
  centerSphere.rotation.x = elapsedTime * 0.2;

  // Render Scene
  renderer.render(scene, camera);
}

animate();

// =========================================================================
// 9. RESIZE HANDLER
// =========================================================================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
