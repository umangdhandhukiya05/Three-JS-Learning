import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import gsap from "gsap";
import { COMMON_MODELS, ANIMAL_MODELS, LIGHT_COLOR_PRESETS } from "./constants.js";

// Day / Night state management (Space key toggles Day/Night)
let isDayMode = false;
let hdrTexture = null;

// Scene setup with subtle fog (Default: Night mode with black background & no HDR environment)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.4);

// Camera setup (initial wide overview position for GSAP entry animation)
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.01,
  100,
);
camera.position.set(0.65, 0.55, 0.85);
camera.lookAt(0, 0.05, 0);

// WebGL renderer with soft shadows and ACES tone mapping
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Flashlight spotlight beam (starts OFF, toggled by switch button)
const torchBeam = new THREE.SpotLight(0xfff3cc, 0, 4, Math.PI / 5, 0.4, 1.2);
torchBeam.castShadow = true;
torchBeam.shadow.mapSize.set(1024, 1024);

// Rim fill light
const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
rimLight.position.set(-2, 1, -2);
scene.add(rimLight);

// Function to toggle between Day mode (Environment + White Background) and Night mode (No Environment + Black Background)
function updateDayNightMode() {
  if (isDayMode) {
    // Day Mode: HDR Environment + White Background
    scene.environment = hdrTexture;
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.FogExp2(0xffffff, 0.15);
    rimLight.intensity = 0.4;
    console.log("[Day/Night] Mode: DAY ☀️ (HDR Environment ON | White Background)");
  } else {
    // Night Mode: No HDR Environment + Black Background
    scene.environment = null;
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.4);
    rimLight.intensity = 1.0;
    console.log("[Day/Night] Mode: NIGHT 🌙 (HDR Environment OFF | Black Background)");
  }
}

// HDR Environment Map Loader (IBL - Image Based Lighting for PBR reflections & lighting)
const rgbeLoader = new RGBELoader();
rgbeLoader.load("/hdri/phalzer_forest_01_2k.hdr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  hdrTexture = texture;

  // Apply environment if currently in Day mode
  if (isDayMode) {
    scene.environment = hdrTexture;
  }

  // Learning Note: Uncomment below if you want the HDRI visible as the 360° skybox background
  // scene.background = texture;
});

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

// 5. Transform Controls: Interactive 3D manipulation gizmo
const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.size = 0.75;
scene.add(transformControls.getHelper());

let isTransforming = false;
transformControls.addEventListener("dragging-changed", (event) => {
  isTransforming = event.value;
});

