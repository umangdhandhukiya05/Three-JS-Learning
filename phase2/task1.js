import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { COMMON_MODELS, LIGHT_COLOR_PRESETS } from "./constants.js";

// Scene setup with subtle fog
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0f17);
scene.fog = new THREE.FogExp2(0x0d0f17, 0.4);

// Camera setup (positioned behind the torch model, looking forward)
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.01,
  100,
);
camera.position.set(0, 0.22, -0.55);
camera.lookAt(0, 0.05, 1.0);

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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.0);
scene.add(ambientLight);

// Key directional light casting shadows
const mainLight = new THREE.DirectionalLight(0xffffff, 0.0);
mainLight.position.set(2, 3, 2);
mainLight.castShadow = true;
mainLight.shadow.mapSize.set(2048, 2048);
mainLight.shadow.bias = -0.0001;
scene.add(mainLight);

// Flashlight spotlight beam (starts OFF, toggled by switch button)
const torchBeam = new THREE.SpotLight(0xfff3cc, 0, 4, Math.PI / 5, 0.4, 1.2);
torchBeam.castShadow = true;
torchBeam.shadow.mapSize.set(1024, 1024);

// Rim fill light
const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
rimLight.position.set(-2, 1, -2);
scene.add(rimLight);

// Texture loader for ground textures
const textureLoader = new THREE.TextureLoader();

const groundColorTexture = textureLoader.load(
  "/textures/ground/textures/rocky_terrain_02_diff_1k.jpg",
);
groundColorTexture.colorSpace = THREE.SRGBColorSpace;
groundColorTexture.wrapS = THREE.RepeatWrapping;
groundColorTexture.wrapT = THREE.RepeatWrapping;
groundColorTexture.repeat.set(4, 4);

const groundARMTexture = textureLoader.load(
  "/textures/ground/textures/rocky_terrain_02_arm_1k.jpg",
);
groundARMTexture.wrapS = THREE.RepeatWrapping;
groundARMTexture.wrapT = THREE.RepeatWrapping;
groundARMTexture.repeat.set(4, 4);

const groundNormalTexture = textureLoader.load(
  "/textures/ground/textures/rocky_terrain_02_nor_gl_1k.jpg",
);
groundNormalTexture.wrapS = THREE.RepeatWrapping;
groundNormalTexture.wrapT = THREE.RepeatWrapping;
groundNormalTexture.repeat.set(4, 4);

// Ground floor receiving shadows
const floorGeometry = new THREE.PlaneGeometry(6, 6);
floorGeometry.setAttribute(
  "uv2",
  new THREE.BufferAttribute(floorGeometry.attributes.uv.array, 2),
);

const floorMaterial = new THREE.MeshStandardMaterial({
  map: groundColorTexture,
  aoMap: groundARMTexture,
  roughnessMap: groundARMTexture,
  metalnessMap: groundARMTexture,
  normalMap: groundNormalTexture,
  roughness: 1.0,
  metalness: 0.1,
  aoMapIntensity: 1.0,
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.1;
floor.receiveShadow = true;
scene.add(floor);

// 3D Axes Helper: Coordinate system visualization (Red = +X, Green = +Y, Blue = +Z)
const axesHelper = new THREE.AxesHelper(3);
axesHelper.position.set(0, -0.099, 0);
axesHelper.renderOrder = 1;
scene.add(axesHelper);

// Keyboard shortcut: Press 'X' to toggle axis helper visibility
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "x") {
    axesHelper.visible = !axesHelper.visible;
    console.log(`[Axes Control] Axes Helper Visible: ${axesHelper.visible}`);
  }
});

// WASD / Arrow keys tracking for torchModel movement
const keysPressed = {};
window.addEventListener("keydown", (event) => {
  keysPressed[event.key.toLowerCase()] = true;
});
window.addEventListener("keyup", (event) => {
  keysPressed[event.key.toLowerCase()] = false;
});


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
    torchModel.scale.setScalar(0.2)

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

// Load environment models (tree, plants, rocks, branches) from constants
COMMON_MODELS.forEach((item) => {
  gltfLoader.load(
    item.path,
    (gltf) => {
      let model = gltf.scene;

      // Extract specific sub-mesh if requested
      if (item.subMeshName) {
        const subObject = model.getObjectByName(item.subMeshName);
        if (subObject) {
          model = subObject;
          model.position.set(0, 0, 0);
        }
      }

      model.scale.setScalar(item.scale);

      // Compute bounding box to align base perfectly with the floor at y = -0.1
      const box = new THREE.Box3().setFromObject(model);
      const bottomY = box.min.y;
      model.position.set(item.position.x, -0.1 - bottomY, item.position.z);
      model.rotation.y = item.rotationY;

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(model);
    },
    undefined,
    (error) => console.error(`Error loading model (${item.name}):`, error),
  );
});

