import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);
scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 7, 16);

// WebGL Renderer setup
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.minDistance = 3;
controls.maxDistance = 28;
controls.target.set(0, 2, 0);

// Directional lights with shadow mapping
function createLight(x, y, z, intensity) {
  const light = new THREE.DirectionalLight(0xffffff, intensity);
  light.position.set(x, y, z);
  light.target.position.set(0, 1.5, 0);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 35;
  light.shadow.camera.left = -15;
  light.shadow.camera.right = 15;
  light.shadow.camera.top = 15;
  light.shadow.camera.bottom = -15;
  light.shadow.bias = -0.0003;
  scene.add(light);
  scene.add(light.target);
  return light;
}

// 4 Corner directional lights
createLight(12, 8, 12, 1.8);
createLight(-12, 8, 12, 1.8);
createLight(-12, 8, -12, 1.8);
createLight(12, 8, -12, 1.8);

// Room dimensions and group
const roomSize = 28;
const wallHeight = 16;
const roomGroup = new THREE.Group();

// Floor plane
const floorGeo = new THREE.PlaneGeometry(roomSize, roomSize);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.4,
  metalness: 0.5,
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
roomGroup.add(floor);

// Floor grid helper
const floorGrid = new THREE.GridHelper(roomSize, 28, 0x38bdf8, 0x1e293b);
floorGrid.position.y = 0.01;
roomGroup.add(floorGrid);

// Wall material
const wallMat = new THREE.MeshStandardMaterial({
  color: "#C7D3C0",
  roughness: 0.8,
  metalness: 0.1,
});

// Back wall
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, wallHeight), wallMat);
backWall.position.set(0, wallHeight / 2, -roomSize / 2);
backWall.receiveShadow = true;
roomGroup.add(backWall);

// Left wall
const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, wallHeight), wallMat);
leftWall.position.set(-roomSize / 2, wallHeight / 2, 0);
leftWall.rotation.y = Math.PI / 2;
leftWall.receiveShadow = true;
roomGroup.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, wallHeight), wallMat);
rightWall.position.set(roomSize / 2, wallHeight / 2, 0);
rightWall.rotation.y = -Math.PI / 2;
rightWall.receiveShadow = true;
roomGroup.add(rightWall);

scene.add(roomGroup);

// Interactive objects collection
const interactiveObjects = [];

// Helper to create pedestal and interactive mesh
function createInteractiveItem({ geometry, material, position, accentColor = 0x38bdf8 }) {
  const itemGroup = new THREE.Group();
  itemGroup.position.copy(position);

  // Pedestal base
  const pedestalGeo = new THREE.CylinderGeometry(1.2, 1.35, 0.35, 32);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.7,
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.y = 0.175;
  pedestal.receiveShadow = true;
  pedestal.castShadow = true;
  itemGroup.add(pedestal);

  // Pedestal accent ring
  const ringGeo = new THREE.RingGeometry(1.05, 1.2, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.355;
  itemGroup.add(ring);

  // Floating mesh
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 2.1, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    baseY: 2.1,
    baseScale: 1,
    isSelected: false,
  };

  itemGroup.add(mesh);
  scene.add(itemGroup);
  interactiveObjects.push(mesh);

  return mesh;
}

// 1. BoxGeometry + MeshStandardMaterial (Translucent Ruby)
createInteractiveItem({
  geometry: new THREE.BoxGeometry(1.6, 1.6, 1.6),
  material: new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    roughness: 0.25,
    metalness: 0.6,
    transparent: true,
    opacity: 0.8,
  }),
  position: new THREE.Vector3(-5.5, 0, 0),
  accentColor: 0xf43f5e,
});

// 2. SphereGeometry + MeshPhysicalMaterial (Refractive Glass Clearcoat)
createInteractiveItem({
  geometry: new THREE.SphereGeometry(1.0, 48, 48),
  material: new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.9,
    ior: 1.5,
    thickness: 1.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 1.0,
  }),
  position: new THREE.Vector3(0, 0, 0),
  accentColor: 0x38bdf8,
});

// 3. TorusKnotGeometry + MeshPhysicalMaterial (Polished Metallic Chrome)
createInteractiveItem({
  geometry: new THREE.TorusKnotGeometry(0.85, 0.28, 96, 16),
  material: new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.2,
    roughness: 0.1,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
  }),
  position: new THREE.Vector3(5.5, 0, 0),
  accentColor: 0xffffff,
});

// Raycasting and pointer tracking state
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-1000, -1000);
let hoveredObject = null;
let selectedObject = null;

// Track pointer in NDC coordinates
window.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Helper to reset mesh visual state
function resetMeshState(mesh) {
  if (!mesh) return;
  if (mesh.material.emissive) mesh.material.emissive.setHex(0x000000);
  mesh.scale.setScalar(mesh.userData.baseScale);
}

// Click listener for object selection
window.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;

  if (hoveredObject) {
    if (selectedObject && selectedObject !== hoveredObject) {
      selectedObject.userData.isSelected = false;
      resetMeshState(selectedObject);
    }
    selectedObject = hoveredObject;
    selectedObject.userData.isSelected = true;
  } else if (selectedObject) {
    selectedObject.userData.isSelected = false;
    resetMeshState(selectedObject);
    selectedObject = null;
  }
});

// Clock for animation loop
const clock = new THREE.Clock();

// Main animation and render loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  controls.update();

  // Raycasting from camera to pointer
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects);

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object;
    renderer.domElement.style.cursor = "pointer";

    if (hoveredObject !== hitMesh) {
      if (hoveredObject && !hoveredObject.userData.isSelected) {
        resetMeshState(hoveredObject);
      }
      hoveredObject = hitMesh;
    }

    // Hover highlight if not selected
    if (!hitMesh.userData.isSelected) {
      if (hitMesh.material.emissive) hitMesh.material.emissive.setHex(0x223344);
      hitMesh.scale.setScalar(hitMesh.userData.baseScale * 1.1);
    }
  } else {
    renderer.domElement.style.cursor = "default";
    if (hoveredObject && !hoveredObject.userData.isSelected) {
      resetMeshState(hoveredObject);
      hoveredObject = null;
    }
  }

  // Animate interactive objects
  for (let i = 0; i < interactiveObjects.length; i++) {
    const mesh = interactiveObjects[i];

    // Continuous rotation
    mesh.rotation.y += (0.6 + i * 0.08) * delta;
    mesh.rotation.x += (0.3 + i * 0.04) * delta;

    if (mesh.userData.isSelected) {
      // Pulsing glow and floating when selected
      if (mesh.material.emissive) {
        const pulse = Math.sin(elapsedTime * 5.0) * 0.5 + 0.5;
        mesh.material.emissive.setRGB(pulse * 0.4, pulse * 0.3, 0);
      }
      const targetY = mesh.userData.baseY + 0.6 + Math.sin(elapsedTime * 4.0) * 0.15;
      mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetY, 0.1);
      mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, mesh.userData.baseScale * 1.2, 0.1));
    } else if (mesh !== hoveredObject) {
      // Idle floating
      const targetY = mesh.userData.baseY + Math.sin(elapsedTime * 2.0 + i * 0.9) * 0.12;
      mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetY, 0.1);
      mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, mesh.userData.baseScale, 0.1));
    }
  }

  renderer.render(scene, camera);
}

// Start loop
animate();

// Window resize handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
