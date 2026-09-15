import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createCar } from "./car.js";

// 1. Scene & Renderer Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1128);
scene.fog = new THREE.FogExp2(0x0a1128, 0.012);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

// 2. Perspective Camera Setup
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(2.8, 3.5, 11);
camera.lookAt(2.8, 1, 0);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(2.8, 1.2, 0);

// 3. Texture Loader & Road Texture Setup
const textureLoader = new THREE.TextureLoader();

const roadTexture = textureLoader.load("/textures/road.jpg");
roadTexture.colorSpace = THREE.SRGBColorSpace;
roadTexture.anisotropy = maxAnisotropy;
roadTexture.wrapS = THREE.RepeatWrapping;
roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(1, 24); // Tile 24 times along the highway length

// 4. Highway Road & Surrounding Terrain
// Highway road surface
const roadGeometry = new THREE.PlaneGeometry(12, 240);
const roadMaterial = new THREE.MeshStandardMaterial({
  map: roadTexture,
  roughness: 0.65,
  metalness: 0.1,
});
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.01;
road.receiveShadow = true;
scene.add(road);

// Surrounding grass landscape
const terrainGeometry = new THREE.PlaneGeometry(240, 240);
const terrainMaterial = new THREE.MeshStandardMaterial({
  color: 0x0f2b1d, // Deep night grass tone
  roughness: 0.9,
  metalness: 0.05,
  side: THREE.DoubleSide,
});
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.position.y = 0;
terrain.receiveShadow = true;
scene.add(terrain);

// 5. Street Light Poles Along Highway (Depth Reference for FOV & Clipping)
const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 6, 16);
const poleMat = new THREE.MeshStandardMaterial({
  color: 0x334155,
  metalness: 0.6,
  roughness: 0.3,
});
const lampHeadGeo = new THREE.BoxGeometry(0.4, 0.15, 0.8);
const lampHeadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

const lightPoles = [];
const POLE_SPACING = 16;
const MIN_Z = -300;
const MAX_Z = 300;

for (let z = MIN_Z; z <= MAX_Z; z += POLE_SPACING) {
  const polePair = new THREE.Group();
  polePair.position.z = z;

  // Left side lamp post
  const leftPole = new THREE.Mesh(poleGeo, poleMat);
  leftPole.position.set(-6.8, 3, 0);
  leftPole.castShadow = true;
  polePair.add(leftPole);

  const leftHead = new THREE.Mesh(lampHeadGeo, lampHeadMat);
  leftHead.position.set(-6.4, 6, 0);
  polePair.add(leftHead);

  const leftBulb = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.05, 0.6),
    bulbMat,
  );
  leftBulb.position.set(-6.4, 5.9, 0);
  polePair.add(leftBulb);

  // Right side lamp post
  const rightPole = new THREE.Mesh(poleGeo, poleMat);
  rightPole.position.set(6.8, 3, 0);
  rightPole.castShadow = true;
  polePair.add(rightPole);

  const rightHead = new THREE.Mesh(lampHeadGeo, lampHeadMat);
  rightHead.position.set(6.4, 6, 0);
  polePair.add(rightHead);

  const rightBulb = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.05, 0.6),
    bulbMat,
  );
  rightBulb.position.set(6.4, 5.9, 0);
  polePair.add(rightBulb);

  scene.add(polePair);
  lightPoles.push(polePair);
}

// 6. Featured 3D Car Model on Highway
const { car, wheels } = createCar();
// In car.js: +X is Front (Headlights), -X is Rear (Tail Lights)
// Rotating by Math.PI / 2 points +X forward towards -Z (down the road into the distance)
car.position.set(2.8, 0, 0);
car.rotation.y = Math.PI / 2;
car.scale.set(1.35, 1.35, 1.35);

car.traverse((child) => {
  if (child.isMesh) {
    child.castShadow = true;
    child.receiveShadow = true;
  }
});
scene.add(car);

// 7. Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

const hemisphereLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.5);
scene.add(hemisphereLight);

