import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x38bdf8);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 5, 12);

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
controls.maxDistance = 25;
controls.target.set(0, 3.5, 0);

// Ambient Light (Omnidirectional base ambient brightness)
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

// Main Key Directional Light (Sunlight streaming through glass window)
const mainLight = new THREE.DirectionalLight(0xffffff, 2.6);
mainLight.position.set(6, 14, 20);
mainLight.target.position.set(-1, 2, -1);
mainLight.castShadow = true;
mainLight.shadow.mapSize.set(2048, 2048);
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 50;
mainLight.shadow.camera.left = -16;
mainLight.shadow.camera.right = 16;
mainLight.shadow.camera.top = 16;
mainLight.shadow.camera.bottom = -16;
mainLight.shadow.bias = -0.0001;
mainLight.shadow.normalBias = 0.02;
scene.add(mainLight);
scene.add(mainLight.target);

// Secondary Directional Fill Light (Opposite corner fill)
const fillLight = new THREE.DirectionalLight(0xffffff, 1.4);
fillLight.position.set(-7, 8, 6);
fillLight.target.position.set(0, 2.5, 0);
scene.add(fillLight);
scene.add(fillLight.target);

// Room dimensions and group
const roomWidth = 16;
const roomDepth = 16;
const roomHeight = 9;
const roomGroup = new THREE.Group();

// Texture loader for floor materials
const textureLoader = new THREE.TextureLoader();

// Load flooring PBR texture maps
const floorColor = textureLoader.load("/textures/flooring/color.jpg");
const floorAO = textureLoader.load("/textures/flooring/ao.jpg");
const floorRoughness = textureLoader.load("/textures/flooring/roughness.jpg");
const floorNormal = textureLoader.load("/textures/flooring/normal.png");
const floorDisplacement = textureLoader.load("/textures/flooring/height.png");

// Texture wrapping and repeat configuration
const floorTextures = [
  floorColor,
  floorAO,
  floorRoughness,
  floorNormal,
  floorDisplacement,
];
floorTextures.forEach((texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
});
floorColor.colorSpace = THREE.SRGBColorSpace;

// Floor material using loaded PBR textures
const floorMat = new THREE.MeshStandardMaterial({
  map: floorColor,
  aoMap: floorAO,
  aoMapIntensity: 1.0,
  roughnessMap: floorRoughness,
  roughness: 0.8,
  normalMap: floorNormal,
  displacementMap: floorDisplacement,
  displacementScale: 0.02,
  metalness: 0.1,
});

// Floor plane
const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth, 64, 64);
floorGeo.setAttribute(
  "uv2",
  new THREE.BufferAttribute(floorGeo.attributes.uv.array, 2),
);
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
roomGroup.add(floor);

// Wall material (Sage green studio shade)
const wallMat = new THREE.MeshStandardMaterial({
  color: "#C7D3C0",
  roughness: 0.8,
  metalness: 0.1,
});

// Back wall plane
const backWallGeo = new THREE.PlaneGeometry(roomWidth, roomHeight);
const backWall = new THREE.Mesh(backWallGeo, wallMat);
backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
backWall.receiveShadow = true;
roomGroup.add(backWall);

// Left wall plane
const leftWallGeo = new THREE.PlaneGeometry(roomDepth, roomHeight);
const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
leftWall.rotation.y = Math.PI / 2;
leftWall.receiveShadow = true;
roomGroup.add(leftWall);

// Right wall plane
const rightWallGeo = new THREE.PlaneGeometry(roomDepth, roomHeight);
const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
rightWall.rotation.y = -Math.PI / 2;
rightWall.receiveShadow = true;
roomGroup.add(rightWall);

// Ceiling material (Soft clean white)
const ceilingMat = new THREE.MeshStandardMaterial({
  color: 0xf1f5f9,
  roughness: 0.9,
  metalness: 0.05,
});

// Ceiling plane
const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
ceiling.position.set(0, roomHeight, 0);
ceiling.rotation.x = Math.PI / 2;
ceiling.receiveShadow = true;
roomGroup.add(ceiling);

// Baseboard trims using BoxGeometry
const trimMat = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.5,
  metalness: 0.5,
});

// Back trim
const backTrim = new THREE.Mesh(
  new THREE.BoxGeometry(roomWidth, 0.3, 0.15),
  trimMat,
);
backTrim.position.set(0, 0.15, -roomDepth / 2 + 0.075);
backTrim.receiveShadow = true;
roomGroup.add(backTrim);

