import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// =============================================================================
// TASK 3: GEOMETRIES & MATERIALS
// =============================================================================

// 1. SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);

// 2. CAMERA
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 4, 14);

// 3. RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// 4. ORBIT CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// =============================================================================
// 5. LIGHTING SETUP (4 Corner Lights + Ambient Light)
// =============================================================================

// Base ambient light for general visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// 1. Corner Light 1: Front-Right (+X, +Y, +Z)
const cornerLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
cornerLight1.position.set(10, 8, 10);
scene.add(cornerLight1);

// 2. Corner Light 2: Front-Left (-X, +Y, +Z)
const cornerLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
cornerLight2.position.set(-10, 8, 10);
scene.add(cornerLight2);

// 3. Corner Light 3: Back-Left (-X, +Y, -Z)
const cornerLight3 = new THREE.DirectionalLight(0xffffff, 1.5);
cornerLight3.position.set(-10, 8, -10);
scene.add(cornerLight3);

// 4. Corner Light 4: Back-Right (+X, +Y, -Z)
const cornerLight4 = new THREE.DirectionalLight(0xffffff, 1.5);
cornerLight4.position.set(10, 8, -10);
scene.add(cornerLight4);

// =============================================================================
// 6. GEOMETRIES & MATERIALS (Modify properties here in code)
// =============================================================================

// --- 1. Cube: BoxGeometry + MeshStandardMaterial ---
const boxGeometry = new THREE.BoxGeometry(1.6, 1.6, 1.6);
const boxMaterial = new THREE.MeshStandardMaterial({
  color: "red",
  roughness: 0.7,
  metalness: 0.1,
  transparent: true,
  opacity: 0.5,
  wireframe: false,
});
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
boxMesh.position.set(-7.5, 1, 0);
scene.add(boxMesh);

// --- 2. Sphere: SphereGeometry + MeshPhongMaterial ---
const sphereGeometry = new THREE.SphereGeometry(1.0, 32, 32);
const sphereMaterial = new THREE.MeshPhongMaterial({
  color: 0xec4899,
  shininess: 0,
  specular: 0xffffff,
  transparent: false,
  opacity: 1.0,
  wireframe: false,
});
const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphereMesh.position.set(-4.5, 1, 0);
scene.add(sphereMesh);

// --- 3. Cylinder: CylinderGeometry + MeshStandardMaterial ---
const cylinderGeometry = new THREE.CylinderGeometry(0.75, 0.75, 2.0, 32);
const cylinderMaterial = new THREE.MeshStandardMaterial({
  color: 0x10b920,
  roughness: 0.1,
  metalness: 0.6,
  transparent: false,
  opacity: 1,
  wireframe: false,
});
const cylinderMesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
cylinderMesh.position.set(-1.5, 1, 0);
scene.add(cylinderMesh);

// --- 4. Cone: ConeGeometry + MeshPhysicalMaterial ---
const coneGeometry = new THREE.ConeGeometry(0.9, 2.0, 32);
const coneMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xf59e0b,
  roughness: 0.5,
  metalness: 0.9,
  clearcoat: 0.1,
  clearcoatRoughness: 1,
  transparent: false,
  opacity: 1.0,
  wireframe: false,
});
const coneMesh = new THREE.Mesh(coneGeometry, coneMaterial);
coneMesh.position.set(1.5, 1, 0);
scene.add(coneMesh);

// --- 5. Torus: TorusGeometry + MeshBasicMaterial ---
const torusGeometry = new THREE.TorusGeometry(0.85, 0.3, 16, 50);
const torusMaterial = new THREE.MeshBasicMaterial({
  color: 0x06b6d4,
  transparent: true,
  opacity: 0.3,
});
const torusMesh = new THREE.Mesh(torusGeometry, torusMaterial);
torusMesh.position.set(4.5, 1, 0);
scene.add(torusMesh);

