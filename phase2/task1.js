import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Scene setup with subtle fog
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0f17);
scene.fog = new THREE.FogExp2(0x0d0f17, 0.4);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.01,
  100,
);
camera.position.set(0.35, 0.25, 0.55);

// WebGL renderer with soft shadows and ACES tone mapping
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Ambient light for general visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Key directional light casting shadows
const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
mainLight.position.set(2, 3, 2);
mainLight.castShadow = true;
mainLight.shadow.mapSize.set(2048, 2048);
mainLight.shadow.bias = -0.0001;
scene.add(mainLight);

// Flashlight spotlight beam (toggled by switch button)
const torchBeam = new THREE.SpotLight(0xfff3cc, 0, 4, Math.PI / 5, 0.4, 1.2);
torchBeam.castShadow = true;
torchBeam.shadow.mapSize.set(1024, 1024);
scene.add(torchBeam);
scene.add(torchBeam.target);

// Rim fill light
const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
rimLight.position.set(-2, 1, -2);
scene.add(rimLight);

// Dynamic pointer light for parallax
const pointerLight = new THREE.PointLight(0x818cf8, 1.5, 2);
pointerLight.position.set(0, 0.5, 0.5);
scene.add(pointerLight);

// Ground floor receiving shadows
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(6, 6),
  new THREE.MeshStandardMaterial({
    color: 0x11131f,
    roughness: 0.8,
    metalness: 0.2,
  }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.1;
floor.receiveShadow = true;
scene.add(floor);

// Polar grid visual helper
const polarGrid = new THREE.PolarGridHelper(1.5, 16, 8, 64, 0x3b82f6, 0x1e293b);
polarGrid.position.y = -0.099;
scene.add(polarGrid);

// Orbit controls with damping and angle limits
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 0.2;
controls.maxDistance = 2.0;
controls.maxPolarAngle = Math.PI / 2 - 0.02;

// GLTF model loader and state variables
const gltfLoader = new GLTFLoader();
const modelPath = "/models/torch/portable_searchlight_1k.gltf";

let torchModel = null;
let bodyMesh = null;
let glassMesh = null;
const interactiveObjects = [];

gltfLoader.load(
  modelPath,
  (gltf) => {
    torchModel = gltf.scene;

    // Center model at origin
    const box = new THREE.Box3().setFromObject(torchModel);
    const center = box.getCenter(new THREE.Vector3());
    torchModel.position.sub(center);

    // Enable shadows on all child meshes
    torchModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        interactiveObjects.push(child);
      }
    });

    // Access specific meshes by name
    bodyMesh = torchModel.getObjectByName("Circle048");
    glassMesh = torchModel.getObjectByName("Circle048_1");

    // Customize body material
    if (bodyMesh) {
      bodyMesh.material.color.set("orange");
      bodyMesh.material.roughness = 0.3;
      bodyMesh.material.metalness = 0.5;
    }

    // Customize glass lens with physical refraction
    if (glassMesh) {
      glassMesh.material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 0.3,
        roughness: 0.05,
        transmission: 0.9,
        ior: 1.5,
        depthWrite: false,
      });
    }

    // Interactive 3D switch button placed over model's physical switch
    const buttonGeo = new THREE.SphereGeometry(0.0078, 24, 16);
    const buttonMat = new THREE.MeshStandardMaterial({
      color: 0xd90429,
      roughness: 0.25,
      metalness: 0.15,
      emissive: 0x660000,
      emissiveIntensity: 0.3,
    });
    const buttonMesh = new THREE.Mesh(buttonGeo, buttonMat);
    buttonMesh.name = "TorchButton";
    buttonMesh.scale.set(1, 0.65, 1);
    buttonMesh.position.set(0, 0.1, 0.0465);
    buttonMesh.castShadow = true;

    torchModel.add(buttonMesh);
    interactiveObjects.push(buttonMesh);

    // Attach spotlight beam to front of torch
    torchBeam.position.set(0, 0, 0.12);
    torchBeam.target.position.set(0, 0, 1.5);
    torchModel.add(torchBeam);
    torchModel.add(torchBeam.target);

    scene.add(torchModel);
  },
  undefined,
  (error) => console.error("Error loading model:", error),
);