// Left trim
const leftTrim = new THREE.Mesh(
  new THREE.BoxGeometry(0.15, 0.3, roomDepth),
  trimMat,
);
leftTrim.position.set(-roomWidth / 2 + 0.075, 0.15, 0);
leftTrim.receiveShadow = true;
roomGroup.add(leftTrim);

// Right trim
const rightTrim = new THREE.Mesh(
  new THREE.BoxGeometry(0.15, 0.3, roomDepth),
  trimMat,
);
rightTrim.position.set(roomWidth / 2 - 0.075, 0.15, 0);
rightTrim.receiveShadow = true;
roomGroup.add(rightTrim);

scene.add(roomGroup);

// Glass wall and sliding doors group on the front side (z = 8)
const glassWallGroup = new THREE.Group();

// Dark aluminum framing material
const metalFrameMat = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.3,
  metalness: 0.8,
});

// Architectural glass material with realistic transparency
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xdbeafe,
  transparent: true,
  opacity: 0.35,
  roughness: 0.05,
  metalness: 0.1,
  transmission: 0.85,
  ior: 1.5,
  depthWrite: false,
});

// Helper for glass frame pieces
function addGlassFramePiece(w, h, d, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), metalFrameMat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  glassWallGroup.add(mesh);
  return mesh;
}

// Outer tracks and perimeter posts
addGlassFramePiece(roomWidth, 0.2, 0.2, 0, 0.1, roomDepth / 2);
addGlassFramePiece(roomWidth, 0.25, 0.2, 0, roomHeight - 0.125, roomDepth / 2);
addGlassFramePiece(
  0.2,
  roomHeight,
  0.2,
  -roomWidth / 2 + 0.1,
  roomHeight / 2,
  roomDepth / 2,
);
addGlassFramePiece(
  0.2,
  roomHeight,
  0.2,
  roomWidth / 2 - 0.1,
  roomHeight / 2,
  roomDepth / 2,
);

// Vertical division mullions (4 grand glass door sections)
addGlassFramePiece(
  0.12,
  roomHeight - 0.45,
  0.18,
  -4.0,
  roomHeight / 2,
  roomDepth / 2,
);
addGlassFramePiece(
  0.16,
  roomHeight - 0.45,
  0.2,
  0,
  roomHeight / 2,
  roomDepth / 2,
);
addGlassFramePiece(
  0.12,
  roomHeight - 0.45,
  0.18,
  4.0,
  roomHeight / 2,
  roomDepth / 2,
);

// Glass panels
function addGlassPanel(w, h, x, z) {
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
  panel.position.set(x, roomHeight / 2, z);
  glassWallGroup.add(panel);
  return panel;
}

addGlassPanel(3.8, roomHeight - 0.45, -5.9, roomDepth / 2);
addGlassPanel(3.8, roomHeight - 0.45, -2.0, roomDepth / 2);
addGlassPanel(3.8, roomHeight - 0.45, 2.0, roomDepth / 2);
addGlassPanel(3.8, roomHeight - 0.45, 5.9, roomDepth / 2);

// Modern vertical door handles on center sliding doors
const handleMat = new THREE.MeshStandardMaterial({
  color: 0xf1f5f9,
  metalness: 0.95,
  roughness: 0.1,
});

const leftHandle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.02, 0.02, 1.4, 16),
  handleMat,
);
leftHandle.position.set(-0.15, 3.6, roomDepth / 2 - 0.08);
leftHandle.castShadow = true;
glassWallGroup.add(leftHandle);

const rightHandle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.02, 0.02, 1.4, 16),
  handleMat,
);
rightHandle.position.set(0.15, 3.6, roomDepth / 2 - 0.08);
rightHandle.castShadow = true;
glassWallGroup.add(rightHandle);

scene.add(glassWallGroup);

// Outside balcony terrace
const deckMat = new THREE.MeshStandardMaterial({
  color: 0x334155,
  roughness: 0.7,
  metalness: 0.2,
});
const deck = new THREE.Mesh(new THREE.PlaneGeometry(24, 20), deckMat);
deck.rotation.x = -Math.PI / 2;
deck.position.set(0, -0.01, roomDepth / 2 + 10);
deck.receiveShadow = true;
scene.add(deck);

// Outdoor Sun group
const sunGroup = new THREE.Group();
const sunCore = new THREE.Mesh(
  new THREE.SphereGeometry(2.0, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xfffbeb }),
);
sunGroup.add(sunCore);

const sunCorona = new THREE.Mesh(
  new THREE.SphereGeometry(3.2, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.35,
  }),
);
sunGroup.add(sunCorona);
sunGroup.position.set(6, 12, 32);
scene.add(sunGroup);

