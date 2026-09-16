import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f1d);
scene.fog = new THREE.FogExp2(0x0a0f1d, 0.012);

// Perspective camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 8, 18);

// WebGL renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.target.set(0, 1.5, 0);

// Ambient and hemisphere fill lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const hemisphereLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 1.1);
scene.add(hemisphereLight);

// Four corner stadium directional lights
function createCornerLight(x, z) {
  const dirLight = new THREE.DirectionalLight(0xfffaed, 2.0);
  dirLight.position.set(x, 16, z);
  dirLight.target.position.set(0, 1.5, 0);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.camera.left = -16;
  dirLight.shadow.camera.right = 16;
  dirLight.shadow.camera.top = 16;
  dirLight.shadow.camera.bottom = -16;
  dirLight.shadow.bias = -0.0003;
  dirLight.shadow.radius = 2;
  scene.add(dirLight);
  scene.add(dirLight.target);
}

const cornerDist = 15;
createCornerLight(-cornerDist, -cornerDist);
createCornerLight(cornerDist, -cornerDist);
createCornerLight(-cornerDist, cornerDist);
createCornerLight(cornerDist, cornerDist);

// Ground plane
const groundGeo = new THREE.PlaneGeometry(32, 32);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x111827,
  roughness: 0.5,
  metalness: 0.2,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Floor reference grid
const grid = new THREE.GridHelper(30, 30, 0x38bdf8, 0x1e293b);
grid.position.y = 0.01;
scene.add(grid);

// 1. AxesHelper: Shows 3D coordinate system (Red = +X, Green = +Y, Blue = +Z)
const axesHelper = new THREE.AxesHelper(6);
axesHelper.position.y = 0.02;
axesHelper.visible = window.innerWidth >= 768;
scene.add(axesHelper);

// 2. ArrowHelper: Visualizes the camera direction / normal vector of the drag plane
const arrowHelper = new THREE.ArrowHelper(
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, 0, 0),
  3.0,
  0xf43f5e,
  0.6,
  0.35,
);
arrowHelper.visible = false;
scene.add(arrowHelper);

// 3. Visual Drag Plane Mesh: Renders the actual 3D drag plane in the scene
const dragPlaneGeo = new THREE.PlaneGeometry(24, 24, 12, 12);
const dragPlaneMat = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,
  transparent: true,
  opacity: 0.12,
  side: THREE.DoubleSide,
  depthWrite: false,
});
const visualDragPlane = new THREE.Mesh(dragPlaneGeo, dragPlaneMat);
const visualDragPlaneWire = new THREE.LineSegments(
  new THREE.WireframeGeometry(dragPlaneGeo),
  new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
  }),
);
visualDragPlane.add(visualDragPlaneWire);
visualDragPlane.visible = false;
scene.add(visualDragPlane);

// Interactive objects list
const interactiveObjects = [];

// Helper function to create interactive pedestal and shape
function createInteractiveItem(geometry, color, x, z, name, type, description) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const baseGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.3, 32);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.7,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.15;
  base.receiveShadow = true;
  group.add(base);

  const ringGeo = new THREE.RingGeometry(1.2, 1.35, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.305;
  group.add(ring);

  if (geometry) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.2,
      metalness: 0.8,
      emissive: new THREE.Color(0x000000),
    });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.y = 2.0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.userData = {
      name,
      type,
      description,
      baseColor: color,
      baseY: 2.0,
      ringMesh: ring,
      isSelected: false,
    };

    group.add(mesh);
    interactiveObjects.push(mesh);
    scene.add(group);
    return mesh;
  }

  scene.add(group);
  return group;
}

// 1. Cyber Cube (Top-Left Quadrant)
createInteractiveItem(
  new THREE.BoxGeometry(1.5, 1.5, 1.5),
  0xf43f5e,
  -6,
  -4.5,
  "Cyber Cube",
  "BoxGeometry",
  "Precision cubic matrix with metallic alloy plating.",
);