// Raycasting and interaction setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const targetTorchRotation = { x: 0, y: 0 };

let hoveredMesh = null;
let isTorchLightOn = false;

let currentLightColorIndex = 0;

torchBeam.color.set(LIGHT_COLOR_PRESETS[currentLightColorIndex].hex);

// Camera orbit variables (click and drag)
let isMouseDown = false;
let hasDragged = false;
let cameraOrbitYaw = Math.PI; // Starts behind the torch
let cameraOrbitPitch = 0.35; // Slight elevation
const cameraOrbitDistance = 0.55;

// Mouse down / up tracking for camera drag orbit and button click
window.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    isMouseDown = true;
    hasDragged = false;
  }
});

window.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    // If released without dragging, process click on switch button
    if (!hasDragged) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects, true);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;

        if (clickedMesh.name === "TorchButton") {
          clickedMesh.position.y -= 0.003;
          setTimeout(() => {
            clickedMesh.position.y += 0.003;
          }, 150);

          isTorchLightOn = !isTorchLightOn;
          torchBeam.intensity = isTorchLightOn ? 25 : 0;

          const currentColor = LIGHT_COLOR_PRESETS[currentLightColorIndex];

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
    }
    isMouseDown = false;
  }
});

// Pointer movement: Aim torch light with pointer, Orbit camera on drag
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // 1. Pointer move: rotate and aim torch flashlight light
  targetTorchRotation.y = -mouse.x * Math.PI * 0.5;
  targetTorchRotation.x = -mouse.y * 0.4;

  // 2. Mouse click & drag: rotate / orbit camera position around torch
  if (isMouseDown) {
    hasDragged = true;
    cameraOrbitYaw -= event.movementX * 0.006;
    cameraOrbitPitch += event.movementY * 0.006;
    // Clamp vertical orbit angle so camera doesn't flip or clip underground
    cameraOrbitPitch = Math.max(0.08, Math.min(Math.PI / 2.2, cameraOrbitPitch));
  }

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

// Double click: cycle light beam color
window.addEventListener("dblclick", () => {
  currentLightColorIndex =
    (currentLightColorIndex + 1) % LIGHT_COLOR_PRESETS.length;
  const newColor = LIGHT_COLOR_PRESETS[currentLightColorIndex];

  torchBeam.color.set(newColor.hex);

  if (glassMesh && isTorchLightOn) {
    glassMesh.material.emissive.set(newColor.hex);
  }

  console.log("Light Beam Color:", newColor.name, newColor.hex);
});

// Render loop: pointer-aimed torch, click-drag camera orbit, smooth movement
function animate() {
  requestAnimationFrame(animate);

  if (torchModel) {
    // 1. Smoothly rotate torch towards pointer aim
    torchModel.rotation.y +=
      (targetTorchRotation.y - torchModel.rotation.y) * 0.08;
    torchModel.rotation.x +=
      (targetTorchRotation.x - torchModel.rotation.x) * 0.08;

    // 2. WASD movement relative to camera view
    const torchSpeed = 0.02;
    const sinCam = Math.sin(cameraOrbitYaw);
    const cosCam = Math.cos(cameraOrbitYaw);

    if (keysPressed["w"] || keysPressed["arrowup"]) {
      torchModel.position.x -= sinCam * torchSpeed;
      torchModel.position.z -= cosCam * torchSpeed;
    }
    if (keysPressed["s"] || keysPressed["arrowdown"]) {
      torchModel.position.x += sinCam * torchSpeed;
      torchModel.position.z += cosCam * torchSpeed;
    }
    if (keysPressed["a"] || keysPressed["arrowleft"]) {
      torchModel.position.x -= cosCam * torchSpeed;
      torchModel.position.z += sinCam * torchSpeed;
    }
    if (keysPressed["d"] || keysPressed["arrowright"]) {
      torchModel.position.x += cosCam * torchSpeed;
      torchModel.position.z -= sinCam * torchSpeed;
    }

    // 3. Camera position calculated from mouse drag orbit
    const targetCamX =
      torchModel.position.x +
      cameraOrbitDistance * Math.sin(cameraOrbitYaw) * Math.cos(cameraOrbitPitch);
    const targetCamY =
      torchModel.position.y + cameraOrbitDistance * Math.sin(cameraOrbitPitch);
    const targetCamZ =
      torchModel.position.z +
      cameraOrbitDistance * Math.cos(cameraOrbitYaw) * Math.cos(cameraOrbitPitch);

    camera.position.x += (targetCamX - camera.position.x) * 0.12;
    camera.position.y += (targetCamY - camera.position.y) * 0.12;
    camera.position.z += (targetCamZ - camera.position.z) * 0.12;

    camera.lookAt(
      torchModel.position.x,
      torchModel.position.y + 0.05,
      torchModel.position.z,
    );
  }

  renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