// Outdoor Moon group
const moonGroup = new THREE.Group();
const moonCore = new THREE.Mesh(
  new THREE.SphereGeometry(1.6, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xf8fafc }),
);
moonGroup.add(moonCore);

const moonGlow = new THREE.Mesh(
  new THREE.SphereGeometry(2.5, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.25,
  }),
);
moonGroup.add(moonGlow);
moonGroup.position.set(-6, 11, 32);
moonGroup.visible = false;
scene.add(moonGroup);

// Night sky starfield particles
const starGeo = new THREE.BufferGeometry();
const starCount = 350;
const starPositions = new Float32Array(starCount * 3);
for (let s = 0; s < starCount; s++) {
  starPositions[s * 3] = (Math.random() - 0.5) * 80;
  starPositions[s * 3 + 1] = Math.random() * 30 + 4;
  starPositions[s * 3 + 2] = Math.random() * 30 + 25;
}
starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.2,
  transparent: true,
  opacity: 0.8,
});
const stars = new THREE.Points(starGeo, starMat);
stars.visible = false;
scene.add(stars);

// Load sofa fabric PBR texture maps
const sofaColor = textureLoader.load("/textures/sofa/color.jpg");
const sofaAO = textureLoader.load("/textures/sofa/ao.jpg");
const sofaRoughness = textureLoader.load("/textures/sofa/roughness.jpg");
const sofaNormal = textureLoader.load("/textures/sofa/normal.png");

// Texture wrapping and repeat configuration for sofa fabric
const sofaTextures = [sofaColor, sofaAO, sofaRoughness, sofaNormal];
sofaTextures.forEach((texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
});
sofaColor.colorSpace = THREE.SRGBColorSpace;

// Sofa fabric material with full PBR textures
const sofaMat = new THREE.MeshStandardMaterial({
  map: sofaColor,
  aoMap: sofaAO,
  aoMapIntensity: 1.0,
  roughnessMap: sofaRoughness,
  roughness: 0.9,
  normalMap: sofaNormal,
});

// Create sofa group
const sofa = new THREE.Group();

// 1. Seat mesh
const seatGeo = new THREE.BoxGeometry(4.4, 0.6, 2.0);
seatGeo.setAttribute(
  "uv2",
  new THREE.BufferAttribute(seatGeo.attributes.uv.array, 2),
);
const seat = new THREE.Mesh(seatGeo, sofaMat);
seat.position.set(0, 0.6, 0);
seat.castShadow = true;
seat.receiveShadow = true;

// 2. Back rest mesh
const backGeo = new THREE.BoxGeometry(4.4, 1.4, 0.5);
backGeo.setAttribute(
  "uv2",
  new THREE.BufferAttribute(backGeo.attributes.uv.array, 2),
);
const back = new THREE.Mesh(backGeo, sofaMat);
back.position.set(0, 1.4, -0.75);
back.castShadow = true;
back.receiveShadow = true;

// 3. Left armrest mesh
const leftArmGeo = new THREE.BoxGeometry(0.55, 1.1, 2.2);
leftArmGeo.setAttribute(
  "uv2",
  new THREE.BufferAttribute(leftArmGeo.attributes.uv.array, 2),
);
const leftArm = new THREE.Mesh(leftArmGeo, sofaMat);
leftArm.position.set(-2.475, 0.85, 0.1);
leftArm.castShadow = true;
leftArm.receiveShadow = true;

// 4. Right armrest mesh
const rightArmGeo = new THREE.BoxGeometry(0.55, 1.1, 2.2);
rightArmGeo.setAttribute(
  "uv2",
  new THREE.BufferAttribute(rightArmGeo.attributes.uv.array, 2),
);
const rightArm = new THREE.Mesh(rightArmGeo, sofaMat);
rightArm.position.set(2.475, 0.85, 0.1);
rightArm.castShadow = true;
rightArm.receiveShadow = true;

// Add individual meshes to sofa group
sofa.add(seat);
sofa.add(back);
sofa.add(leftArm);
sofa.add(rightArm);

// Position and rotate sofa along the left wall facing into the room
sofa.position.set(-5.0, -0.3, 0);
sofa.rotation.y = Math.PI / 2;

// Add sofa to scene
scene.add(sofa);

// Define roughness property accessor directly on sofa group
Object.defineProperty(sofa, "roughness", {
  get() {
    return sofaMat.roughness;
  },
  set(value) {
    sofaMat.roughness = value;
  },
});

// Table materials
const tableTopMat = new THREE.MeshStandardMaterial({
  color: 0x334155,
  roughness: 0.25,
  metalness: 0.3,
});

const tableLegMat = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.4,
  metalness: 0.8,
});

