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

// Corner directional lights with shadow mapping
function createCornerLight(x, z) {
  const light = new THREE.DirectionalLight(0xffffff, 1.8);
  light.position.set(x, 8, z);
  light.target.position.set(0, 1.5, 0);
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
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

// 4 Corner lights
createCornerLight(12, 12);
createCornerLight(-12, 12);
createCornerLight(-12, -12);
createCornerLight(12, -12);

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
floor.position.y = 0;
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
const backWallGeo = new THREE.PlaneGeometry(roomSize, wallHeight);
const backWall = new THREE.Mesh(backWallGeo, wallMat);
backWall.position.set(0, wallHeight / 2, -roomSize / 2);
backWall.receiveShadow = true;
roomGroup.add(backWall);

// Left wall
const leftWallGeo = new THREE.PlaneGeometry(roomSize, wallHeight);
const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
leftWall.position.set(-roomSize / 2, wallHeight / 2, 0);
leftWall.rotation.y = Math.PI / 2;
leftWall.receiveShadow = true;
roomGroup.add(leftWall);

// Right wall
const rightWallGeo = new THREE.PlaneGeometry(roomSize, wallHeight);
const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
rightWall.position.set(roomSize / 2, wallHeight / 2, 0);
rightWall.rotation.y = -Math.PI / 2;
rightWall.receiveShadow = true;
roomGroup.add(rightWall);

scene.add(roomGroup);

// Showcase objects array
const showcaseObjects = [];

// Helper function to create pedestal and showcase mesh
function createShowcaseItem({
  geometry,
  material,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  accentColor = 0x38bdf8,
}) {
  const itemGroup = new THREE.Group();
  itemGroup.position.set(position.x, position.y, position.z);

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

  // Floating showcase mesh
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 2.1, 0);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.scale.set(scale[0], scale[1], scale[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  mesh.userData = {
    baseY: 2.1,
    baseScale: scale[0],
    accentColor,
  };

  itemGroup.add(mesh);
  scene.add(itemGroup);
  showcaseObjects.push(mesh);

  return mesh;
}

// 1. BoxGeometry + MeshStandardMaterial (Translucent Ruby with Metalness)
createShowcaseItem({
  geometry: new THREE.BoxGeometry(1.4, 1.4, 1.4),
  material: new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    roughness: 0.2,
    metalness: 0.5,
    transparent: true,
    opacity: 0.7,
  }),
  position: { x: -8.5, y: 0, z: -6.5 },
  accentColor: 0xf43f5e,
});

// 2. SphereGeometry + MeshPhysicalMaterial (Refractive Optical Glass & Clearcoat)
createShowcaseItem({
  geometry: new THREE.SphereGeometry(0.9, 48, 48),
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
  position: { x: -4.25, y: 0, z: -6.5 },
  accentColor: 0x38bdf8,
});

// 3. TorusKnotGeometry + MeshPhysicalMaterial (High-Polish Chrome Metallic)
createShowcaseItem({
  geometry: new THREE.TorusKnotGeometry(0.75, 0.25, 90, 16),
  material: new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.98,
    roughness: 0.1,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
  }),
  position: { x: 0, y: 0, z: -6.5 },
  scale: [1.1, 1.1, 1.1],
  accentColor: 0xffffff,
});

// 4. CylinderGeometry + MeshPhongMaterial (Specular Shininess & Transparency)
createShowcaseItem({
  geometry: new THREE.CylinderGeometry(0.7, 0.7, 1.8, 32),
  material: new THREE.MeshPhongMaterial({
    color: 0x10b981,
    shininess: 120,
    specular: 0xffffff,
    transparent: true,
    opacity: 0.8,
  }),
  position: { x: 4.25, y: 0, z: -6.5 },
  accentColor: 0x10b981,
});

// 5. ConeGeometry + MeshLambertMaterial (Matte Diffuse & Flat Shading)
createShowcaseItem({
  geometry: new THREE.ConeGeometry(0.85, 1.9, 32),
  material: new THREE.MeshLambertMaterial({
    color: 0xa855f7,
    flatShading: true,
  }),
  position: { x: 8.5, y: 0, z: -6.5 },
  accentColor: 0xa855f7,
});

// 6. TorusGeometry + MeshToonMaterial (Cel / Cartoon Shading)
createShowcaseItem({
  geometry: new THREE.TorusGeometry(0.75, 0.25, 24, 48),
  material: new THREE.MeshToonMaterial({
    color: 0xec4899,
  }),
  position: { x: -8.5, y: 0, z: -0.5 },
  accentColor: 0xec4899,
});