// 2. Plasma Sphere (Top-Right Quadrant)
createInteractiveItem(
  new THREE.SphereGeometry(0.9, 32, 32),
  0x10b981,
  6,
  -4.5,
  "Plasma Sphere",
  "SphereGeometry",
  "Harmonic energy sphere maintaining constant equilibrium.",
);

// 3. Quantum Torus (Bottom-Left Quadrant)
createInteractiveItem(
  new THREE.TorusGeometry(0.75, 0.25, 24, 48),
  0xa855f7,
  -6,
  4.5,
  "Quantum Torus",
  "TorusGeometry",
  "Continuous toroidal field oscillator for particle acceleration.",
);

// 4. Golden Octahedron (Bottom-Right Quadrant)
createInteractiveItem(
  new THREE.OctahedronGeometry(1.0, 0),
  0xf59e0b,
  6,
  4.5,
  "Golden Octahedron",
  "OctahedronGeometry",
  "Dual-pyramid crystalline resonator with sharp geometric facets.",
);

// Center Platform & Ring (no floating object)
createInteractiveItem(null, 0xffffff, 0, 0);

// Dragging and Raycasting state
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-1000, -1000);
let hoveredObject = null;
let selectedObject = null;
let isDragging = false;
let draggedObject = null;
const dragPlane = new THREE.Plane();
const planeIntersectPoint = new THREE.Vector3();
const dragOffset = new THREE.Vector3();
const worldPos = new THREE.Vector3();

// Helper to check if screen width supports visual helpers (>= 768px)
const areHelpersAllowed = () => window.innerWidth >= 768;

// UI Overlay for displaying complete raycasted Intersection information
const infoCard = document.createElement("div");
infoCard.style.cssText = `
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 16px 20px;
  color: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  max-width: calc(100vw - 40px);
  min-width: 280px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  z-index: 100;
`;
infoCard.innerHTML = `
  <div style="font-size: 14px; font-weight: 700; color: #38bdf8; margin-bottom: 4px;">Raycast & Drag Interaction</div>
  <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">Drag shapes in 3D space</div>
  <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 6px 0 10px;" />
  <div style="color: #94a3b8; font-weight: bold;">Intersection / Drag Target</div>
  <div style="padding-left: 10px;">
    <div>├── <b>object:</b> <span id="info-object" style="color: #f1f5f9;">None</span></div>
    <div>├── <b>distance:</b> <span id="info-dist" style="color: #fbbf24;">--</span></div>
    <div>├── <b>point:</b> <span id="info-point" style="color: #34d399;">--</span></div>
    <div>├── <b>face:</b> <span id="info-face" style="color: #a78bfa;">--</span></div>
    <div>└── <b>uv:</b> <span id="info-uv" style="color: #f472b6;">--</span></div>
  </div>
  <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 10px 0 6px;" />
  <div style="font-size: 12px; margin-bottom: 6px;"><b>Status:</b> <span id="info-status" style="color: #94a3b8;">Idle</span></div>
  <div id="helper-legend-container" style="display: ${areHelpersAllowed() ? "block" : "none"};">
    <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 6px 0 6px;" />
    <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5;">
      <div><b>Axes:</b> <span style="color:#f43f5e;">■ +X</span> | <span style="color:#22c55e;">■ +Y</span> | <span style="color:#3b82f6;">■ +Z</span></div>
      <div><b>Arrow:</b> Camera direction / Normal</div>
      <div><b>Plane Mesh:</b> Translucent drag plane</div>
    </div>
  </div>
`;
document.body.appendChild(infoCard);

const objectEl = document.getElementById("info-object");
const distEl = document.getElementById("info-dist");
const pointEl = document.getElementById("info-point");
const faceEl = document.getElementById("info-face");
const uvEl = document.getElementById("info-uv");
const statusEl = document.getElementById("info-status");
const helperLegendEl = document.getElementById("helper-legend-container");

