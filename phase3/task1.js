import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

/* =========================================================================
   PHASE 3 – TASK 1: MULTI-OBJECT SHADER EXPERIMENTS
   Phenomena covered:
     1. Waves   (ocean water displacement, foam crests & caustics)
     2. Smoke   (procedural volumetric turbulence, wispy billows)
     3. Terrain (multi-octave mountain landscape with biome altitude bands)
     4. Liquid  (viscous pulsing droplet with fresnel & iridescent sheen)
   ========================================================================= */

// -------------------------------------------------------------
// 1. SCENE & CAMERA SETUP
// -------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06080e);

const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(0, 0, 7.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// -------------------------------------------------------------
// 2. HELPER TO CREATE UNIFORMS
// -------------------------------------------------------------
function createBaseUniforms(mode, colors) {
    return {
        uMode: { value: mode },
        uTime: { value: 0.0 },
        uColorCycleSpeed: { value: 0.4 },

        // Colors
        uColorA: { value: new THREE.Color(colors.a) },
        uColorB: { value: new THREE.Color(colors.b) },
        uColorC: { value: new THREE.Color(colors.c) },
        uColorInteractive: { value: new THREE.Color(colors.interactive) },

        // Mouse Interaction
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseHover: { value: 0.0 },
        uMouseRadius: { value: 0.35 },
        uMouseStrength: { value: 0.25 },

        // Waves
        uWaveSpeed: { value: 2.2 },
        uWaveFrequency: { value: 3.5 },
        uWaveElevation: { value: 0.2 },
        uStripeFrequency: { value: 24.0 },
        uRippleFrequency: { value: 28.0 },

        // Smoke
        uSmokeSpeed: { value: 0.7 },
        uSmokeTurbulence: { value: 0.45 },
        uSmokeDensity: { value: 0.85 },

        // Terrain
        uTerrainHeight: { value: 0.45 },
        uTerrainFrequency: { value: 1.3 },

        // Liquid
        uLiquidWobble: { value: 0.35 },
        uLiquidSpeed: { value: 1.5 },
    };
}

// -------------------------------------------------------------
// 3. OBJECT CREATION (Waves, Smoke, Terrain, Liquid)
// -------------------------------------------------------------

// Object 1: Waves (Ocean plane)
const wavesUniforms = createBaseUniforms(0, {
    a: "#022b42",
    b: "#00e5ff",
    c: "#38bdf8",
    interactive: "#fbbf24",
});
const wavesMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: wavesUniforms,
    side: THREE.DoubleSide,
    wireframe: false,
});
const wavesMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 3.0, 140, 140),
    wavesMaterial
);
wavesMesh.name = "Waves";
wavesMesh.rotation.x = -Math.PI / 4;
scene.add(wavesMesh);

// Object 2: Smoke (Ethereal billboard billows)
const smokeUniforms = createBaseUniforms(1, {
    a: "#581c87",
    b: "#38bdf8",
    c: "#ec4899",
    interactive: "#f43f5e",
});
const smokeMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: smokeUniforms,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    wireframe: false,
});
const smokeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 3.4, 100, 100),
    smokeMaterial
);
smokeMesh.name = "Smoke";
scene.add(smokeMesh);

// Object 3: Terrain (Fractal mountain landscape)
const terrainUniforms = createBaseUniforms(2, {
    a: "#0369a1",
    b: "#84cc16",
    c: "#ffffff",
    interactive: "#f59e0b",
});
const terrainMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: terrainUniforms,
    side: THREE.DoubleSide,
    wireframe: false,
});
const terrainMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 3.0, 140, 140),
    terrainMaterial
);
terrainMesh.name = "Terrain";
terrainMesh.rotation.x = -Math.PI / 4;
scene.add(terrainMesh);

// Object 4: Liquid (Viscous organic droplet)
const liquidUniforms = createBaseUniforms(3, {
    a: "#1e1b4b",
    b: "#06b6d4",
    c: "#ec4899",
    interactive: "#22c55e",
});
const liquidMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: liquidUniforms,
    side: THREE.DoubleSide,
    wireframe: false,
});
const liquidMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, 48),
    liquidMaterial
);
liquidMesh.name = "Liquid";
scene.add(liquidMesh);

const objectsList = [
    { name: "Waves", mesh: wavesMesh, uniforms: wavesUniforms, material: wavesMaterial },
    { name: "Smoke", mesh: smokeMesh, uniforms: smokeUniforms, material: smokeMaterial },
    { name: "Terrain", mesh: terrainMesh, uniforms: terrainUniforms, material: terrainMaterial },
    { name: "Liquid", mesh: liquidMesh, uniforms: liquidUniforms, material: liquidMaterial },
];

// -------------------------------------------------------------
// 4. DISPLAY LAYOUT CONFIGURATION
// -------------------------------------------------------------
const sceneParams = {
    layout: "Side by Side",   // "Side by Side" or "Single Object"
    focusObject: "Waves",      // Active when in "Single Object"
};