// Create table group
const table = new THREE.Group();

// Tabletop
const tableTopGeo = new THREE.BoxGeometry(3.6, 0.15, 2.2);
const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
tableTop.position.set(0, 0.9, 0);
tableTop.castShadow = true;
tableTop.receiveShadow = true;
table.add(tableTop);

// Helper for table legs
function createTableLeg(x, z) {
  const legGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.9, 16);
  const leg = new THREE.Mesh(legGeo, tableLegMat);
  leg.position.set(x, 0.45, z);
  leg.castShadow = true;
  leg.receiveShadow = true;
  table.add(leg);
}

// 4 Table legs
createTableLeg(-1.6, -0.9);
createTableLeg(1.6, -0.9);
createTableLeg(-1.6, 0.9);
createTableLeg(1.6, 0.9);

// Position and rotate table in front of sofa along the left wall
table.position.set(-1.0, 0, 0);
table.rotation.y = Math.PI / 2;
scene.add(table);

// Lamp materials
const lampMetalMat = new THREE.MeshStandardMaterial({
  color: 0xf59e0b,
  metalness: 0.9,
  roughness: 0.15,
});

const lampShadeMat = new THREE.MeshStandardMaterial({
  color: 0xffedd5,
  roughness: 0.6,
  metalness: 0.05,
  side: THREE.DoubleSide,
});

const bulbMat = new THREE.MeshBasicMaterial({
  color: 0xfffbeb,
});

// Create lamp group
const lamp = new THREE.Group();

// 1. Lamp base
const lampBaseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.08, 32);
const lampBase = new THREE.Mesh(lampBaseGeo, lampMetalMat);
lampBase.position.set(0, 0.04, 0);
lampBase.castShadow = true;
lampBase.receiveShadow = true;
lamp.add(lampBase);

// 2. Lamp stem
const lampStemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.9, 16);
const lampStem = new THREE.Mesh(lampStemGeo, lampMetalMat);
lampStem.position.set(0, 0.5, 0);
lampStem.castShadow = true;
lampStem.receiveShadow = true;
lamp.add(lampStem);

// 3. Lamp shade
const lampShadeGeo = new THREE.CylinderGeometry(0.2, 0.4, 0.5);
const lampShade = new THREE.Mesh(lampShadeGeo, lampShadeMat);
lampShade.position.set(0, 1.05, 0);
lampShade.castShadow = true;
lampShade.receiveShadow = true;
lamp.add(lampShade);

// 4. Glowing bulb
const bulbGeo = new THREE.SphereGeometry(0.12, 16, 16);
const bulb = new THREE.Mesh(bulbGeo, bulbMat);
bulb.position.set(0, 0.95, 0);
lamp.add(bulb);

// 5. Warm lamp point light with shadows
const lampLight = new THREE.PointLight(0xffedd5, 1.8, 8);
lampLight.position.set(0, 0.95, 0);
lampLight.castShadow = true;
lampLight.shadow.mapSize.set(512, 512);
lampLight.shadow.bias = -0.001;
lamp.add(lampLight);

// Position lamp on top of the table
lamp.position.set(1.1, 0.98, 0.3);
table.add(lamp);

// Load TV screen artwork texture
const tvTexture = textureLoader.load("/textures/tv_screen.jpg");
tvTexture.colorSpace = THREE.SRGBColorSpace;
tvTexture.wrapS = THREE.RepeatWrapping;
tvTexture.wrapT = THREE.RepeatWrapping;

// TV setup
const tvGroup = new THREE.Group();

// 1. TV outer frame / bezel (no shadow casting to floor)
const tvFrameMat = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.3,
  metalness: 0.8,
});
const tvFrameGeo = new THREE.BoxGeometry(6.4, 3.8, 0.12);
const tvFrame = new THREE.Mesh(tvFrameGeo, tvFrameMat);
tvFrame.castShadow = false;
tvFrame.receiveShadow = true;
tvGroup.add(tvFrame);

// 2. TV OLED screen display
const tvScreenMat = new THREE.MeshStandardMaterial({
  color: 0x070c18,
  roughness: 0.1,
  metalness: 0.9,
  emissive: new THREE.Color(0x000000),
  emissiveIntensity: 0,
});
const tvScreenGeo = new THREE.PlaneGeometry(6.15, 3.55);
const tvScreen = new THREE.Mesh(tvScreenGeo, tvScreenMat);
tvScreen.position.z = 0.065;
tvGroup.add(tvScreen);