// Track pointer coordinates and handle active dragging in 3D (X, Y, Z)
window.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (isDragging && draggedObject) {
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(dragPlane, planeIntersectPoint)) {
      const targetWorld = planeIntersectPoint.clone().add(dragOffset);
      if (draggedObject.parent) {
        draggedObject.parent.worldToLocal(targetWorld);
        draggedObject.position.x = targetWorld.x;
        draggedObject.position.y = Math.max(0.5, targetWorld.y); // Keep above floor
        draggedObject.position.z = targetWorld.z;
      } else {
        draggedObject.position.x = targetWorld.x;
        draggedObject.position.y = Math.max(0.5, targetWorld.y);
        draggedObject.position.z = targetWorld.z;
      }

      // Update baseline elevation for floating animation
      draggedObject.userData.baseY = draggedObject.position.y;

      // Update positions of visual helpers if screen width is >= 768
      if (areHelpersAllowed()) {
        draggedObject.getWorldPosition(worldPos);
        visualDragPlane.position.copy(worldPos);
        arrowHelper.position.copy(worldPos);
      }

      pointEl.textContent = `(x: ${planeIntersectPoint.x.toFixed(2)}, y: ${draggedObject.position.y.toFixed(2)}, z: ${planeIntersectPoint.z.toFixed(2)})`;
    }
  }
});

// Pointer down to initiate selection and 3D drag
window.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return; // Left mouse button only

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(interactiveObjects);
  if (intersects.length > 0) {
    const hit = intersects[0];
    const hitMesh = hit.object;

    if (selectedObject && selectedObject !== hitMesh) {
      selectedObject.userData.isSelected = false;
      selectedObject.material.emissive.setHex(0x000000);
      selectedObject.scale.set(1, 1, 1);
    }
    selectedObject = hitMesh;
    selectedObject.userData.isSelected = true;

    // Start dragging
    isDragging = true;
    draggedObject = hitMesh;
    controls.enabled = false; // Disable orbit controls during drag

    draggedObject.getWorldPosition(worldPos);

    // Create a camera-facing plane so moving mouse up/down elevates the object along Y
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir).negate();
    dragPlane.setFromNormalAndCoplanarPoint(cameraDir, worldPos);

    if (raycaster.ray.intersectPlane(dragPlane, planeIntersectPoint)) {
      dragOffset.subVectors(worldPos, planeIntersectPoint);
    }

    // Only display visual plane mesh and camera direction arrow on screens >= 768px
    if (areHelpersAllowed()) {
      visualDragPlane.position.copy(worldPos);
      visualDragPlane.quaternion.copy(camera.quaternion);
      visualDragPlane.visible = true;

      arrowHelper.position.copy(worldPos);
      arrowHelper.setDirection(cameraDir.clone().normalize());
      arrowHelper.visible = true;
    } else {
      visualDragPlane.visible = false;
      arrowHelper.visible = false;
    }

    renderer.domElement.style.cursor = "grabbing";
    document.body.style.cursor = "grabbing";
    statusEl.innerHTML = `<span style="color: #f59e0b; font-weight: bold;">Dragging</span>`;
  }
});

// Optional scroll wheel adjustment for fine Y elevation control while dragging
window.addEventListener(
  "wheel",
  (event) => {
    if (isDragging && draggedObject) {
      event.preventDefault();
      draggedObject.position.y = Math.max(
        0.5,
        draggedObject.position.y - event.deltaY * 0.005,
      );
      draggedObject.userData.baseY = draggedObject.position.y;
      if (areHelpersAllowed()) {
        draggedObject.getWorldPosition(worldPos);
        visualDragPlane.position.copy(worldPos);
        arrowHelper.position.copy(worldPos);
      }
      pointEl.textContent = `(x: ${draggedObject.position.x.toFixed(2)}, y: ${draggedObject.position.y.toFixed(2)}, z: ${draggedObject.position.z.toFixed(2)})`;
    }
  },
  { passive: false },
);

// Pointer up to release drag and restore controls
function onPointerUp() {
  if (isDragging) {
    isDragging = false;
    draggedObject = null;
    controls.enabled = true;

    // Hide visual drag helpers
    visualDragPlane.visible = false;
    arrowHelper.visible = false;

    renderer.domElement.style.cursor = hoveredObject ? "grab" : "default";
    document.body.style.cursor = hoveredObject ? "grab" : "default";
    if (selectedObject) {
      statusEl.innerHTML = `<span style="color: #facc15; font-weight: bold;">Selected</span>`;
    } else {
      statusEl.textContent = "Idle";
    }
  }
}