function applyLayout() {
    if (sceneParams.layout === "Side by Side") {
        // 2x2 grid layout
        wavesMesh.visible = true;
        wavesMesh.position.set(-2.2, 1.8, 0);

        smokeMesh.visible = true;
        smokeMesh.position.set(2.2, 1.8, 0);

        terrainMesh.visible = true;
        terrainMesh.position.set(-2.2, -1.8, 0);

        liquidMesh.visible = true;
        liquidMesh.position.set(2.2, -1.8, 0);

        camera.position.set(0, 0, 7.8);
        controls.target.set(0, 0, 0);
    } else {
        // Center only the focused object
        objectsList.forEach((item) => {
            if (item.name === sceneParams.focusObject) {
                item.mesh.visible = true;
                item.mesh.position.set(0, 0, 0);
            } else {
                item.mesh.visible = false;
            }
        });
        camera.position.set(0, 0, 5.0);
        controls.target.set(0, 0, 0);
    }
}

applyLayout();

// -------------------------------------------------------------
// 5. MOUSE INTERACTION & RAYCASTING
// -------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(999, 999);
let hoveredItem = null;
const targetUv = new THREE.Vector2(0.5, 0.5);

window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const visibleMeshes = objectsList
        .filter((o) => o.mesh.visible)
        .map((o) => o.mesh);

    const intersects = raycaster.intersectObjects(visibleMeshes);
    if (intersects.length > 0 && intersects[0].uv) {
        const hitMesh = intersects[0].object;
        hoveredItem = objectsList.find((o) => o.mesh === hitMesh);
        targetUv.copy(intersects[0].uv);
    } else {
        hoveredItem = null;
    }
});

window.addEventListener("pointerleave", () => {
    hoveredItem = null;
});

// -------------------------------------------------------------
// 6. LIL-GUI SETUP
// -------------------------------------------------------------
const gui = new GUI({ title: "Custom Shaders Studio" });

// Scene Mode Folder
const layoutFolder = gui.addFolder("Scene Display");
layoutFolder
    .add(sceneParams, "layout", ["Side by Side", "Single Object"])
    .name("Layout Mode")
    .onChange(applyLayout);
layoutFolder
    .add(sceneParams, "focusObject", ["Waves", "Smoke", "Terrain", "Liquid"])
    .name("Focus Object")
    .onChange(applyLayout);
layoutFolder.open();

// 1. Waves Folder
const wavesFolder = gui.addFolder("Waves Controls");
wavesFolder.add(wavesUniforms.uWaveElevation, "value", 0, 0.6, 0.01).name("Wave Height");
wavesFolder.add(wavesUniforms.uWaveFrequency, "value", 0.5, 8, 0.1).name("Frequency");
wavesFolder.add(wavesUniforms.uWaveSpeed, "value", 0, 6, 0.1).name("Speed");
wavesFolder.add(wavesMaterial, "wireframe").name("Wireframe");

// 2. Smoke Folder
const smokeFolder = gui.addFolder("Smoke Controls");
smokeFolder.add(smokeUniforms.uSmokeTurbulence, "value", 0.0, 1.0, 0.02).name("Turbulence");
smokeFolder.add(smokeUniforms.uSmokeSpeed, "value", 0.1, 3.0, 0.1).name("Flow Speed");
smokeFolder.add(smokeUniforms.uSmokeDensity, "value", 0.2, 1.5, 0.05).name("Density");
smokeFolder.add(smokeMaterial, "wireframe").name("Wireframe");

// 3. Terrain Folder
const terrainFolder = gui.addFolder("Terrain Controls");
terrainFolder.add(terrainUniforms.uTerrainHeight, "value", 0.1, 1.2, 0.02).name("Elevation");
terrainFolder.add(terrainUniforms.uTerrainFrequency, "value", 0.5, 4.0, 0.1).name("Roughness");
terrainFolder.add(terrainMaterial, "wireframe").name("Wireframe");

// 4. Liquid Folder
const liquidFolder = gui.addFolder("Liquid Controls");
liquidFolder.add(liquidUniforms.uLiquidWobble, "value", 0.0, 0.8, 0.02).name("Wobble");
liquidFolder.add(liquidUniforms.uLiquidSpeed, "value", 0.2, 4.0, 0.1).name("Fluid Speed");
liquidFolder.add(liquidMaterial, "wireframe").name("Wireframe");

// -------------------------------------------------------------
// 7. RESIZE HANDLER
// -------------------------------------------------------------
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// -------------------------------------------------------------
// 8. ANIMATION LOOP
// -------------------------------------------------------------
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Update each object's time & interactive mouse response
    objectsList.forEach((item) => {
        item.uniforms.uTime.value = elapsedTime;

        const isThisHovered = hoveredItem && hoveredItem.name === item.name;
        if (isThisHovered) {
            item.uniforms.uMouse.value.lerp(targetUv, 0.12);
        }
        item.uniforms.uMouseHover.value = THREE.MathUtils.lerp(
            item.uniforms.uMouseHover.value,
            isThisHovered ? 1.0 : 0.0,
            0.08
        );
    });

    // Gentle slow rotation of objects for 3D depth
    liquidMesh.rotation.y = elapsedTime * 0.15;
    liquidMesh.rotation.x = elapsedTime * 0.1;

    controls.update();
    renderer.render(scene, camera);
}

animate();
