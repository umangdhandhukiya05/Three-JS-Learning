import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);
scene.fog = new THREE.FogExp2(0x0f172a, 0.01);

// Perspective camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, 16);

// WebGL renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.target.set(0, 1.8, 0);

// Ambient and hemisphere fill lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const hemisphereLight = new THREE.HemisphereLight(0xbfdbfe, 0x1e293b, 1.0);
scene.add(hemisphereLight);

// Four corner stadium directional lights
function createCornerLight(x, z) {
  const dirLight = new THREE.DirectionalLight(0xfffaed, 2.0);
  dirLight.position.set(x, 14, z);
  dirLight.target.position.set(0, 1.5, 0);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 40;
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  dirLight.shadow.bias = -0.0003;
  dirLight.shadow.radius = 2;
  scene.add(dirLight);
  scene.add(dirLight.target);
}

const cornerDist = 15;
createCornerLight(-cornerDist, -cornerDist);
createCornerLight(cornerDist, -cornerDist);
createCornerLight(-cornerDist, cornerDist);
createCornerLight(cornerDist, cornerDist);

// Ground plane
const groundGeo = new THREE.PlaneGeometry(25, 25);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.3 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Helper function to create pedestals
function createPedestal(x, z, radius = 1.6, color = 0x38bdf8) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const baseGeo = new THREE.CylinderGeometry(radius, radius * 1.08, 0.3, 32);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.25, metalness: 0.7 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.15;
  base.receiveShadow = true;
  group.add(base);

  const ringGeo = new THREE.RingGeometry(radius * 0.86, radius * 0.98, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.305;
  group.add(ring);

  scene.add(group);
  return group;
}

createPedestal(-5.5, 0, 1.6, 0xf43f5e);
createPedestal(0, 0, 1.6, 0x10b981);
createPedestal(5.5, 0, 1.6, 0xa855f7);

// 1. Rotating cube object
const cubeGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
const cubeMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.2, metalness: 0.7 });
const cube = new THREE.Mesh(cubeGeo, cubeMat);
cube.castShadow = true;
cube.receiveShadow = true;
cube.position.set(-5.5, 2.2, 0);
scene.add(cube);

const cubeWireGeo = new THREE.BoxGeometry(1.62, 1.62, 1.62);
const cubeWireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.4 });
const cubeWire = new THREE.Mesh(cubeWireGeo, cubeWireMat);
cube.add(cubeWire);

// 2. Moving sphere object
const sphereGeo = new THREE.SphereGeometry(0.9, 32, 32);
const sphereMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.1, metalness: 0.9 });
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
sphere.position.set(0, 2.2, 0);
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add(sphere);

// 3. Pulsating torus knot object
const torusKnotGeo = new THREE.TorusKnotGeometry(0.75, 0.22, 128, 32);
const torusKnotMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.15, metalness: 0.8 });
const pulseObject = new THREE.Mesh(torusKnotGeo, torusKnotMat);
pulseObject.position.set(5.5, 2.2, 0);
pulseObject.castShadow = true;
pulseObject.receiveShadow = true;
scene.add(pulseObject);

// 4. Orbiting satellite objects with different animation speeds
const satelliteGroup = new THREE.Group();
satelliteGroup.position.set(0, 1.5, 0);
scene.add(satelliteGroup);

const satelliteCount = 8;
const satellites = [];
const satelliteGeo = new THREE.OctahedronGeometry(0.38, 0);
const satelliteColors = [0x38bdf8, 0x818cf8, 0xc084fc, 0xf472b6, 0xfb7185, 0xfbbf24, 0x34d399, 0x2dd4bf];

for (let i = 0; i < satelliteCount; i++) {
  const satMat = new THREE.MeshStandardMaterial({ color: satelliteColors[i % satelliteColors.length], roughness: 0.15, metalness: 0.85 });
  const satMesh = new THREE.Mesh(satelliteGeo, satMat);
  satMesh.castShadow = true;

  satellites.push({
    mesh: satMesh,
    radius: 9.0 + (i % 2) * 1.5,
    speed: 0.6 + i * 0.35,
    heightOffset: Math.sin((i / satelliteCount) * Math.PI * 2) * 1.2,
    phase: (i / satelliteCount) * Math.PI * 2,
    rotSpeedX: 1.2 + i * 0.4,
    rotSpeedY: 1.8 + i * 0.3,
  });

  satelliteGroup.add(satMesh);
}

// Clock for time and delta tracking
const clock = new THREE.Clock();

// Render and animation loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // 1. Rotate cube
  cube.rotation.x += 1.2 * delta;
  cube.rotation.y += 1.8 * delta;
  cube.rotation.z += 0.8 * delta;

  // 2. Move sphere position
  sphere.position.x = Math.cos(elapsedTime * 1.5) * 0.8;
  sphere.position.y = 2.2 + Math.sin(elapsedTime * 2.5) * 0.6;
  sphere.position.z = Math.sin(elapsedTime * 1.5) * 0.8;

  // 3. Pulsate torus knot scale
  const pulseWave = (Math.sin(elapsedTime * 3.0) + 1.0) * 0.5;
  const currentScale = THREE.MathUtils.lerp(0.65, 1.35, pulseWave);
  pulseObject.scale.setScalar(currentScale);
  pulseObject.rotation.x += 0.8 * delta;
  pulseObject.rotation.y += 1.2 * delta;

  // 4. Animate satellites at distinct speeds
  for (let i = 0; i < satellites.length; i++) {
    const sat = satellites[i];
    const angle = elapsedTime * sat.speed + sat.phase;
    sat.mesh.position.x = Math.cos(angle) * sat.radius;
    sat.mesh.position.z = Math.sin(angle) * sat.radius;
    sat.mesh.position.y = 2.0 + sat.heightOffset + Math.sin(angle * 2) * 0.8;
    sat.mesh.rotation.x += sat.rotSpeedX * delta;
    sat.mesh.rotation.y += sat.rotSpeedY * delta;
  }

  // Render scene
  renderer.render(scene, camera);
}

// Start animation loop
animate();

// Handle window resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
