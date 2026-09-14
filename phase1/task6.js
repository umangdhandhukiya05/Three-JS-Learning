import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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
camera.position.set(0, 5, 12);
camera.lookAt(0, 1, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 1, 0);

// Texture Loader instance
const textureLoader = new THREE.TextureLoader();

// -----------------------------------------------------------------------------
// High Quality Image Textures Loading
// -----------------------------------------------------------------------------

// 1. High-res Hardwood Planks Texture for Wooden Box
const woodTexture = textureLoader.load("/textures/hardwood.jpg");
woodTexture.colorSpace = THREE.SRGBColorSpace;

// 2. High-res 1K Brick Albedo, Bump Map, and Roughness Map for Brick Wall
const brickTexture = textureLoader.load("/textures/brick.jpg");
brickTexture.colorSpace = THREE.SRGBColorSpace;
const brickBumpTexture = textureLoader.load("/textures/brick_bump.jpg");
const brickRoughnessTexture = textureLoader.load("/textures/brick_roughness.jpg");

// 3. 2K NASA Earth Color Map, Normal Map, and Specular Map for Planet Sphere
const planetTexture = textureLoader.load("/textures/planet.jpg");
planetTexture.colorSpace = THREE.SRGBColorSpace;
const planetNormalTexture = textureLoader.load("/textures/planet_normal.jpg");
const planetSpecularTexture = textureLoader.load("/textures/planet_specular.jpg");

// 4. Cardboard Package Texture with Shipping Labels & Barcodes
const packageTexture = textureLoader.load("/textures/package.png");
packageTexture.colorSpace = THREE.SRGBColorSpace;

// -----------------------------------------------------------------------------
// Studio Floor (Shadow Receiver)
// -----------------------------------------------------------------------------
const floorGeometry = new THREE.PlaneGeometry(30, 30);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  roughness: 0.8,
  metalness: 0.1,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// -----------------------------------------------------------------------------
// 1. Wooden Box (Cube Geometry + High-Res Wood Texture)
// -----------------------------------------------------------------------------
const woodGeometry = new THREE.BoxGeometry(2, 2, 2);
const woodMaterial = new THREE.MeshStandardMaterial({
  map: woodTexture,
  roughness: 0.5,
  metalness: 0.05,
});
const woodenBox = new THREE.Mesh(woodGeometry, woodMaterial);
woodenBox.position.set(-4.5, 1, 0);
woodenBox.castShadow = true;
woodenBox.receiveShadow = true;
scene.add(woodenBox);

// -----------------------------------------------------------------------------
// 2. Brick Wall (Subdivided Box + Brick Albedo, Bump & Roughness Maps)
// -----------------------------------------------------------------------------
const brickGeometry = new THREE.BoxGeometry(2.4, 2.4, 0.4);
const brickMaterial = new THREE.MeshStandardMaterial({
  map: brickTexture,
  bumpMap: brickBumpTexture,
  bumpScale: 0.05,
  roughnessMap: brickRoughnessTexture,
  roughness: 0.8,
  metalness: 0.05,
});
const brickWall = new THREE.Mesh(brickGeometry, brickMaterial);
brickWall.position.set(-1.5, 1.2, 0);
brickWall.castShadow = true;
brickWall.receiveShadow = true;
scene.add(brickWall);

// -----------------------------------------------------------------------------
// 3. Planet (Sphere Geometry + 2K Equirectangular Earth & Normal Maps)
// -----------------------------------------------------------------------------
const planetGeometry = new THREE.SphereGeometry(1.15, 64, 32);
const planetMaterial = new THREE.MeshStandardMaterial({
  map: planetTexture,
  normalMap: planetNormalTexture,
  roughnessMap: planetSpecularTexture,
  roughness: 0.4,
  metalness: 0.1,
});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.position.set(1.5, 1.2, 0);
planet.castShadow = true;
planet.receiveShadow = true;
scene.add(planet);

// -----------------------------------------------------------------------------
// 4. Product Package (Box Geometry + Packaging Texture with labels)
// -----------------------------------------------------------------------------
const packageGeometry = new THREE.BoxGeometry(2, 2.5, 1.6);
const packageMaterial = new THREE.MeshStandardMaterial({
  map: packageTexture,
  roughness: 0.7,
  metalness: 0.05,
});
const productPackage = new THREE.Mesh(packageGeometry, packageMaterial);
productPackage.position.set(4.5, 1.25, 0);
productPackage.castShadow = true;
productPackage.receiveShadow = true;
scene.add(productPackage);

// -----------------------------------------------------------------------------
// Lighting Setup
// -----------------------------------------------------------------------------

// Ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Hemisphere light for sky and ground color balance
const hemisphereLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.6);
scene.add(hemisphereLight);

// Key directional light casting soft shadows
const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.4);
keyLight.position.set(6, 10, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 30;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

// Fill directional light from opposite side
const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.9);
fillLight.position.set(-8, 6, 6);
scene.add(fillLight);

// Rim spotlight behind objects for edge silhouette highlights
const rimLight = new THREE.SpotLight(0x38bdf8, 4.0, 30, Math.PI / 4, 0.5, 1.2);
rimLight.position.set(0, 8, -8);
scene.add(rimLight);

// -----------------------------------------------------------------------------
// Animation Loop
// -----------------------------------------------------------------------------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();
  controls.update();

  // Subtle rotation to inspect 360 degree texture mapping
  woodenBox.rotation.y = elapsedTime * 0.25;
  brickWall.rotation.y = elapsedTime * 0.15;
  planet.rotation.y = elapsedTime * 0.35;
  productPackage.rotation.y = elapsedTime * 0.2;

  renderer.render(scene, camera);
}

animate();

// -----------------------------------------------------------------------------
// Resize Handler
// -----------------------------------------------------------------------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
