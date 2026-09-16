import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(-30, 20, 0);

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
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.minDistance = 3;
controls.maxDistance = 40;
controls.target.set(0, 0, 0);

// Directional lights with shadow mapping
function createLight(x, y, z, intensity) {
  const light = new THREE.DirectionalLight(0xffffff, intensity);
  light.position.set(x, y, z);
  light.target.position.set(0, 0, 0);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 180;
  light.shadow.camera.left = -40;
  light.shadow.camera.right = 40;
  light.shadow.camera.top = 70;
  light.shadow.camera.bottom = -70;
  light.shadow.bias = -0.0003;
  scene.add(light);
  scene.add(light.target);
  return light;
}

// 4 Corner directional lights around pitch
createLight(35, 30, 60, 1.8);
createLight(-35, 30, 60, 1.8);
createLight(-35, 30, -60, 1.8);
createLight(35, 30, -60, 1.8);

// Texture loader
const textureLoader = new THREE.TextureLoader();

// Load HD football pitch texture image
const pitchTexture = textureLoader.load("/textures/football_pitch_hd.jpg");
pitchTexture.colorSpace = THREE.SRGBColorSpace;
pitchTexture.anisotropy = 16;

// Football ground plane geometry (matching 2:3 aspect ratio)
const groundGeo = new THREE.PlaneGeometry(56, 84, 128, 128);

// Football ground material with HD pitch texture
const groundMat = new THREE.MeshStandardMaterial({
  map: pitchTexture,
  roughness: 0.7,
  metalness: 0.05,
});

// Football ground mesh
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Goal box material using wireframe plane geometry
const goalNetMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  side: THREE.DoubleSide,
});

const goalBorderMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide,
});

function createGoalBox(zPos, isFlipped) {
  const goalGroup = new THREE.Group();
  goalGroup.position.set(0, 0, zPos);
  if (isFlipped) goalGroup.rotation.y = Math.PI;

  const goalWidth = 10;
  const goalHeight = 4.2;
  const goalDepth = 3.5;
  const frameThickness = 0.25;

  // 1. Back net plane
  const backPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(goalWidth, goalHeight, 10, 5),
    goalNetMat,
  );
  backPlane.position.set(0, goalHeight / 2, -goalDepth);
  goalGroup.add(backPlane);

  // 2. Left side net plane
  const leftPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(goalDepth, goalHeight, 5, 5),
    goalNetMat,
  );
  leftPlane.rotation.y = Math.PI / 2;
  leftPlane.position.set(-goalWidth / 2, goalHeight / 2, -goalDepth / 2);
  goalGroup.add(leftPlane);

  // 3. Right side net plane
  const rightPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(goalDepth, goalHeight, 5, 5),
    goalNetMat,
  );
  rightPlane.rotation.y = -Math.PI / 2;
  rightPlane.position.set(goalWidth / 2, goalHeight / 2, -goalDepth / 2);
  goalGroup.add(rightPlane);

  // 4. Top roof net plane
  const topPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(goalWidth, goalDepth, 10, 5),
    goalNetMat,
  );
  topPlane.rotation.x = Math.PI / 2;
  topPlane.position.set(0, goalHeight, -goalDepth / 2);
  goalGroup.add(topPlane);

  // Front frame outline using PlaneGeometry strips
  const crossbar = new THREE.Mesh(
    new THREE.PlaneGeometry(goalWidth + frameThickness, frameThickness),
    goalBorderMat,
  );
  crossbar.position.set(0, goalHeight, 0.01);
  goalGroup.add(crossbar);

  const leftPost = new THREE.Mesh(
    new THREE.PlaneGeometry(frameThickness, goalHeight),
    goalBorderMat,
  );
  leftPost.position.set(-goalWidth / 2, goalHeight / 2, 0.01);
  goalGroup.add(leftPost);

  const rightPost = new THREE.Mesh(
    new THREE.PlaneGeometry(frameThickness, goalHeight),
    goalBorderMat,
  );
  rightPost.position.set(goalWidth / 2, goalHeight / 2, 0.01);
  goalGroup.add(rightPost);

  scene.add(goalGroup);
}

// Create goal boxes aligned with the HD texture's goal lines
const goalLineZ = 37.0;
createGoalBox(-goalLineZ, false);
createGoalBox(goalLineZ, true);

// Load plastic ball PBR textures
const plasticColor = textureLoader.load("/textures/plastic/color.jpg");
const plasticAO = textureLoader.load("/textures/plastic/ao.jpg");
const plasticRoughness = textureLoader.load("/textures/plastic/roughness.jpg");
const plasticNormal = textureLoader.load("/textures/plastic/normal.png");
const plasticHeight = textureLoader.load("/textures/plastic/height.png");
plasticColor.colorSpace = THREE.SRGBColorSpace;

