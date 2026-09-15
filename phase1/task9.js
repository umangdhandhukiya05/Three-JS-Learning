import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f1d);
scene.fog = new THREE.FogExp2(0x0a0f1d, 0.012);

// Perspective camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 14, 22);

// WebGL renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.target.set(0, 1, 0);

// Ambient and hemisphere fill lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const hemisphereLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 1.1);
scene.add(hemisphereLight);

// Four corner stadium directional lights
function createCornerLight(x, z) {
  const dirLight = new THREE.DirectionalLight(0xfffaed, 2.2);
  dirLight.position.set(x, 16, z);
  dirLight.target.position.set(0, 1, 0);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.camera.left = -18;
  dirLight.shadow.camera.right = 18;
  dirLight.shadow.camera.top = 18;
  dirLight.shadow.camera.bottom = -18;
  dirLight.shadow.bias = -0.0003;
  dirLight.shadow.radius = 2;
  scene.add(dirLight);
  scene.add(dirLight.target);
}

const cornerDist = 16;
createCornerLight(-cornerDist, -cornerDist);
createCornerLight(cornerDist, -cornerDist);
createCornerLight(-cornerDist, cornerDist);
createCornerLight(cornerDist, cornerDist);

// Ground plane
const groundGeo = new THREE.PlaneGeometry(35, 35);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5, metalness: 0.2 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Subtle grid helper for spatial coordinate reference
const grid = new THREE.GridHelper(30, 30, 0x38bdf8, 0x1e293b);
grid.position.y = 0.01;
scene.add(grid);

// Quadrant floor labels function
function createQuadrantLabel(text, subText, x, z, color = "#38bdf8") {
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 140;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
  ctx.roundRect(8, 8, 284, 124, 16);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = "bold 42px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 150, 50);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "24px monospace";
  ctx.fillText(subText, 150, 95);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 1.7),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(x, 0.03, z);
  scene.add(plane);
}

// Four quadrant labels
createQuadrantLabel("[+ , +]", "(+X, +Z)", 8.5, 8.5, "#38bdf8");
createQuadrantLabel("[- , +]", "(-X, +Z)", -8.5, 8.5, "#f43f5e");
createQuadrantLabel("[- , -]", "(-X, -Z)", -8.5, -8.5, "#a855f7");
createQuadrantLabel("[+ , -]", "(+X, -Z)", 8.5, -8.5, "#10b981");

// Target Object B (Beacon / Waypoint sphere initially at Center floating at height)
const target = new THREE.Mesh(
  new THREE.SphereGeometry(0.55, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.8, emissive: 0x7f1d1d, emissiveIntensity: 0.6 })
);
target.position.set(0, 2.5, 0);
target.castShadow = true;
scene.add(target);

// Target base ring indicator on ground
const targetRing = new THREE.Mesh(
  new THREE.RingGeometry(0.8, 1.0, 32),
  new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
);
targetRing.rotation.x = -Math.PI / 2;
targetRing.position.set(0, 0.02, 0);
scene.add(targetRing);

// Vertical altitude drop-line connecting Target (B) to ground
const dropLineGeo = new THREE.BufferGeometry().setFromPoints([target.position, new THREE.Vector3(0, 0, 0)]);
const dropLineMat = new THREE.LineDashedMaterial({ color: 0xef4444, dashSize: 0.3, gapSize: 0.15, transparent: true, opacity: 0.4 });
const dropLine = new THREE.Line(dropLineGeo, dropLineMat);
dropLine.computeLineDistances();
scene.add(dropLine);

// Seeker Object A (Arrowhead / Craft with cone pointing towards target)
const seeker = new THREE.Group();
seeker.position.set(-8.5, 1.5, 8.5);

// Seeker main cockpit body
const bodyMesh = new THREE.Mesh(
  new THREE.ConeGeometry(0.65, 1.8, 32),
  new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2, metalness: 0.85 })
);
bodyMesh.rotation.x = Math.PI / 2;
bodyMesh.castShadow = true;
seeker.add(bodyMesh);

// Seeker rear thruster core
const thruster = new THREE.Mesh(
  new THREE.CylinderGeometry(0.28, 0.38, 0.4, 16),
  new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, metalness: 0.9, emissive: 0x2563eb, emissiveIntensity: 0.8 })
);
thruster.rotation.x = Math.PI / 2;
thruster.position.z = -1.0;
seeker.add(thruster);

// Seeker wings
const wingGeo = new THREE.BoxGeometry(2.2, 0.08, 0.6);
const wingMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.8 });
const wing = new THREE.Mesh(wingGeo, wingMat);
wing.position.z = -0.3;
wing.castShadow = true;
seeker.add(wing);

scene.add(seeker);

// Direction vector line connecting Object A to Object B
const lineGeo = new THREE.BufferGeometry().setFromPoints([seeker.position, target.position]);
const lineMat = new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 0.4, gapSize: 0.2, transparent: true, opacity: 0.6 });
const vectorLine = new THREE.Line(lineGeo, lineMat);
vectorLine.computeLineDistances();
scene.add(vectorLine);

// Clock for delta time
const clock = new THREE.Clock();

// Target 3D waypoint patrol path with varied X, Y (Altitude), and Z coordinates
const waypoints = [
  new THREE.Vector3(0, 2.5, 0),       // Center (Mid altitude: Y = 2.5)
  new THREE.Vector3(8.5, 7.5, 8.5),   // [+ , +] (High altitude: Y = 7.5)
  new THREE.Vector3(-8.5, 2.0, 8.5),  // [- , +] (Low altitude:  Y = 2.0)
  new THREE.Vector3(-8.5, 8.5, -8.5), // [- , -] (High altitude: Y = 8.5)
  new THREE.Vector3(8.5, 1.8, -8.5),  // [+ , -] (Low altitude:  Y = 1.8)
];
let currentWaypointIndex = 0;
let isAutoPatrol = true;

// Render and animation loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // 3D Vector3 Math: Calculate 3D direction and Euclidean distance (X, Y, Z)
  const direction = new THREE.Vector3().subVectors(target.position, seeker.position);
  const distance = direction.length();

  // Auto patrol to next 3D waypoint when reaching current target
  if (distance < 0.6 && isAutoPatrol) {
    currentWaypointIndex = (currentWaypointIndex + 1) % waypoints.length;
    target.position.copy(waypoints[currentWaypointIndex]);
    targetRing.position.set(target.position.x, 0.02, target.position.z);
  }

  // Normalize 3D direction vector
  if (distance > 0.05) {
    direction.normalize();

    // Smooth movement across X, Y, and Z axes
    const speed = 4.5;
    seeker.position.addScaledVector(direction, speed * delta);

    // Euler Rotation: Orient seeker in 3D (pitch, yaw, roll) toward target
    seeker.lookAt(target.position);
  }

  // Update 3D connecting direction vector line
  vectorLine.geometry.setFromPoints([seeker.position, target.position]);
  vectorLine.computeLineDistances();

  // Update vertical altitude drop-line to floor
  dropLine.geometry.setFromPoints([target.position, new THREE.Vector3(target.position.x, 0, target.position.z)]);
  dropLine.computeLineDistances();

  // Animate target indicator pulse
  const ringScale = 1.0 + Math.sin(elapsedTime * 4.0) * 0.15;
  targetRing.scale.set(ringScale, ringScale, 1.0);

  // Render scene
  renderer.render(scene, camera);
}

// Start loop
animate();

// Window resize handling
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