// --- 6. BufferGeometry: Custom raw vertex buffer ---
const bufferGeometry = new THREE.BufferGeometry();
const vertices = new Float32Array([
  // Triangle 1
  0, 1.3, 0, -0.9, 0, 0.9, 0.9, 0, 0.9,
  // Triangle 2
  0, 1.3, 0, 0.9, 0, 0.9, 0.9, 0, -0.9,
  // Triangle 3
  0, 1.3, 0, 0.9, 0, -0.9, -0.9, 0, -0.9,
  // Triangle 4
  0, 1.3, 0, -0.9, 0, -0.9, -0.9, 0, 0.9,
  // Triangle 5
  0, -1.3, 0, 0.9, 0, 0.9, -0.9, 0, 0.9,
  // Triangle 6
  0, -1.3, 0, 0.9, 0, -0.9, 0.9, 0, 0.9,
  // Triangle 7
  0, -1.3, 0, -0.9, 0, -0.9, 0.9, 0, -0.9,
  // Triangle 8
  0, -1.3, 0, -0.9, 0, 0.9, -0.9, 0, -0.9,
]);
bufferGeometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
bufferGeometry.computeVertexNormals();

const bufferMaterial = new THREE.MeshStandardMaterial({
  color: 0xa855f7,
  roughness: 0.2,
  metalness: 0.7,
  transparent: false,
  opacity: 1.0,
  wireframe: true,
});
const bufferMesh = new THREE.Mesh(bufferGeometry, bufferMaterial);
bufferMesh.position.set(7.5, 1, 0);
scene.add(bufferMesh);

// --- 7. Plane: PlaneGeometry + MeshBasicMaterial (Ground) ---
const planeGeometry = new THREE.PlaneGeometry(24, 20);
const planeMaterial = new THREE.MeshBasicMaterial({
  color: "#8FA28A",
  side: THREE.DoubleSide,
});
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
planeMesh.rotation.x = -Math.PI / 2;
planeMesh.position.y = -0.5;
scene.add(planeMesh);

const planeGeometry2 = new THREE.PlaneGeometry(24, 10);
const planeMaterial2 = new THREE.MeshBasicMaterial({
  color: "#F7F4ED",
  side: THREE.DoubleSide,
});
const planeMesh2 = new THREE.Mesh(planeGeometry2, planeMaterial2);
// planeMesh2.rotation.x = Math.PI / 2;
planeMesh2.position.y = 4.5;
planeMesh2.position.z = -10;
scene.add(planeMesh2);

const planeGeometry3 = new THREE.PlaneGeometry(20, 10);
const planeMaterial3 = new THREE.MeshBasicMaterial({
  color: "#C7D3C0",
  side: THREE.DoubleSide,
});
const planeMesh3 = new THREE.Mesh(planeGeometry3, planeMaterial3);
planeMesh3.rotation.y = -Math.PI / 2
planeMesh3.position.y = 4.5;
planeMesh3.position.x = -12
// planeMesh3.position.x = -10;
scene.add(planeMesh3);


const planeGeometry4 = new THREE.PlaneGeometry(20, 10);
const planeMaterial4 = new THREE.MeshBasicMaterial({
  color: "#C7D3C0",
  side: THREE.DoubleSide,
});
const planeMesh4 = new THREE.Mesh(planeGeometry4, planeMaterial4);
planeMesh4.rotation.y = -Math.PI / 2
planeMesh4.position.y = 4.5;
planeMesh4.position.x = 12
scene.add(planeMesh4);

// =============================================================================
// 7. ANIMATION LOOP
// =============================================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();
  controls.update();

  // Subtle rotation
  boxMesh.rotation.x = elapsedTime * 0.4;
  boxMesh.rotation.y = elapsedTime * 0.6;

  sphereMesh.rotation.y = elapsedTime * 0.5;

  cylinderMesh.rotation.x = elapsedTime * 0.3;
  cylinderMesh.rotation.y = elapsedTime * 0.5;

  coneMesh.rotation.y = elapsedTime * 0.6;

  torusMesh.rotation.x = elapsedTime * 0.7;
  torusMesh.rotation.y = elapsedTime * 0.5;

  bufferMesh.rotation.y = elapsedTime * 0.5;
  bufferMesh.rotation.z = elapsedTime * 0.3;

  renderer.render(scene, camera);
}

animate();

// =============================================================================
// 8. RESIZE HANDLER
// =============================================================================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