// 3. TV wall mount bracket
const tvMountMat = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  roughness: 0.6,
  metalness: 0.5,
});
const tvMountGeo = new THREE.BoxGeometry(1.8, 1.2, 0.1);
const tvMount = new THREE.Mesh(tvMountGeo, tvMountMat);
tvMount.position.z = -0.1;
tvGroup.add(tvMount);

// 4. TV media console unit (no shadow casting to floor)
const mediaUnitMat = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  roughness: 0.35,
  metalness: 0.2,
});
const mediaUnitGeo = new THREE.BoxGeometry(7.6, 0.7, 1.2);
const mediaUnit = new THREE.Mesh(mediaUnitGeo, mediaUnitMat);
mediaUnit.position.set(0, -2.4, 0.55);
mediaUnit.castShadow = false;
mediaUnit.receiveShadow = true;
tvGroup.add(mediaUnit);

// 5. TV ambient glow point light
const tvGlowLight = new THREE.PointLight(0x60a5fa, 0, 8);
tvGlowLight.position.set(0, 0, 1.0);
tvGroup.add(tvGlowLight);

// Position and rotate TV unit on the right wall facing the sofa
tvGroup.position.set(7.85, 4.2, 0);
tvGroup.rotation.y = -Math.PI / 2;
scene.add(tvGroup);

// Wooden furniture display unit on the back wall
const bookcaseGroup = new THREE.Group();

// 1. Warm natural oak wood material
const woodMat = new THREE.MeshStandardMaterial({
  color: 0x854d0e,
  roughness: 0.6,
  metalness: 0.05,
});

const woodBackMat = new THREE.MeshStandardMaterial({
  color: 0x713f12,
  roughness: 0.7,
  metalness: 0.05,
});

const brassHandleMat = new THREE.MeshStandardMaterial({
  color: 0xf59e0b,
  metalness: 0.9,
  roughness: 0.2,
});

// Helper for wooden parts
function addWoodBox(w, h, d, x, y, z) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, woodMat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  bookcaseGroup.add(mesh);
  return mesh;
}

// Backing panel
const backPanel = new THREE.Mesh(
  new THREE.BoxGeometry(8.0, 5.6, 0.05),
  woodBackMat,
);
backPanel.position.set(0, 2.8, -0.4);
backPanel.receiveShadow = true;
bookcaseGroup.add(backPanel);

// Outer frame and vertical dividers
addWoodBox(0.12, 5.6, 0.85, -3.94, 2.8, 0);
addWoodBox(0.12, 5.6, 0.85, 3.94, 2.8, 0);
addWoodBox(0.12, 5.6, 0.85, 0, 2.8, 0);
addWoodBox(8.0, 0.12, 0.85, 0, 0.06, 0);
addWoodBox(8.0, 0.12, 0.85, 0, 5.54, 0);

// Cabinet counter level divider
addWoodBox(8.0, 0.12, 0.85, 0, 1.6, 0);

// Horizontal shelf tiers
addWoodBox(8.0, 0.08, 0.82, 0, 2.9, 0);
addWoodBox(8.0, 0.08, 0.82, 0, 4.2, 0);

// Lower cabinet doors
const doorMat = new THREE.MeshStandardMaterial({
  color: 0x92400e,
  roughness: 0.5,
  metalness: 0.05,
});

function addCabinetDoor(x, handleSide) {
  const doorGeo = new THREE.BoxGeometry(1.9, 1.4, 0.05);
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(x, 0.85, 0.42);
  door.castShadow = true;
  door.receiveShadow = true;
  bookcaseGroup.add(door);

  const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 12);
  const handle = new THREE.Mesh(handleGeo, brassHandleMat);
  handle.position.set(x + handleSide * 0.7, 0.85, 0.47);
  handle.castShadow = true;
  bookcaseGroup.add(handle);
}

addCabinetDoor(-2.95, 1);
addCabinetDoor(-0.98, -1);
addCabinetDoor(0.98, 1);
addCabinetDoor(2.95, -1);

// Helper for book sets
function addBookRow(startX, y, count, colors) {
  let currX = startX;
  for (let i = 0; i < count; i++) {
    const bw = 0.08 + Math.random() * 0.04;
    const bh = 0.75 + Math.random() * 0.35;
    const bd = 0.55;
    const bMat = new THREE.MeshStandardMaterial({
      color: colors[i % colors.length],
      roughness: 0.4,
    });
    const book = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), bMat);
    book.position.set(currX + bw / 2, y + bh / 2, 0.05);
    book.castShadow = true;
    book.receiveShadow = true;
    bookcaseGroup.add(book);
    currX += bw + 0.015;
  }
}