// 7. DodecahedronGeometry + MeshBasicMaterial (Neon Wireframe)
createShowcaseItem({
  geometry: new THREE.DodecahedronGeometry(0.95),
  material: new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    wireframe: true,
  }),
  position: { x: -4.25, y: 0, z: -0.5 },
  accentColor: 0xfbbf24,
});

// 8. CapsuleGeometry + MeshStandardMaterial (Mirror Gloss Cyan Metal)
createShowcaseItem({
  geometry: new THREE.CapsuleGeometry(0.55, 0.8, 16, 32),
  material: new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    roughness: 0.05,
    metalness: 0.95,
  }),
  position: { x: 4.25, y: 0, z: -0.5 },
  accentColor: 0x06b6d4,
});

// 9. IcosahedronGeometry + MeshPhysicalMaterial (Faceted Polished Gold)
createShowcaseItem({
  geometry: new THREE.IcosahedronGeometry(0.95, 0),
  material: new THREE.MeshPhysicalMaterial({
    color: 0xf59e0b,
    roughness: 0.15,
    metalness: 0.9,
    clearcoat: 0.7,
    flatShading: true,
  }),
  position: { x: 8.5, y: 0, z: -0.5 },
  accentColor: 0xf59e0b,
});

// 10. OctahedronGeometry + MeshStandardMaterial (Translucent Sapphire Crystal)
createShowcaseItem({
  geometry: new THREE.OctahedronGeometry(0.95),
  material: new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    roughness: 0.1,
    metalness: 0.3,
    transparent: true,
    opacity: 0.6,
  }),
  position: { x: -6.5, y: 0, z: 5.5 },
  accentColor: 0x3b82f6,
});

// 11. Custom BufferGeometry: 8-Faceted Diamond Prism (Metallic Solid)
const customBufferGeo = new THREE.BufferGeometry();
const customVertices = new Float32Array([
  0, 1.2, 0, -0.9, 0, 0.9, 0.9, 0, 0.9, 0, 1.2, 0, 0.9, 0, 0.9, 0.9, 0, -0.9, 0,
  1.2, 0, 0.9, 0, -0.9, -0.9, 0, -0.9, 0, 1.2, 0, -0.9, 0, -0.9, -0.9, 0, 0.9,
  0, -1.2, 0, 0.9, 0, 0.9, -0.9, 0, 0.9, 0, -1.2, 0, 0.9, 0, -0.9, 0.9, 0, 0.9,
  0, -1.2, 0, -0.9, 0, -0.9, 0.9, 0, -0.9, 0, -1.2, 0, -0.9, 0, 0.9, -0.9, 0,
  -0.9,
]);

customBufferGeo.setAttribute(
  "position",
  new THREE.BufferAttribute(customVertices, 3),
);
customBufferGeo.computeVertexNormals();

createShowcaseItem({
  geometry: customBufferGeo,
  material: new THREE.MeshStandardMaterial({
    color: 0x8b5cf6,
    roughness: 0.2,
    metalness: 0.85,
  }),
  position: { x: -2.2, y: 0, z: 5.5 },
  accentColor: 0x8b5cf6,
});

// 12. TetrahedronGeometry + MeshPhongMaterial (Translucent Crimson Specular)
createShowcaseItem({
  geometry: new THREE.TetrahedronGeometry(1.05),
  material: new THREE.MeshPhongMaterial({
    color: 0xe11d48,
    shininess: 120,
    specular: 0xffffff,
    transparent: true,
    opacity: 0.75,
  }),
  position: { x: 2.2, y: 0, z: 5.5 },
  accentColor: 0xe11d48,
});

// 13. RingGeometry + MeshBasicMaterial (Translucent Floating Disc)
createShowcaseItem({
  geometry: new THREE.RingGeometry(0.4, 0.95, 32),
  material: new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  }),
  position: { x: 6.5, y: 0, z: 5.5 },
  accentColor: 0x22d3ee,
});

// Clock for animation
const clock = new THREE.Clock();

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  controls.update();

  // Multi-axis rotation and floating transformations
  for (let i = 0; i < showcaseObjects.length; i++) {
    const mesh = showcaseObjects[i];

    mesh.rotation.y += (0.6 + i * 0.08) * delta;
    mesh.rotation.x += (0.3 + i * 0.04) * delta;

    const floatOffset = Math.sin(elapsedTime * 2.0 + i * 0.9) * 0.12;
    mesh.position.y = mesh.userData.baseY + floatOffset;
  }

  renderer.render(scene, camera);
}

// Start loop
animate();

// Resize event
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