// Ball mesh with plastic material (reduced proportional size)
const ballRadius = 0.9;
const ballGeo = new THREE.SphereGeometry(ballRadius, 64, 64);
const ballMat = new THREE.MeshStandardMaterial({
  map: plasticColor,
  aoMap: plasticAO,
  aoMapIntensity: 1.0,
  roughnessMap: plasticRoughness,
  roughness: 0.3,
  normalMap: plasticNormal,
  displacementMap: plasticHeight,
  displacementScale: 0.02,
  metalness: 0.1,
});
const ballMesh = new THREE.Mesh(ballGeo, ballMat);
ballMesh.position.set(0, ballRadius, 0);
ballMesh.castShadow = true;
ballMesh.receiveShadow = true;
scene.add(ballMesh);

// Raycaster and dragging state
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -ballRadius);
const planeIntersection = new THREE.Vector3();
const dragOffset = new THREE.Vector3();
let isDragging = false;
let isHovered = false;

// Physics bounce variables
let velocityY = 0;
const gravity = -38;
const bounceRestitution = 0.65;
let squashFactor = 1.0;

// Ground boundary limits (56 x 84 plane bounds)
const minX = -26.0;
const maxX = 26.0;
const minZ = -39.0;
const maxZ = 39.0;

// Pointer move event
window.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  if (isDragging) {
    if (raycaster.ray.intersectPlane(dragPlane, planeIntersection)) {
      const targetX = THREE.MathUtils.clamp(
        planeIntersection.x + dragOffset.x,
        minX,
        maxX,
      );
      const targetZ = THREE.MathUtils.clamp(
        planeIntersection.z + dragOffset.z,
        minZ,
        maxZ,
      );

      // Roll ball naturally based on movement
      const deltaX = targetX - ballMesh.position.x;
      const deltaZ = targetZ - ballMesh.position.z;
      ballMesh.rotation.z -= deltaX / ballRadius;
      ballMesh.rotation.x += deltaZ / ballRadius;

      ballMesh.position.x = targetX;
      ballMesh.position.z = targetZ;
    }
  } else {
    const intersects = raycaster.intersectObject(ballMesh);
    if (intersects.length > 0) {
      isHovered = true;
      renderer.domElement.style.cursor = "grab";
    } else {
      isHovered = false;
      renderer.domElement.style.cursor = "default";
    }
  }
});

// Pointer down event to start dragging
window.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObject(ballMesh);

  if (intersects.length > 0) {
    isDragging = true;
    controls.enabled = false;
    renderer.domElement.style.cursor = "grabbing";

    if (raycaster.ray.intersectPlane(dragPlane, planeIntersection)) {
      dragOffset.copy(ballMesh.position).sub(planeIntersection);
    }
  }
});

// Pointer up event to drop and bounce the ball
window.addEventListener("pointerup", () => {
  if (isDragging) {
    isDragging = false;
    controls.enabled = true;
    renderer.domElement.style.cursor = isHovered ? "grab" : "default";

    // Initial drop velocity
    velocityY = 0.5;
  }
});

// Animation clock
const clock = new THREE.Clock();

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  if (isDragging) {
    // Lift ball slightly while holding in air
    const liftedY = ballRadius + 1.6;
    ballMesh.position.y = THREE.MathUtils.lerp(
      ballMesh.position.y,
      liftedY,
      0.2,
    );
  } else {
    // Apply gravity and ground bounce on drop
    if (ballMesh.position.y > ballRadius || Math.abs(velocityY) > 0.1) {
      velocityY += gravity * delta;
      ballMesh.position.y += velocityY * delta;

      if (ballMesh.position.y <= ballRadius) {
        ballMesh.position.y = ballRadius;

        if (Math.abs(velocityY) > 1.2) {
          velocityY = -velocityY * bounceRestitution;
          squashFactor = THREE.MathUtils.clamp(
            1.0 - Math.abs(velocityY) * 0.025,
            0.78,
            1.0,
          );
        } else {
          velocityY = 0;
        }
      }
    } else {
      // Idle slow spin when resting on turf
      ballMesh.rotation.y += 0.003;
    }
  }

  // Smooth squash and stretch restoration
  squashFactor = THREE.MathUtils.lerp(squashFactor, 1.0, 0.18);
  ballMesh.scale.y = squashFactor;
  ballMesh.scale.x = 1.0 + (1.0 - squashFactor) * 0.5;
  ballMesh.scale.z = ballMesh.scale.x;

  controls.update();
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