// Add books to shelves
const bookColors1 = [0x1e3a8a, 0x881337, 0xd97706, 0x0f172a, 0x15803d];
const bookColors2 = [0x701a75, 0x0369a1, 0xb45309, 0x1f2937, 0x475569];
addBookRow(-3.7, 1.66, 12, bookColors1);
addBookRow(0.2, 2.96, 10, bookColors2);
addBookRow(-3.7, 4.26, 8, bookColors2);

// Decorative Sculptures & Vases
// 1. Sleek ceramic vase
const vaseMat = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  roughness: 0.15,
  metalness: 0.1,
});
const vase = new THREE.Mesh(
  new THREE.CylinderGeometry(0.14, 0.22, 0.7, 24),
  vaseMat,
);
vase.position.set(-1.2, 4.61, 0.05);
vase.castShadow = true;
vase.receiveShadow = true;
bookcaseGroup.add(vase);

// 2. Gold Torus sculpture
const torusGeo = new THREE.TorusGeometry(0.25, 0.06, 16, 32);
const torusMesh = new THREE.Mesh(torusGeo, brassHandleMat);
torusMesh.position.set(2.2, 4.6, 0.05);
torusMesh.rotation.y = 0.4;
torusMesh.castShadow = true;
torusMesh.receiveShadow = true;
bookcaseGroup.add(torusMesh);

// 3. Small potted shelf succulent
const potMat = new THREE.MeshStandardMaterial({
  color: 0xe2e8f0,
  roughness: 0.3,
});
const pot = new THREE.Mesh(
  new THREE.CylinderGeometry(0.18, 0.14, 0.3, 16),
  potMat,
);
pot.position.set(3.0, 3.11, 0.05);
pot.castShadow = true;
pot.receiveShadow = true;
bookcaseGroup.add(pot);

const plantMat = new THREE.MeshStandardMaterial({
  color: 0x16a34a,
  roughness: 0.6,
});
for (let p = 0; p < 6; p++) {
  const angle = (p / 6) * Math.PI * 2;
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 6), plantMat);
  leaf.position.set(
    3.0 + Math.cos(angle) * 0.08,
    3.32,
    0.05 + Math.sin(angle) * 0.08,
  );
  leaf.rotation.z = Math.cos(angle) * 0.45;
  leaf.rotation.x = Math.sin(angle) * 0.45;
  leaf.castShadow = true;
  bookcaseGroup.add(leaf);
}

// 4. Glowing Cyan Crystal Showpiece with Gyro Ring (Middle-Left Shelf)
const cyanCrystalGroup = new THREE.Group();
cyanCrystalGroup.position.set(-2.0, 3.55, 0.05);

const pedestalMat = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.3,
  metalness: 0.8,
});
const cyanPedestal = new THREE.Mesh(
  new THREE.CylinderGeometry(0.16, 0.2, 0.12, 16),
  pedestalMat,
);
cyanPedestal.position.y = -0.55;
cyanCrystalGroup.add(cyanPedestal);

const cyanCoreMat = new THREE.MeshStandardMaterial({
  color: 0x06b6d4,
  emissive: new THREE.Color(0x06b6d4),
  emissiveIntensity: 1.8,
  roughness: 0.1,
  metalness: 0.9,
});
const cyanCrystalMesh = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.24, 0),
  cyanCoreMat,
);
cyanCrystalGroup.add(cyanCrystalMesh);

const cyanRingMat = new THREE.MeshStandardMaterial({
  color: 0x22d3ee,
  emissive: new THREE.Color(0x22d3ee),
  emissiveIntensity: 1.2,
  roughness: 0.2,
});
const cyanGyroRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.38, 0.02, 16, 32),
  cyanRingMat,
);
cyanGyroRing.rotation.x = Math.PI / 4;
cyanCrystalGroup.add(cyanGyroRing);

const cyanLight = new THREE.PointLight(0x06b6d4, 0.9, 2.5);
cyanLight.position.set(0, 0, 0);
cyanCrystalGroup.add(cyanLight);

bookcaseGroup.add(cyanCrystalGroup);

// 5. Glowing Magenta Plasma Orb with Geometric Cage (Bottom-Right Shelf)
const magentaOrbGroup = new THREE.Group();
magentaOrbGroup.position.set(2.0, 2.28, 0.05);

const magentaPedestal = new THREE.Mesh(
  new THREE.CylinderGeometry(0.15, 0.18, 0.14, 16),
  brassHandleMat,
);
magentaPedestal.position.y = -0.52;
magentaOrbGroup.add(magentaPedestal);