// Keyboard shortcuts for Axes & Transform Controls, Day/Night, and Animal Animations:
// 'Space' = Toggle Day/Night, 'X' = Toggle Axes, 'T' = Translate, 'R' = Rotate, 'Y' = Scale, 'C' = Toggle Space, 'V' = Snapping, 'H' = Toggle Gizmo
// Keys '1'-'8' = Trigger Animal Animations:
// [1: Idle, 2: Walk, 3: Gallop/Run, 4: Jump, 5: Headbutt/Attack, 6: Kick, 7: Eating, 8: Death]
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    isDayMode = !isDayMode;
    updateDayNightMode();
    return;
  }

  // Keyboard controls for Animal Skeletal Animations (Deer, Horse, Husky, Wolf)
  const animKeyMap = {
    "1": "Idle",
    "2": "Walk",
    "3": "Gallop",
    "4": "Gallop_Jump",
    "5": "Attack_Headbutt",
    "6": "Attack_Kick",
    "7": "Eating",
    "8": "Death",
  };

  if (animKeyMap[event.key]) {
    const targetAnim = animKeyMap[event.key];
    console.log(`[Keyboard Animation Trigger] Playing "${targetAnim}" on all models`);
    animalObjects.forEach((model) => {
      // Fallback for models that might have slightly different clip names (e.g. "Attack" vs "Attack_Headbutt")
      if (model.userData.actions) {
        let clipToPlay = targetAnim;
        if (!model.userData.actions[clipToPlay]) {
          if (targetAnim === "Attack_Headbutt" && model.userData.actions["Attack"]) {
            clipToPlay = "Attack";
          } else if (targetAnim === "Gallop_Jump" && model.userData.actions["Jump_ToIdle"]) {
            clipToPlay = "Jump_ToIdle";
          }
        }
        if (model.userData.actions[clipToPlay]) {
          playAnimalAnimation(model, clipToPlay, 0.3);
        }
      }
    });
    return;
  }

  const key = event.key.toLowerCase();
  if (key === "x") {
    axesHelper.visible = !axesHelper.visible;
    console.log(`[Axes Control] Axes Helper Visible: ${axesHelper.visible}`);
  } else if (key === "t") {
    transformControls.setMode("translate");
    console.log("[TransformControls] Mode: Translate (Move)");
  } else if (key === "r") {
    transformControls.setMode("rotate");
    console.log("[TransformControls] Mode: Rotate");
  } else if (key === "y") {
    transformControls.setMode("scale");
    console.log("[TransformControls] Mode: Scale");
  } else if (key === "c") {
    const nextSpace = transformControls.space === "local" ? "world" : "local";
    transformControls.setSpace(nextSpace);
    console.log(`[TransformControls] Coordinate Space: ${nextSpace.toUpperCase()}`);
  } else if (key === "v") {
    const isSnapping = transformControls.translationSnap !== null;
    transformControls.setTranslationSnap(isSnapping ? null : 0.25);
    transformControls.setRotationSnap(
      isSnapping ? null : THREE.MathUtils.degToRad(15),
    );
    transformControls.setScaleSnap(isSnapping ? null : 0.1);
    console.log(
      `[TransformControls] Snapping: ${!isSnapping ? "ON (0.25m / 15°)" : "OFF"}`,
    );
  } else if (key === "h") {
    transformControls.enabled = !transformControls.enabled;
    transformControls.getHelper().visible = transformControls.enabled;
    console.log(
      `[TransformControls] Gizmo Visible: ${transformControls.enabled}`,
    );
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

// Animation state: initial GSAP sequence flag
let isIntroAnimating = true;

// GLTF model loader and state variables
const gltfLoader = new GLTFLoader();
const modelPath = "/models/torch/portable_searchlight_1k.gltf";

let torchModel = null;
let bodyMesh = null;
let glassMesh = null;
let buttonMesh = null;
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
    buttonMesh = new THREE.Mesh(buttonGeo, buttonMat);
    buttonMesh.name = "TorchButton";
    buttonMesh.scale.set(1, 0.65, 1);
    buttonMesh.position.set(0, 0.1, 0.0465);
    buttonMesh.castShadow = true;

    torchModel.add(buttonMesh);
    interactiveObjects.push(buttonMesh);

    // Attach spotlight beam to front of torch (Light remains OFF initially)
    torchBeam.position.set(0, 0, 0.12);
    torchBeam.target.position.set(0, 0, 1.5);
    torchModel.add(torchBeam);
    torchModel.add(torchBeam.target);

    scene.add(torchModel);

    // Attach TransformControls to the loaded torch model
    transformControls.attach(torchModel);

    // Initial transform setup before GSAP sequence triggers
    torchModel.position.set(0, 0.4, 0.6);
    torchModel.rotation.set(-0.35, Math.PI * 1.5, 0.2);
    torchModel.scale.set(0.001, 0.001, 0.001);

    // GSAP Coordinated Product Presentation Sequence (Timeline)
    const introTimeline = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        isIntroAnimating = false;
        cameraOrbitYaw = Math.PI;
        cameraOrbitPitch = 0.35;
        targetTorchRotation.x = 0;
        targetTorchRotation.y = 0;
      },
    });

    // 1. Product enters the scene & scales up
    introTimeline.to(torchModel.position, {
      x: 0,
      y: 0,
      z: 0,
      duration: 2.0,
      ease: "power3.out",
    });

    introTimeline.to(
      torchModel.scale,
      {
        x: 0.2,
        y: 0.2,
        z: 0.2,
        duration: 2.0,
        ease: "back.out(1.4)",
      },
      "<",
    );

    // 2. Camera sweeps toward the torch and locks into inspection view
    introTimeline.to(
      camera.position,
      {
        x: 0,
        y: 0.22,
        z: -0.55,
        duration: 2.4,
        ease: "power2.inOut",
      },
      "-=1.4",
    );

    // 3. Product rotates to showcase 3D design from all angles
    introTimeline.to(
      torchModel.rotation,
      {
        x: 0,
        y: 0,
        z: 0,
        duration: 2.2,
        ease: "power2.inOut",
      },
      "-=2.0",
    );

    // 4. Product parts animate (tactile button press check and lens shimmer)
    introTimeline.to(
      buttonMesh.position,
      {
        y: 0.097,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut",
      },
      "-=0.4",
    );

    if (glassMesh) {
      introTimeline.to(
        glassMesh.material,
        {
          opacity: 0.65,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        },
        "<",
      );
    }
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

//ANIMATIONMIXER & SKELETAL ANIMATION PIPELINE
// Animation mixers & clock for animated animal models
const clock = new THREE.Clock();
const animationMixers = [];
const animalObjects = [];
const interactiveAnimalMeshes = [];

/**
 * Smoothly cross-fades an animal model to a target animation state
 * @param {THREE.Object3D} model - GLTF scene root
 * @param {string} targetAnimName - Name of the AnimationClip
 * @param {number} duration - Cross-fade transition time in seconds
 */
