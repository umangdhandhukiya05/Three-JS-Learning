import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e17);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 4, 14);
camera.lookAt(0, 1.2, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going below floor
controls.minDistance = 2;
controls.maxDistance = 30;
controls.target.set(0, 1.2, 0);

// Texture Loader instance
const textureLoader = new THREE.TextureLoader();

function configureTexture(texture, isColorMap = false) {
  if (isColorMap) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  texture.anisotropy = maxAnisotropy;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// 1. Wooden Box Texture
const woodTexture = configureTexture(
  textureLoader.load("/textures/hardwood.jpg"),
  true,
);
woodTexture.wrapS = THREE.RepeatWrapping;
woodTexture.wrapT = THREE.RepeatWrapping;
woodTexture.repeat.set(3, 2);
woodTexture.offset.set(0.5, 0.25);
woodTexture.rotation = Math.PI / 4;

// 2. Brick Wall Textures (Albedo, Bump & Roughness Maps)
const brickTexture = configureTexture(
  textureLoader.load("/textures/brick.jpg"),
  true,
);
brickTexture.wrapS = THREE.RepeatWrapping;
brickTexture.wrapT = THREE.RepeatWrapping;

const brickBumpTexture = configureTexture(
  textureLoader.load("/textures/brick_bump.jpg"),
  false,
);
brickBumpTexture.wrapS = THREE.RepeatWrapping;
brickBumpTexture.wrapT = THREE.RepeatWrapping;

const brickRoughnessTexture = configureTexture(
  textureLoader.load("/textures/brick_roughness.jpg"),
  false,
);
brickRoughnessTexture.wrapS = THREE.RepeatWrapping;
brickRoughnessTexture.wrapT = THREE.RepeatWrapping;

// 3. Planet Earth Textures (Albedo, Normal & Specular Maps)
const planetTexture = configureTexture(
  textureLoader.load("/textures/planet.jpg"),
  true,
);
const planetNormalTexture = configureTexture(
  textureLoader.load("/textures/planet_normal.jpg"),
  false,
);
const planetSpecularTexture = configureTexture(
  textureLoader.load("/textures/planet_specular.jpg"),
  false,
);

// 4. iPhone 18 Pro Retail Box Texture (PNG)
const iphoneBoxTexture = configureTexture(
  textureLoader.load("/textures/iphone_box.png"),
  true,
);

const floorGeometry = new THREE.PlaneGeometry(30, 30);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x111827,
  roughness: 0.5,
  metalness: 0.2,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// Pedestals beneath each object
const pedestalGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.2, 48);
const pedestalMat = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  roughness: 0.3,
  metalness: 0.4,
});

const positions = [-5.5, -2.0, 1.8, 5.5];
positions.forEach((x) => {
  const ped = new THREE.Mesh(pedestalGeo, pedestalMat);
  ped.position.set(x, 0.1, 0);
  ped.receiveShadow = true;
  ped.castShadow = true;
  scene.add(ped);

  // Pedestal accent ring
  const ringGeo = new THREE.TorusGeometry(1.62, 0.02, 16, 48);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, 0.2, 0);
  scene.add(ring);
});

// 1. Wooden Box
const woodGeometry = new THREE.BoxGeometry(2, 2, 2);
const woodMaterial = new THREE.MeshStandardMaterial({
  map: woodTexture,
  roughness: 0.4,
  metalness: 0.05,
});
const woodenBox = new THREE.Mesh(woodGeometry, woodMaterial);
woodenBox.position.set(-5.5, 1.1, 0);
woodenBox.castShadow = true;
woodenBox.receiveShadow = true;
scene.add(woodenBox);

// 2. Brick Wall
const brickGeometry = new THREE.BoxGeometry(2.4, 2.4, 0.4);
const brickMaterial = new THREE.MeshStandardMaterial({
  map: brickTexture,
  bumpMap: brickBumpTexture,
  bumpScale: 0.06,
  roughnessMap: brickRoughnessTexture,
  roughness: 0.85,
  metalness: 0.02,
});
const brickWall = new THREE.Mesh(brickGeometry, brickMaterial);
brickWall.position.set(-2.0, 1.3, 0);
brickWall.castShadow = true;
brickWall.receiveShadow = true;
scene.add(brickWall);