// Raycasting and interaction setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const targetParallax = new THREE.Vector2();

let hoveredMesh = null;
let isTorchLightOn = false;

// Light beam color presets
const lightColors = [
  { name: "Warm Yellow", hex: 0xfff3aa },
  { name: "Cyan Ice", hex: 0x00f5ff },
  { name: "Neon Green", hex: 0x10b981 },
  { name: "Electric Purple", hex: 0xa855f7 },
  { name: "Laser Red", hex: 0xef4444 },
  { name: "Pure White", hex: 0xffffff },
];
let currentLightColorIndex = 0;

torchBeam.color.set(lightColors[currentLightColorIndex].hex);

// Pointer movement: parallax & hover wireframe
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  targetParallax.x = mouse.x * 0.3;
  targetParallax.y = mouse.y * 0.3;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects, true);

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object;

    if (hoveredMesh !== hitMesh) {
      if (hoveredMesh && hoveredMesh.material) {
        if (hoveredMesh.name !== "TorchButton") {
          hoveredMesh.material.wireframe = false;
        } else {
          hoveredMesh.material.emissiveIntensity = 0.3;
        }
      }

      hoveredMesh = hitMesh;

      if (hoveredMesh.name === "TorchButton") {
        hoveredMesh.material.emissiveIntensity = 1.0;
      } else if (hoveredMesh.material) {
        hoveredMesh.material.wireframe = true;
      }
    }

    document.body.style.cursor = "pointer";
  } else {
    if (hoveredMesh && hoveredMesh.material) {
      if (hoveredMesh.name !== "TorchButton") {
        hoveredMesh.material.wireframe = false;
      } else {
        hoveredMesh.material.emissiveIntensity = 0.3;
      }
    }
    hoveredMesh = null;
    document.body.style.cursor = "default";
  }
});

// Single click: raycast specifically on the button to toggle light
window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects, true);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;

    if (clickedMesh.name === "TorchButton") {
      // Button press animation
      clickedMesh.position.y -= 0.003;
      setTimeout(() => {
        clickedMesh.position.y += 0.003;
      }, 150);

      // Toggle flashlight beam
      isTorchLightOn = !isTorchLightOn;
      torchBeam.intensity = isTorchLightOn ? 25 : 0;

      const currentColor = lightColors[currentLightColorIndex];

      // Update lens glow and button indicator
      if (glassMesh) {
        if (isTorchLightOn) {
          glassMesh.material.emissive = new THREE.Color(currentColor.hex);
          glassMesh.material.emissiveIntensity = 1.5;
          clickedMesh.material.emissive = new THREE.Color(0x22c55e);
        } else {
          glassMesh.material.emissive = new THREE.Color(0x000000);
          glassMesh.material.emissiveIntensity = 0;
          clickedMesh.material.emissive = new THREE.Color(0x990000);
        }
      }

      console.log(
        `[Button Clicked] Flashlight: ${isTorchLightOn ? "ON" : "OFF"}`,
      );
    }
  }
});

// Double click: cycle light beam color
window.addEventListener("dblclick", () => {
  currentLightColorIndex = (currentLightColorIndex + 1) % lightColors.length;
  const newColor = lightColors[currentLightColorIndex];

  torchBeam.color.set(newColor.hex);

  if (glassMesh && isTorchLightOn) {
    glassMesh.material.emissive.set(newColor.hex);
  }

  console.log("Light Beam Color:", newColor.name, newColor.hex);
});

// Render loop with smooth controls and parallax
function animate() {
  requestAnimationFrame(animate);

  controls.update();

  pointerLight.position.x +=
    (targetParallax.x - pointerLight.position.x) * 0.05;
  pointerLight.position.y +=
    (0.4 + targetParallax.y - pointerLight.position.y) * 0.05;

  renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