function playAnimalAnimation(model, targetAnimName, duration = 0.3) {
  const targetAction = model.userData.actions[targetAnimName];
  const currentAction = model.userData.currentAction;

  if (!targetAction || targetAction === currentAction) return;

  // Configure finite one-shot clips (Play once, do not loop continuously)
  const oneShotClips = [
    "Attack_Headbutt",
    "Attack_Kick",
    "Attack",
    "Gallop_Jump",
    "Jump_toIdle",
    "Jump_ToIdle",
    "Idle_HitReact1",
    "Idle_HitReact2",
    "Death",
  ];

  if (oneShotClips.includes(targetAnimName)) {
    targetAction.setLoop(THREE.LoopOnce);
    targetAction.clampWhenFinished = true; // Hold pose on completion (e.g., Death pose)
  } else {
    targetAction.setLoop(THREE.LoopRepeat);
  }

  // 1. Reset incoming action playhead and enable full weight
  targetAction.reset();
  targetAction.enabled = true;
  targetAction.setEffectiveTimeScale(1);
  targetAction.setEffectiveWeight(1);

  // 2. Perform smooth skeletal cross-fade blending
  if (currentAction) {
    currentAction.crossFadeTo(targetAction, duration, true);
  }

  // 3. Play target action and update active references
  targetAction.play();
  model.userData.currentAction = targetAction;
  model.userData.currentAnimName = targetAnimName;

  console.log(`[AnimationMixer] ${model.name} -> State: "${targetAnimName}"`);
}