// 3. Planet Earth
const planetGeometry = new THREE.SphereGeometry(1.25, 64, 64);
const planetMaterial = new THREE.MeshStandardMaterial({
  map: planetTexture,
  normalMap: planetNormalTexture,
  normalScale: new THREE.Vector2(1.2, 1.2),
  roughnessMap: planetSpecularTexture,
  roughness: 0.5,
  metalness: 0.1,
});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.position.set(1.8, 1.35, 0);
planet.castShadow = true;
planet.receiveShadow = true;
scene.add(planet);

// 4. Product Package (iPhone 18 Pro Box Geometry & Materials matching PNG aspect ratio)
const iphoneBoxGeometry = new THREE.BoxGeometry(1.61, 3.0, 0.4);

const boxSideMaterial = new THREE.MeshStandardMaterial({
  color: 0xfafafa,
  roughness: 0.35,
  metalness: 0.02,
});

const boxFrontMaterial = new THREE.MeshStandardMaterial({
  map: iphoneBoxTexture,
  roughness: 0.25,
  metalness: 0.05,
});

const boxBackMaterial = new THREE.MeshStandardMaterial({
  color: 0xf5f5f7,
  roughness: 0.4,
  metalness: 0.02,
});

// Materials for BoxGeometry: [+X, -X, +Y, -Y, +Z (Front), -Z (Back)]
const iphoneBoxMaterials = [
  boxSideMaterial,
  boxSideMaterial,
  boxSideMaterial,
  boxSideMaterial,
  boxFrontMaterial,
  boxBackMaterial,
];

const productPackage = new THREE.Mesh(iphoneBoxGeometry, iphoneBoxMaterials);
productPackage.position.set(5.5, 1.6, 0);
productPackage.castShadow = true;
productPackage.receiveShadow = true;
scene.add(productPackage);

// Studio Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const hemisphereLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 0.6);
scene.add(hemisphereLight);

// Key Directional Light
const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.6);
keyLight.position.set(8, 12, 10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 35;
keyLight.shadow.camera.left = -12;
keyLight.shadow.camera.right = 12;
keyLight.shadow.camera.top = 10;
keyLight.shadow.camera.bottom = -10;
keyLight.shadow.bias = -0.0004;
keyLight.shadow.radius = 2;
scene.add(keyLight);

// Fill Directional Light
const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.9);
fillLight.position.set(-10, 8, 8);
scene.add(fillLight);

// Rim SpotLight
const rimLight = new THREE.SpotLight(0x38bdf8, 5.0, 35, Math.PI / 4, 0.6, 1.2);
rimLight.position.set(0, 10, -10);
rimLight.target.position.set(0, 1, 0);
scene.add(rimLight);
scene.add(rimLight.target);

// Package Specular Accent Light
const packageSpot = new THREE.PointLight(0xffffff, 2.2, 10, 2);
packageSpot.position.set(5.5, 3.5, 3.0);
scene.add(packageSpot);

// Animation Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // Update orbit controls
  controls.update();

  // Rotate showcase items
  woodenBox.rotation.y = elapsedTime * 0.25;
  woodTexture.offset.x = elapsedTime * 0.1;

  brickWall.rotation.y = elapsedTime * 0.15;
  planet.rotation.y = elapsedTime * 0.35;
  productPackage.rotation.y = elapsedTime * 0.2;

  // Orbit accent light around package
  packageSpot.position.x = 5.5 + Math.cos(elapsedTime * 0.8) * 1.2;
  packageSpot.position.z = 3.0 + Math.sin(elapsedTime * 0.8) * 1.2;

  renderer.render(scene, camera);
}

animate();

// Window Resize Handling
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