window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);

// Clock for animation loop
const clock = new THREE.Clock();

// Render and raycasting loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  // Smooth orbit controls
  controls.update();

  if (!isDragging) {
    // Perform Raycasting from camera through pointer coordinates
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitMesh = hit.object;

      renderer.domElement.style.cursor = "grab";
      document.body.style.cursor = "grab";

      if (hoveredObject !== hitMesh) {
        if (hoveredObject && !hoveredObject.userData.isSelected) {
          hoveredObject.material.emissive.setHex(0x000000);
          hoveredObject.scale.set(1, 1, 1);
        }
        hoveredObject = hitMesh;
      }

      if (!hitMesh.userData.isSelected) {
        hitMesh.material.emissive.setHex("red");
        hitMesh.scale.set(1.1, 1.1, 1.1);
      }

      // Populate all 5 Intersection properties into UI
      objectEl.textContent = `${hitMesh.userData.name} (${hitMesh.userData.type})`;
      distEl.textContent = `${hit.distance.toFixed(3)} units`;
      pointEl.textContent = `(x: ${hit.point.x.toFixed(2)}, y: ${hit.point.y.toFixed(2)}, z: ${hit.point.z.toFixed(2)})`;
      faceEl.textContent = hit.face
        ? `index ${hit.faceIndex} [norm: (${hit.face.normal.x.toFixed(1)}, ${hit.face.normal.y.toFixed(1)}, ${hit.face.normal.z.toFixed(1)})]`
        : `index ${hit.faceIndex ?? "N/A"}`;
      uvEl.textContent = hit.uv
        ? `(u: ${hit.uv.x.toFixed(3)}, v: ${hit.uv.y.toFixed(3)})`
        : "N/A";

      if (!hitMesh.userData.isSelected) {
        statusEl.innerHTML = `<span style="color: #38bdf8;">Hovering</span>`;
      }
    } else {
      renderer.domElement.style.cursor = "default";
      document.body.style.cursor = "default";
      if (hoveredObject && !hoveredObject.userData.isSelected) {
        hoveredObject.material.emissive.setHex(0x000000);
        hoveredObject.scale.set(1, 1, 1);
        hoveredObject = null;
      }
      if (!selectedObject) {
        objectEl.textContent = "None";
        distEl.textContent = "--";
        pointEl.textContent = "--";
        faceEl.textContent = "--";
        uvEl.textContent = "--";
        statusEl.textContent = "Idle";
      }
    }
  }

  // Smooth rotation and floating animation on interactive objects
  for (let i = 0; i < interactiveObjects.length; i++) {
    const mesh = interactiveObjects[i];
    mesh.rotation.y += 0.8 * delta;
    mesh.rotation.x += 0.4 * delta;

    if (mesh === draggedObject) {
      mesh.material.emissive.setHex(0x553300);
      mesh.scale.setScalar(1.2);
    } else if (mesh.userData.isSelected) {
      mesh.material.emissive.setHex(0x443300);
      mesh.position.y = THREE.MathUtils.lerp(
        mesh.position.y,
        mesh.userData.baseY + 0.5 + Math.sin(elapsedTime * 4.0) * 0.15,
        0.1,
      );
      mesh.scale.setScalar(1.15);
    } else if (mesh !== hoveredObject) {
      mesh.position.y = THREE.MathUtils.lerp(
        mesh.position.y,
        mesh.userData.baseY + Math.sin(elapsedTime * 2.0 + i) * 0.1,
        0.1,
      );
    }
  }

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

  // Dynamically update visual helpers and HUD legend on breakpoint change
  const allowed = areHelpersAllowed();
  axesHelper.visible = allowed;
  if (!allowed) {
    visualDragPlane.visible = false;
    arrowHelper.visible = false;
  }
  if (helperLegendEl) {
    helperLegendEl.style.display = allowed ? "block" : "none";
  }
});
