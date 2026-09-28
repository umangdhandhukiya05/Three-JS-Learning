import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// 1. DOM REFERENCES
const hudMode = document.getElementById("hud-mode");
const hudFps = document.getElementById("hud-fps");
const hudCalls = document.getElementById("hud-calls");
const hudCubes = document.getElementById("hud-cubes");
const hudTriangles = document.getElementById("hud-triangles");
const hudExplain = document.getElementById("hud-explain");
const btnToggleMode = document.getElementById("btn-toggle-mode");

// 2. SCENE, CAMERA & RENDERER SETUP
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b14);
scene.fog = new THREE.FogExp2(0x070b14, 0.015);

const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 22, 38);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
mainLight.position.set(20, 30, 20);
scene.add(mainLight);

const rimLight = new THREE.DirectionalLight(0xec4899, 1.8);
rimLight.position.set(-20, -10, -20);
scene.add(rimLight);

// 3. CONFIGURATION & STATE (Static Model Count & Single Toggle)
const COUNT = 2000; // Static 2,000 cubes
let isInstanced = true; // true = InstancedMesh (1 draw call), false = Normal Meshes (2000+ draw calls)

// Shared Geometry and Material
const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
const cubeMat = new THREE.MeshStandardMaterial({
    roughness: 0.35,
    metalness: 0.75,
});

// Containers for rendering modes
let instancedMesh = null;
const normalGroup = new THREE.Group();
scene.add(normalGroup);

// Store cube parameters for animated movement
const cubeData = [];
const gridSize = Math.ceil(Math.sqrt(COUNT));
const spacing = 1.5;

for (let i = 0; i < COUNT; i++) {
    const gx = (i % gridSize) - gridSize / 2;
    const gz = Math.floor(i / gridSize) - gridSize / 2;
    const color = new THREE.Color().setHSL(i / COUNT, 0.9, 0.55);

    cubeData.push({
        baseX: gx * spacing,
        baseZ: gz * spacing,
        phase: Math.random() * Math.PI * 2,
        scale: 0.5 + Math.random() * 0.7,
        color: color,
    });
}

// 4. BUILD RENDERING MODES
function createInstancedMesh() {
    clearMeshes();

    instancedMesh = new THREE.InstancedMesh(cubeGeo, cubeMat, COUNT);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();

    for (let i = 0; i < COUNT; i++) {
        const d = cubeData[i];
        dummy.position.set(d.baseX, 0, d.baseZ);
        dummy.scale.setScalar(d.scale);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(i, dummy.matrix);
        instancedMesh.setColorAt(i, d.color);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

    scene.add(instancedMesh);
}

function createNormalMeshes() {
    clearMeshes();

    for (let i = 0; i < COUNT; i++) {
        const d = cubeData[i];
        // Each mesh gets its own cloned material to induce separate GPU draw calls
        const mat = new THREE.MeshStandardMaterial({
            color: d.color,
            roughness: 0.35,
            metalness: 0.75,
        });
        const mesh = new THREE.Mesh(cubeGeo, mat);
        mesh.position.set(d.baseX, 0, d.baseZ);
        mesh.scale.setScalar(d.scale);
        normalGroup.add(mesh);
    }
}

function clearMeshes() {
    if (instancedMesh) {
        scene.remove(instancedMesh);
        instancedMesh.dispose();
        instancedMesh = null;
    }

    while (normalGroup.children.length > 0) {
        const child = normalGroup.children.pop();
        if (child.material) child.material.dispose();
    }
}

function updateHUDNotes() {
    if (hudMode) {
        hudMode.textContent = isInstanced
            ? ` INSTANCED (1 DRAW CALL)`
            : ` NORMAL MESHES (${COUNT.toLocaleString()} DRAW CALLS)`;
        hudMode.className = isInstanced ? "hud-tag opt" : "hud-tag unopt";
    }

    if (hudExplain) {
        hudExplain.textContent = isInstanced
            ? `InstancedMesh active: All ${COUNT.toLocaleString()} cubes rendered in 1 single GPU draw call. CPU load is minimal.`
            : `Normal meshes active: ${COUNT.toLocaleString()} separate draw calls issued per frame! CPU is heavily bottlenecked.`;
    }

    if (hudCubes) hudCubes.textContent = COUNT.toLocaleString();
}

function rebuildScene() {
    if (isInstanced) {
        createInstancedMesh();
    } else {
        createNormalMeshes();
    }
    updateHUDNotes();
}

// Initialize Scene
rebuildScene();

// 5. ANIMATED MOVEMENT CALCULATOR (3D Undulating Wave Field)
const dummy = new THREE.Object3D();

function updateCubeTransform(i, time, target) {
    const d = cubeData[i];
    const dist = Math.hypot(d.baseX, d.baseZ);

    // Smooth 3D wave calculation
    const y = Math.sin(dist * 0.35 - time * 2.5 + d.phase) * 3.5 +
        Math.cos(d.baseX * 0.2 + time) * 1.5;

    target.position.set(d.baseX, y, d.baseZ);
    target.rotation.x = time * 0.8 + d.phase;
    target.rotation.y = time * 0.6;
    target.rotation.z = y * 0.2;
    target.scale.setScalar(d.scale);
}

// 6. SINGLE TOGGLE EVENT LISTENER (Normal Meshes vs InstancedMesh)
if (btnToggleMode) {
    btnToggleMode.addEventListener("click", () => {
        isInstanced = !isInstanced;
        btnToggleMode.textContent = isInstanced ? "Mode: InstancedMesh" : "Mode: Normal Meshes";
        btnToggleMode.classList.toggle("danger", !isInstanced);
        btnToggleMode.classList.toggle("active", isInstanced);
        rebuildScene();
    });
}

// 7. ANIMATION & RENDER LOOP
const clock = new THREE.Clock();

let lastDiagTime = performance.now();
let frameCounter = 0;

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Update transforms based on active rendering mode
    if (isInstanced && instancedMesh) {
        for (let i = 0; i < COUNT; i++) {
            updateCubeTransform(i, elapsedTime, dummy);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        // Upload new transformation matrix buffer to GPU
        instancedMesh.instanceMatrix.needsUpdate = true;
    } else if (!isInstanced) {
        const children = normalGroup.children;
        for (let i = 0; i < children.length; i++) {
            updateCubeTransform(i, elapsedTime, children[i]);
        }
    }

    // Render Scene
    controls.update();
    renderer.render(scene, camera);

    // Update Diagnostics HUD
    frameCounter++;
    const now = performance.now();
    if (now - lastDiagTime >= 300) {
        const fps = Math.round((frameCounter * 1000) / (now - lastDiagTime));
        frameCounter = 0;
        lastDiagTime = now;

        if (hudFps) {
            hudFps.textContent = `${fps}`;
            hudFps.className = fps >= 50 ? "good" : "bad";
        }

        const calls = renderer.info.render.calls;
        if (hudCalls) {
            hudCalls.textContent = `${calls}`;
            hudCalls.className = calls < 10 ? "good" : "bad";
        }

        if (hudTriangles) {
            hudTriangles.textContent = renderer.info.render.triangles.toLocaleString();
        }
    }
}

animate();

// Window Resize Handler
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