const magentaCoreMat = new THREE.MeshStandardMaterial({
  color: 0xf43f5e,
  emissive: new THREE.Color(0xf43f5e),
  emissiveIntensity: 2.0,
  roughness: 0.1,
  metalness: 0.8,
});
const magentaOrbMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.25, 32, 32),
  magentaCoreMat,
);
magentaOrbGroup.add(magentaOrbMesh);

const magentaCageMat = new THREE.MeshBasicMaterial({
  color: 0xfb7185,
  wireframe: true,
  transparent: true,
  opacity: 0.65,
});
const magentaCage = new THREE.Mesh(
  new THREE.DodecahedronGeometry(0.38, 0),
  magentaCageMat,
);
magentaOrbGroup.add(magentaCage);

const magentaLight = new THREE.PointLight(0xf43f5e, 0.9, 2.5);
magentaLight.position.set(0, 0, 0);
magentaOrbGroup.add(magentaLight);

bookcaseGroup.add(magentaOrbGroup);

// 6. Glowing Emerald Octahedron Prism (Bottom-Left Shelf)
const emeraldPrismGroup = new THREE.Group();
emeraldPrismGroup.position.set(-1.0, 2.25, 0.05);

const emeraldPedestal = new THREE.Mesh(
  new THREE.CylinderGeometry(0.14, 0.16, 0.1, 16),
  pedestalMat,
);
emeraldPedestal.position.y = -0.48;
emeraldPrismGroup.add(emeraldPedestal);

const emeraldCoreMat = new THREE.MeshStandardMaterial({
  color: 0x10b981,
  emissive: new THREE.Color(0x10b981),
  emissiveIntensity: 1.7,
  roughness: 0.15,
  metalness: 0.85,
});
const emeraldPrismMesh = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.24, 0),
  emeraldCoreMat,
);
emeraldPrismGroup.add(emeraldPrismMesh);

const emeraldLight = new THREE.PointLight(0x10b981, 0.7, 2.2);
emeraldLight.position.set(0, 0, 0);
emeraldPrismGroup.add(emeraldLight);

bookcaseGroup.add(emeraldPrismGroup);

// Position bookcase unit along the back wall
bookcaseGroup.position.set(0, 0, -7.55);
scene.add(bookcaseGroup);

// Switchboard on the right wall
const switchboardGroup = new THREE.Group();

// 1. Switchboard faceplate
const plateMat = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  roughness: 0.35,
  metalness: 0.1,
});
const plateGeo = new THREE.BoxGeometry(0.9, 1.4, 0.06);
const plate = new THREE.Mesh(plateGeo, plateMat);
plate.receiveShadow = true;
switchboardGroup.add(plate);

// 2. TV Switch button & LED indicator
const tvBtnMat = new THREE.MeshStandardMaterial({
  color: 0x334155,
  roughness: 0.4,
});
const tvBtnGeo = new THREE.BoxGeometry(0.55, 0.35, 0.05);
const tvBtn = new THREE.Mesh(tvBtnGeo, tvBtnMat);
tvBtn.position.set(0, 0.3, 0.04);
switchboardGroup.add(tvBtn);

const tvLedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
const tvLedGeo = new THREE.SphereGeometry(0.04, 16, 16);
const tvLed = new THREE.Mesh(tvLedGeo, tvLedMat);
tvLed.position.set(0.18, 0.3, 0.07);
switchboardGroup.add(tvLed);

// 3. Room Lights Switch button & LED indicator
const lightBtnMat = new THREE.MeshStandardMaterial({
  color: 0x334155,
  roughness: 0.4,
});
const lightBtnGeo = new THREE.BoxGeometry(0.55, 0.35, 0.05);
const lightBtn = new THREE.Mesh(lightBtnGeo, lightBtnMat);
lightBtn.position.set(0, -0.3, 0.04);
switchboardGroup.add(lightBtn);

const lightLedMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
const lightLedGeo = new THREE.SphereGeometry(0.04, 16, 16);
const lightLed = new THREE.Mesh(lightLedGeo, lightLedMat);
lightLed.position.set(0.18, -0.3, 0.07);
switchboardGroup.add(lightLed);

// Position and rotate switchboard on the right wall
switchboardGroup.position.set(7.94, 3.6, 4.8);
switchboardGroup.rotation.y = -Math.PI / 2;
scene.add(switchboardGroup);

// Interactive state variables
let isLampOn = true;
let isTvOn = false;
let isRoomLightOn = true;

// Lamp toggle handler
function toggleLamp() {
  isLampOn = !isLampOn;
  lampLight.intensity = isLampOn ? 1.8 : 0;
  bulbMat.color.set(isLampOn ? 0xfffbeb : 0x222222);
}