// Load animated animal models (Deer, Horse, Horse_White, Husky, Wolf)
ANIMAL_MODELS.forEach((item) => {
  gltfLoader.load(
    item.path,
    (gltf) => {
      const model = gltf.scene;
      // console.log(gltf)
      model.name = item.name;
      model.scale.setScalar(item.scale);

      // Compute bounding box to align base with the floor at y = -0.1
      const box = new THREE.Box3().setFromObject(model);
      const bottomY = box.min.y;
      model.position.set(item.position.x, -0.1 - bottomY, item.position.z);
      model.rotation.y = item.rotationY;

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.userData.parentAnimal = model;
          interactiveAnimalMeshes.push(child);
        }
      });

      // 1. Create AnimationMixer attached to this model instance
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        animationMixers.push(mixer);

        const actions = {};

        // 2. Convert all AnimationClips into AnimationActions
        // Deer.gltf & Horse.gltf clips categorized:
        // - Movement: 'Walk', 'Gallop', 'Gallop_Jump', 'Jump_toIdle'
        // - Combat/Action: 'Attack_Headbutt', 'Attack_Kick', 'Death'
        // - Idle/Behavior: 'Idle', 'Idle_2', 'Idle_Headlow', 'Eating'
        gltf.animations.forEach((clip) => {
          actions[clip.name] = mixer.clipAction(clip);
        });

        // 3. Start default animation state (Idle or Eating)
        const initialAnimName = item.defaultAnimation || "Idle";
        const initialAction = actions[initialAnimName] || Object.values(actions)[0];

        if (initialAction) {
          initialAction.play();
          model.userData.currentAction = initialAction;
          model.userData.currentAnimName = initialAnimName;
        }

        // 4. One-shot completion listener: Return back to Idle/Eating when finite action ends
        mixer.addEventListener("finished", () => {
          if (model.userData.currentAnimName !== "Death") {
            const defaultAnim = item.defaultAnimation || "Idle";
            playAnimalAnimation(model, defaultAnim, 0.4);
          }
        });

        model.userData.mixer = mixer;
        model.userData.actions = actions;
        model.userData.animations = gltf.animations;
        model.userData.animSequenceIndex = 0;
      }

      animalObjects.push(model);
      scene.add(model);
    },
    undefined,
    (error) => console.error(`Error loading animal model (${item.name}):`, error),
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
    if (!hasDragged && !isIntroAnimating) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects, true);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;

        if (clickedMesh.name === "TorchButton") {
          // GSAP button click press animation
          gsap.to(clickedMesh.position, {
            y: 0.097,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut",
          });

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

      // Check if an animated animal (Deer, Horse, Husky, Wolf) was clicked
      const animalIntersects = raycaster.intersectObjects(interactiveAnimalMeshes, true);
      if (animalIntersects.length > 0) {
        const hitObject = animalIntersects[0].object;
        const animalModel = hitObject.userData.parentAnimal;

        if (animalModel && animalModel.userData.actions) {
          // Cycle smoothly through animation categories on click:
          // Walk -> Gallop -> Gallop_Jump -> Attack_Headbutt -> Attack_Kick -> Eating -> Idle
          const availableActions = Object.keys(animalModel.userData.actions);
          const animationCycle = [
            "Walk",
            "Gallop",
            "Gallop_Jump",
            "Attack_Headbutt",
            "Attack_Kick",
            "Attack",
            "Eating",
            "Idle_2",
            "Idle",
          ].filter((name) => availableActions.includes(name));

          animalModel.userData.animSequenceIndex =
            ((animalModel.userData.animSequenceIndex || 0) + 1) % animationCycle.length;

          const nextAnim = animationCycle[animalModel.userData.animSequenceIndex];
          playAnimalAnimation(animalModel, nextAnim, 0.35);
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

  if (isIntroAnimating) return;

  // 1. Pointer move: rotate and aim torch flashlight light (disabled during transform gizmo drag)
  if (!isTransforming) {
    targetTorchRotation.y = -mouse.x * Math.PI * 0.5;
    targetTorchRotation.x = -mouse.y * 0.4;
  }

  // 2. Mouse click & drag: rotate / orbit camera position around torch
  if (isMouseDown && !isTransforming) {
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

// Double click: cycle light beam color with GSAP pulse feedback
window.addEventListener("dblclick", () => {
  if (isIntroAnimating) return;

  currentLightColorIndex =
    (currentLightColorIndex + 1) % LIGHT_COLOR_PRESETS.length;
  const newColor = LIGHT_COLOR_PRESETS[currentLightColorIndex];

  torchBeam.color.set(newColor.hex);

  if (glassMesh && isTorchLightOn) {
    glassMesh.material.emissive.set(newColor.hex);
    gsap.fromTo(
      torchBeam,
      { intensity: 35 },
      { intensity: 25, duration: 0.35, ease: "power2.out" },
    );
  }

  console.log("Light Beam Color:", newColor.name, newColor.hex);
});

// Movement speeds associated with each animation state (Units per second)
const ANIMATION_SPEEDS = {
  Idle: 0.0,
  Idle_2: 0.0,
  Idle_Headlow: 0.0,
  Eating: 0.0,
  Walk: 0.35,        // Normal walking pace
  Gallop: 1.1,       // Fast running / sprint
  Gallop_Jump: 1.3,  // Forward leap velocity
  Death: 0.0,
};

// Render loop: GSAP intro lookAt tracking, pointer-aimed torch, click-drag camera orbit, smooth movement
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  animationMixers.forEach((mixer) => mixer.update(delta));

  // Dynamic Locomotion: Move model position along its forward vector based on active animation (Walk/Gallop)
  animalObjects.forEach((animal) => {
    const currentAnim = animal.userData.currentAnimName;
    const speed = ANIMATION_SPEEDS[currentAnim] || 0;

    if (speed > 0) {
      // Calculate forward direction from rotation.y:
      // In Three.js coordinate system: forward step = (sin(rotY) * speed * delta, cos(rotY) * speed * delta)
      const moveX = Math.sin(animal.rotation.y) * speed * delta;
      const moveZ = Math.cos(animal.rotation.y) * speed * delta;

      animal.position.x += moveX;
      animal.position.z += moveZ;

      // Boundary safety: If model moves too far from origin (> 2.3m), steer it back towards the center
      const distanceFromCenter = Math.hypot(animal.position.x, animal.position.z);
      if (distanceFromCenter > 2.3) {
        animal.rotation.y += Math.PI * 0.9 * delta; // Smoothly turn around
      }
    }
  });

  if (torchModel) {
    if (isIntroAnimating) {
      // Keep camera smoothly looking at the torch center during GSAP presentation sequence
      camera.lookAt(
        torchModel.position.x,
        torchModel.position.y + 0.05,
        torchModel.position.z,
      );
    } else {
      // 1. Smoothly rotate torch towards pointer aim (when not actively using transform gizmo)
      if (!isTransforming) {
        torchModel.rotation.y +=
          (targetTorchRotation.y - torchModel.rotation.y) * 0.08;
        torchModel.rotation.x +=
          (targetTorchRotation.x - torchModel.rotation.x) * 0.08;
      }

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
        cameraOrbitDistance *
        Math.sin(cameraOrbitYaw) *
        Math.cos(cameraOrbitPitch);
      const targetCamY =
        torchModel.position.y +
        cameraOrbitDistance * Math.sin(cameraOrbitPitch);
      const targetCamZ =
        torchModel.position.z +
        cameraOrbitDistance *
        Math.cos(cameraOrbitYaw) *
        Math.cos(cameraOrbitPitch);

      camera.position.x += (targetCamX - camera.position.x) * 0.12;
      camera.position.y += (targetCamY - camera.position.y) * 0.12;
      camera.position.z += (targetCamZ - camera.position.z) * 0.12;

      camera.lookAt(
        torchModel.position.x,
        torchModel.position.y + 0.05,
        torchModel.position.z,
      );
    }
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
