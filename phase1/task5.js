import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createCar } from "./car.js";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 6, 14);
camera.lookAt(0, 1.5, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Enable shadow maps on renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 1.5, 0);

// Showroom floor receiving shadows
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: "white",
  roughness: 0.8,
  metalness: 0.1,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// Showroom turntable pedestal
const pedestalGeometry = new THREE.CylinderGeometry(6, 6.4, 0.4, 64);
const pedestalMaterial = new THREE.MeshStandardMaterial({
  color: 0x334155,
  roughness: 0.5,
  metalness: 0.2,
});
const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
pedestal.position.y = 0.2;
pedestal.castShadow = true;
pedestal.receiveShadow = true;
scene.add(pedestal);

// car import
const { car, wheels } = createCar();
car.position.set(0, 0.4, 0);
car.scale.set(1.5, 1.5, 1.5);

// Enable shadows on all car parts
car.traverse((child) => {
  if (child.isMesh) {
    child.castShadow = true;
    child.receiveShadow = true;
  }
});
scene.add(car);

// Hemisphere light for sky and ground ambient bounce
const hemisphereLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.4);
scene.add(hemisphereLight);

// Helper for hemisphere light
const hemisphereLightHelper = new THREE.HemisphereLightHelper(
  hemisphereLight,
  2,
  "white",
);
// scene.add(hemisphereLightHelper);

// Ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Key Light - main warm directional light casting shadows
const keyLight = new THREE.DirectionalLight("white", 2.5);
keyLight.position.set(8, 10, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 30;
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 8;
keyLight.shadow.camera.bottom = -8;
keyLight.shadow.bias = -0.0005;
keyLight.shadow.radius = 2.5;
scene.add(keyLight);

// Helper for key light
const keyLightHelper = new THREE.DirectionalLightHelper(keyLight, 1, 0xfff7ed);
scene.add(keyLightHelper);

// Shadow camera helper for key light to visualize shadow frustum
const keyLightShadowHelper = new THREE.CameraHelper(keyLight.shadow.camera);
// scene.add(keyLightShadowHelper);

// Fill Light - softens dark shadows from opposite side without casting shadows
const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.9);
fillLight.position.set(-8, 6, 6);
fillLight.castShadow = false;
scene.add(fillLight);

// Helper for fill light
const fillLightHelper = new THREE.DirectionalLightHelper(
  fillLight,
  1,
  0x93c5fd,
);
scene.add(fillLightHelper);

// Rim Light - spotlight behind car for edge silhouette
const rimLight = new THREE.SpotLight(0x38bdf8, 6.0, 25, Math.PI / 6, 0.5, 1.2);
rimLight.position.set(0, 8, -9);
rimLight.target = car;
rimLight.castShadow = true;
rimLight.shadow.mapSize.width = 1024;
rimLight.shadow.mapSize.height = 1024;
rimLight.shadow.camera.near = 2;
rimLight.shadow.camera.far = 25;
rimLight.shadow.bias = -0.0005;
scene.add(rimLight);

// Helper for rim light
const rimLightHelper = new THREE.SpotLightHelper(rimLight, 0x38bdf8);
scene.add(rimLightHelper);

// Shadow camera helper for rim light spotlight
const rimLightShadowHelper = new THREE.CameraHelper(rimLight.shadow.camera);
scene.add(rimLightShadowHelper);

// Dynamic accent PointLight with real-time omnidirectional shadow
const accentLight = new THREE.PointLight(0x10b981, 3.5, 18, 2);
accentLight.castShadow = true;
accentLight.shadow.mapSize.width = 1024;
accentLight.shadow.mapSize.height = 1024;
accentLight.shadow.camera.near = 0.5;
accentLight.shadow.camera.far = 18;
accentLight.shadow.bias = -0.002;
scene.add(accentLight);

// Visual bulb mesh for point light
const bulbMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0x10b981 }),
);
accentLight.add(bulbMesh);

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Slow showroom rotation of car and pedestal
  car.rotation.y = elapsedTime * 0.2;
  pedestal.rotation.y = elapsedTime * 0.2;

  // Spin wheels
  wheels.frontLeftWheel.rotation.y += 0.04;
  wheels.frontRightWheel.rotation.y += 0.04;
  wheels.rearLeftWheel.rotation.y += 0.04;
  wheels.rearRightWheel.rotation.y += 0.04;

  // Orbit dynamic accent light around showroom
  const orbitRadius = 6.0;
  accentLight.position.x = Math.cos(elapsedTime * 0.7) * orbitRadius;
  accentLight.position.z = Math.sin(elapsedTime * 0.7) * orbitRadius;
  accentLight.position.y = 3.0 + Math.sin(elapsedTime * 1.2) * 1.0;

  // Update light and shadow camera helpers
  hemisphereLightHelper.update();
  keyLightHelper.update();
  fillLightHelper.update();
  rimLightHelper.update();
  keyLightShadowHelper.update();
  rimLightShadowHelper.update();

  // Render scene
  renderer.render(scene, camera);
}

animate();

// Resize handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