// TV toggle handler
function toggleTv() {
  isTvOn = !isTvOn;
  if (isTvOn) {
    tvScreenMat.map = tvTexture;
    tvScreenMat.emissiveMap = tvTexture;
    tvScreenMat.emissive.set(0xffffff);
    tvScreenMat.emissiveIntensity = 0.95;
    tvScreenMat.color.set(0xffffff);
    tvGlowLight.intensity = 1.2;
    tvLedMat.color.set(0x22c55e);
    tvBtn.rotation.x = 0.08;
  } else {
    tvScreenMat.map = null;
    tvScreenMat.emissiveMap = null;
    tvScreenMat.emissive.set(0x000000);
    tvScreenMat.emissiveIntensity = 0;
    tvScreenMat.color.set(0x070c18);
    tvGlowLight.intensity = 0;
    tvLedMat.color.set(0xef4444);
    tvBtn.rotation.x = -0.08;
  }
  tvScreenMat.needsUpdate = true;
}

// Day and Night mode toggle handler (exclusively via D key)
let isDayTime = true;
function toggleDayNight() {
  isDayTime = !isDayTime;
  if (isDayTime) {
    scene.background.set(0x38bdf8);
    sunGroup.visible = true;
    moonGroup.visible = false;
    stars.visible = false;
    mainLight.position.set(6, 14, 20);
    mainLight.color.set(0xffffff);
    mainLight.intensity = 2.6;
  } else {
    scene.background.set(0x070a13);
    sunGroup.visible = false;
    moonGroup.visible = true;
    stars.visible = true;
    mainLight.position.set(-6, 13, 20);
    mainLight.color.set(0x93c5fd);
    mainLight.intensity = 0.4;
  }
}

// Room light toggle handler (controlled by switchboard switch)
function toggleRoomLights() {
  isRoomLightOn = !isRoomLightOn;
  ambientLight.intensity = isRoomLightOn ? 1.2 : 0.12;
  fillLight.intensity = isRoomLightOn ? 1.4 : 0;
  lightLedMat.color.set(isRoomLightOn ? 0x22c55e : 0xef4444);
  lightBtn.rotation.x = isRoomLightOn ? 0.08 : -0.08;
}

// Keyboard shortcut for Day/Night toggle via "D" or "d" key
window.addEventListener("keydown", (event) => {
  if (event.key === "d" || event.key === "D") {
    toggleDayNight();
  }
});

// Raycaster setup for user click and hover interactions
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let pointerDownPos = { x: 0, y: 0 };

// Pointer down to detect drag vs click
window.addEventListener("pointerdown", (event) => {
  pointerDownPos = { x: event.clientX, y: event.clientY };
});

// Pointer up click handler
window.addEventListener("pointerup", (event) => {
  const diffX = Math.abs(event.clientX - pointerDownPos.x);
  const diffY = Math.abs(event.clientY - pointerDownPos.y);
  if (diffX > 5 || diffY > 5) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Check Lamp click
  const lampIntersects = raycaster.intersectObjects(lamp.children, true);
  if (lampIntersects.length > 0) {
    toggleLamp();
    return;
  }

  // Check TV click or TV Switch click
  const tvIntersects = raycaster.intersectObjects(
    [...tvGroup.children, tvBtn, tvLed],
    true,
  );
  if (tvIntersects.length > 0) {
    toggleTv();
    return;
  }

  // Check Room Light Switch click on switchboard
  const lightSwitchIntersects = raycaster.intersectObjects(
    [lightBtn, lightLed, plate],
    true,
  );
  if (lightSwitchIntersects.length > 0) {
    toggleRoomLights();
    return;
  }
});

// Pointer move hover effect
window.addEventListener("pointermove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const interactiveObjects = [
    ...lamp.children,
    ...tvGroup.children,
    ...switchboardGroup.children,
  ];
  const intersects = raycaster.intersectObjects(interactiveObjects, true);

  if (intersects.length > 0) {
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "default";
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Animate TV screen texture offset.x when TV is turned ON
  if (isTvOn && tvTexture) {
    tvTexture.offset.x += 0.0015;
  }

  // Animate glowing showpieces on the bookcase
  cyanCrystalMesh.rotation.y += 0.012;
  cyanCrystalMesh.rotation.x += 0.006;
  cyanGyroRing.rotation.z += 0.015;

  magentaOrbMesh.rotation.y += 0.008;
  magentaCage.rotation.y -= 0.012;
  magentaCage.rotation.x += 0.008;

  emeraldPrismMesh.rotation.y += 0.015;
  emeraldPrismMesh.rotation.z += 0.008;

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