// Key Directional Light with soft shadows
const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
sunLight.position.set(15, 25, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 80;
sunLight.shadow.camera.left = -25;
sunLight.shadow.camera.right = 25;
sunLight.shadow.camera.top = 25;
sunLight.shadow.camera.bottom = -25;
sunLight.shadow.bias = -0.0004;
sunLight.shadow.radius = 2;
scene.add(sunLight);

// Car Headlight Spotlights (Yellow Beam shining FORWARD down the road towards -Z)
// Headlights are at the front of the car (Z = -2.8)
const leftHeadlightSpot = new THREE.SpotLight(
  0xfff9c4,
  5.0,
  45,
  Math.PI / 5,
  0.4,
  1.2,
);
leftHeadlightSpot.position.set(2.8 + 0.65 * 1.35, 1.45, -2.8);
leftHeadlightSpot.target.position.set(2.8 + 0.65 * 1.35, 0, -35);
scene.add(leftHeadlightSpot);
scene.add(leftHeadlightSpot.target);

const rightHeadlightSpot = new THREE.SpotLight(
  0xfff9c4,
  5.0,
  45,
  Math.PI / 5,
  0.4,
  1.2,
);
rightHeadlightSpot.position.set(2.8 - 0.65 * 1.35, 1.45, -2.8);
rightHeadlightSpot.target.position.set(2.8 - 0.65 * 1.35, 0, -35);
scene.add(rightHeadlightSpot);
scene.add(rightHeadlightSpot.target);

// Car Tail Lights (Subtle Red Glow at the REAR of the car at Z = +2.8)
const leftTailLightGlow = new THREE.PointLight(0xff0000, 0.4, 2, 2);
leftTailLightGlow.position.set(2.8 + 0.65 * 1.35, 1.45, 2.8);
scene.add(leftTailLightGlow);

const rightTailLightGlow = new THREE.PointLight(0xff0000, 0.4, 2, 2);
rightTailLightGlow.position.set(2.8 - 0.65 * 1.35, 1.45, 2.8);
scene.add(rightTailLightGlow);

// 8. Interactive Camera Experimentation Presets
let isDollyZoomActive = false;
let isDrivingAnimation = true;

/**
 * Updates camera FOV or clipping planes.
 * IMPORTANT: Whenever fov, aspect, near, or far are modified,
 * camera.updateProjectionMatrix() MUST be called!
 */
function applyCameraPreset(fov, near, far, posX, posY, posZ) {
  camera.fov = fov;
  camera.near = near;
  camera.far = far;
  camera.updateProjectionMatrix();

  camera.position.set(posX, posY, posZ);
  controls.target.set(2.8, 1.2, 0);
}

// Keyboard shortcuts for experimenting with Camera concepts:
// - '1': Standard View (FOV 50°) — Natural human eye perspective from rear 3/4
// - '2': Wide-Angle Lens (FOV 95°) — Dramatic dynamic road perspective & speed feel
// - '3': Cinematic Telephoto Lens (FOV 18°) — Flat compressed highway background
// - '4': Near Clipping Plane Demo (near = 5.0) — Slices through car
// - '5': Far Clipping Plane Demo (far = 25.0) — Clips distant highway lights
// - 'd': Toggle Hitchcock Dolly Zoom (Vertigo effect)
// - 'a': Toggle driving speed animation
window.addEventListener("keydown", (e) => {
  if (e.key === "1") {
    isDollyZoomActive = false;
    applyCameraPreset(50, 0.1, 1000, 2.8, 3.5, 11);
    console.log("Preset 1: Normal View (FOV: 50°, Near: 0.1, Far: 1000)");
  } else if (e.key === "2") {
    isDollyZoomActive = false;
    applyCameraPreset(95, 0.1, 1000, 2.8, 2.2, 5.0);
    console.log(
      "Preset 2: Wide Angle (FOV: 95° — Observe exaggerated road perspective)",
    );
  } else if (e.key === "3") {
    isDollyZoomActive = false;
    applyCameraPreset(18, 0.1, 1000, 2.8, 4.5, 26);
    console.log(
      "Preset 3: Telephoto (FOV: 18° — Observe flat, compressed road background)",
    );
  } else if (e.key === "4") {
    isDollyZoomActive = false;
    applyCameraPreset(50, 5.0, 1000, 2.8, 3.5, 11);
    console.log(
      "Preset 4: Near Clipping Plane (Near: 5.0 — Observe car sliced)",
    );
  } else if (e.key === "5") {
    isDollyZoomActive = false;
    applyCameraPreset(50, 0.1, 25.0, 2.8, 3.5, 11);
    console.log(
      "Preset 5: Far Clipping Plane (Far: 25.0 — Observe distant road clipped out)",
    );
  } else if (e.key === "d" || e.key === "D") {
    isDollyZoomActive = !isDollyZoomActive;
    console.log(
      `Dolly Zoom (Vertigo Effect): ${isDollyZoomActive ? "ON" : "OFF"}`,
    );
  } else if (e.key === "a" || e.key === "A") {
    isDrivingAnimation = !isDrivingAnimation;
  }
});

// -----------------------------------------------------------------------------
// 9. Animation & Render Loop
// -----------------------------------------------------------------------------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();
  const delta = clock.getDelta();

  // Smooth orbit controls update
  controls.update();

  // Animate road texture scrolling, light poles & wheel rotation
  if (isDrivingAnimation) {
    const driveSpeed = 100;
    const uvSpeed = driveSpeed * 0.001;
    roadTexture.offset.y += uvSpeed;

    // Move light poles towards +Z (past the car) and loop back smoothly
    const poleSpeed = uvSpeed * (240 / 24); // Synchronized with road texture units (1.0 unit/frame)
    const totalSpan = MAX_Z - MIN_Z + POLE_SPACING;
    for (let i = 0; i < lightPoles.length; i++) {
      lightPoles[i].position.z += poleSpeed;
      if (lightPoles[i].position.z > MAX_Z) {
        lightPoles[i].position.z -= totalSpan;
      }
    }

    wheels.frontLeftWheel.rotation.y += 0.12;
    wheels.frontRightWheel.rotation.y += 0.12;
    wheels.rearLeftWheel.rotation.y += 0.12;
    wheels.rearRightWheel.rotation.y += 0.12;
  }

  // Dolly Zoom / Vertigo Effect Demonstration
  if (isDollyZoomActive) {
    const targetDistance = 10;
    const initialFov = 50;
    const initialHalfHeight =
      Math.tan(THREE.MathUtils.degToRad(initialFov / 2)) * targetDistance;

    const currentDist = 11 + Math.sin(elapsedTime * 1.2) * 7;
    camera.position.z = currentDist;
    camera.position.y = 2.0 + (currentDist / 11) * 1.5;

    const newFov =
      2 * THREE.MathUtils.radToDeg(Math.atan(initialHalfHeight / currentDist));
    camera.fov = newFov;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);
}

animate();

// -----------------------------------------------------------------------------
// 10. Window Resize Handling (Aspect Ratio & Projection Update)
// -----------------------------------------------------------------------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
