import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import gsap from "gsap";

// Shaders for procedural flame & smoke
import flameVertexShader from "./shaders/flameVertex.glsl";
import flameFragmentShader from "./shaders/flameFragment.glsl";
import glowVertexShader from "./shaders/glowVertex.glsl";
import glowFragmentShader from "./shaders/glowFragment.glsl";
import smokeVertexShader from "./shaders/smokeVertex.glsl";
import smokeFragmentShader from "./shaders/smokeFragment.glsl";

// 1. SCENE, CAMERA & RENDERER SETUP
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070912);
scene.fog = new THREE.FogExp2(0x070912, 0.035);

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(0, 2.0, 4.8);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 1.4;
controls.maxDistance = 10.0;
controls.maxPolarAngle = Math.PI / 2 + 0.04;
controls.target.set(0, 1.45, 0);

// 2. STUDIO LIGHTING & HDR ENVIRONMENT
const ambientLight = new THREE.AmbientLight(0x23293a, 0.6);
scene.add(ambientLight);

// Key light casting soft contact shadows
const keyLight = new THREE.DirectionalLight(0xfff6ec, 2.5);
keyLight.position.set(3.5, 5.5, 4.0);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 14;
keyLight.shadow.camera.left = -2.5;
keyLight.shadow.camera.right = 2.5;
keyLight.shadow.camera.top = 3.5;
keyLight.shadow.camera.bottom = -1.5;
keyLight.shadow.bias = -0.0006;
scene.add(keyLight);

// Cool rim light for metallic edges
const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.2);
rimLight.position.set(-3.5, 3.0, -3.0);
scene.add(rimLight);

// Soft bottom fill
const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.45);
fillLight.position.set(0, -1.5, 2.5);
scene.add(fillLight);

// Dynamic PointLight originating from the flame
const flameLight = new THREE.PointLight(0xff9326, 3.0, 7.0, 1.6);
flameLight.castShadow = true;
flameLight.shadow.mapSize.width = 1024;
flameLight.shadow.mapSize.height = 1024;
flameLight.shadow.bias = -0.001;
scene.add(flameLight);

// Load HDR environment map for realistic PBR reflections
const rgbeLoader = new RGBELoader();
rgbeLoader.load("/hdri/phalzer_forest_01_2k.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
});

// 3. STUDIO PEDESTAL & GROUND
const groundGeo = new THREE.PlaneGeometry(30, 30);
const groundMat = new THREE.MeshStandardMaterial({
    color: 0x090c14,
    roughness: 0.85,
    metalness: 0.1,
});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = 0;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const plinthGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.08, 48);
const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x111624,
    roughness: 0.5,
    metalness: 0.35,
});
const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
plinthMesh.position.y = 0.04;
plinthMesh.receiveShadow = true;
plinthMesh.castShadow = true;
scene.add(plinthMesh);

// 4. MODEL LOADING & CENTERING
const lighterState = {
    isOpen: true,
    isIgnited: true,
    flickerStrength: 0.28,
};

const lighterGroup = new THREE.Group();
scene.add(lighterGroup);

let bodyMesh = null;
let flintstoneMesh = null;
let hammerMesh = null;
let hingeNode = null;
const interactiveMeshes = [];

const openHingeQuat = new THREE.Quaternion();
const closedHingeQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));

// Flame anchor position: updated accurately once body is loaded
const flameAnchor = new THREE.Vector3(0, 2.72, 0);

// Scale factor to normalize miniature ~0.053m lighter to comfortable ~2.6 height
const SCALE_FACTOR = 50.0;

const gltfLoader = new GLTFLoader();
gltfLoader.load(
    "/models/lighter/vintage_lighter_1k.gltf",
    (gltf) => {
        const rawModel = gltf.scene;

        // Traverse child meshes to identify parts and enhance materials
        rawModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                interactiveMeshes.push(child);

                if (child.material) {
                    child.material.envMapIntensity = 1.35;
                    child.material.needsUpdate = true;
                }
            }

            if (child.name === "vintage_lighter_body") {
                bodyMesh = child;
            } else if (child.name === "vintage_lighter_flintstone") {
                flintstoneMesh = child;
            } else if (child.name === "vintage_lighter_hammer") {
                hammerMesh = child;
            } else if (child.name === "vintage_lighter_hinge") {
                hingeNode = child;
                openHingeQuat.copy(child.quaternion);
            }
        });

        rawModel.scale.setScalar(SCALE_FACTOR);

        // Center the lighter body precisely on the origin (X=0, Z=0)
        // In local coordinates, the body mesh bounding box center is at X=0, Z=0,
        // and bottom is at Y = -0.0285. Place bottom on plinth (Y = 0.08)
        const bodyBottomY = -0.0285 * SCALE_FACTOR;
        rawModel.position.set(0, 0.08 - bodyBottomY, 0);

        lighterGroup.add(rawModel);

        // The chimney opening (where the wick is located) is at:
        // Local X = -0.0014, Local Y = 0.0248 (top rim of chimney), Local Z = 0.0
        // When scaled and positioned:
        const chimneyTopY = rawModel.position.y + (0.0246 * SCALE_FACTOR);
        const chimneyCenterX = rawModel.position.x + (-0.0014 * SCALE_FACTOR);
        const chimneyCenterZ = rawModel.position.z;

        flameAnchor.set(chimneyCenterX, chimneyTopY, chimneyCenterZ);

        // Position flame, glow, smoke, and point light at the center of the chimney opening
        flameMesh.position.copy(flameAnchor);
        glowMesh.position.copy(flameAnchor);
        smokeMesh.position.copy(flameAnchor);
        flameLight.position.set(flameAnchor.x, flameAnchor.y + 0.35, flameAnchor.z);

        // Center camera controls target on the lighter body center
        controls.target.set(0, rawModel.position.y * 0.95, 0);
    },
    undefined,
    (err) => {
        console.error("[Task3] Error loading lighter model:", err);
    }
);

// 5. PROCEDURAL FLAME, GLOW & SMOKE SHADERS
const flameHeight = 0.85;
const flameRadius = 0.22;

const flameGeo = new THREE.CylinderGeometry(
    0.001,
    flameRadius,
    flameHeight,
    48,
    48,
    true
);
flameGeo.translate(0, flameHeight * 0.5, 0);

// Organic teardrop profile deformation
const posAttr = flameGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    const normalizedY = y / flameHeight;
    const bulb = Math.sin(Math.pow(normalizedY, 0.65) * Math.PI) * (1.0 - normalizedY * 0.35);
    const radiusMultiplier = Math.max(0.06, bulb);
    posAttr.setX(i, posAttr.getX(i) * radiusMultiplier);
    posAttr.setZ(i, posAttr.getZ(i) * radiusMultiplier);
}
flameGeo.computeVertexNormals();

const flameColors = {
    root: "#1e3a8a",
    inner: "#ffffff",
    outer: "#ff7300",
    tip: "#dc2626",
    aura: "#f97316",
};

const flameUniforms = {
    uTime: { value: 0.0 },
    uFlickerSpeed: { value: 1.4 },
    uFlickerStrength: { value: 0.28 },
    uWind: { value: new THREE.Vector3(0, 0, 0) },
    uExtinguish: { value: 0.0 },
    uFlameScale: { value: 1.0 },
    uColorRoot: { value: new THREE.Color(flameColors.root) },
    uColorInner: { value: new THREE.Color(flameColors.inner) },
    uColorOuter: { value: new THREE.Color(flameColors.outer) },
    uColorTip: { value: new THREE.Color(flameColors.tip) },
    uGlowIntensity: { value: 2.2 },
    uDissolveProgress: { value: 0.0 },
};

const flameMaterial = new THREE.ShaderMaterial({
    vertexShader: flameVertexShader,
    fragmentShader: flameFragmentShader,
    uniforms: flameUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
});

const flameMesh = new THREE.Mesh(flameGeo, flameMaterial);
flameMesh.position.copy(flameAnchor);
scene.add(flameMesh);

// Soft radial atmospheric halo
const glowUniforms = {
    uTime: { value: 0.0 },
    uGlowColor: { value: new THREE.Color(flameColors.aura) },
    uGlowIntensity: { value: 0.75 },
    uFlameFlicker: { value: 1.0 },
    uExtinguish: { value: 0.0 },
};

const glowGeo = new THREE.PlaneGeometry(1.8, 1.8);
const glowMat = new THREE.ShaderMaterial({
    vertexShader: glowVertexShader,
    fragmentShader: glowFragmentShader,
    uniforms: glowUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
});
const glowMesh = new THREE.Mesh(glowGeo, glowMat);
glowMesh.position.copy(flameAnchor);
scene.add(glowMesh);

// Subtle smoke column rising above flame
const smokeUniforms = {
    uTime: { value: 0.0 },
    uSmokeColor: { value: new THREE.Color(0x334155) },
    uSmokeSpeed: { value: 0.6 },
    uSmokeDensity: { value: 0.35 },
    uWind: { value: new THREE.Vector3(0, 0, 0) },
    uExtinguish: { value: 0.0 },
};

const smokeGeo = new THREE.CylinderGeometry(0.06, 0.4, 2.2, 32, 32, true);
smokeGeo.translate(0, 1.1 + flameHeight, 0);
const smokeMat = new THREE.ShaderMaterial({
    vertexShader: smokeVertexShader,
    fragmentShader: smokeFragmentShader,
    uniforms: smokeUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
});
const smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
smokeMesh.position.copy(flameAnchor);
scene.add(smokeMesh);

// 6. FLINT STRIKE SPARK PARTICLES
const SPARK_COUNT = 50;
const sparkPositions = new Float32Array(SPARK_COUNT * 3);
const sparkVelocities = [];
const sparkLifetimes = new Float32Array(SPARK_COUNT);

for (let i = 0; i < SPARK_COUNT; i++) {
    sparkPositions[i * 3] = 0;
    sparkPositions[i * 3 + 1] = -100;
    sparkPositions[i * 3 + 2] = 0;
    sparkVelocities.push(new THREE.Vector3(0, 0, 0));
    sparkLifetimes[i] = 0;
}

const sparkGeometry = new THREE.BufferGeometry();
sparkGeometry.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));

const sparkMaterial = new THREE.PointsMaterial({
    color: 0xffdd55,
    size: 0.04,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
});

const sparkPoints = new THREE.Points(sparkGeometry, sparkMaterial);
scene.add(sparkPoints);

function triggerSparks() {
    // Flint wheel is situated on the right side of the chimney (+X offset)
    const flintOrigin = flameAnchor.clone().add(new THREE.Vector3(0.55, -0.22, 0.0));
    const pos = sparkGeometry.attributes.position.array;

    for (let i = 0; i < SPARK_COUNT; i++) {
        pos[i * 3] = flintOrigin.x + (Math.random() - 0.5) * 0.05;
        pos[i * 3 + 1] = flintOrigin.y + (Math.random() - 0.5) * 0.05;
        pos[i * 3 + 2] = flintOrigin.z + (Math.random() - 0.5) * 0.05;

        // Shoot sparks leftward towards chimney wick and upward
        sparkVelocities[i].set(
            -1.2 - Math.random() * 1.5,
            1.0 + Math.random() * 1.8,
            (Math.random() - 0.5) * 1.2
        );
        sparkLifetimes[i] = 0.22 + Math.random() * 0.3;
    }
    sparkGeometry.attributes.position.needsUpdate = true;
}

function updateSparks(delta) {
    const pos = sparkGeometry.attributes.position.array;
    let anyActive = false;

    for (let i = 0; i < SPARK_COUNT; i++) {
        if (sparkLifetimes[i] > 0) {
            sparkLifetimes[i] -= delta;
            anyActive = true;

            sparkVelocities[i].y -= 9.8 * delta * 0.45;
            pos[i * 3] += sparkVelocities[i].x * delta;
            pos[i * 3 + 1] += sparkVelocities[i].y * delta;
            pos[i * 3 + 2] += sparkVelocities[i].z * delta;
        } else {
            pos[i * 3 + 1] = -100;
        }
    }

    if (anyActive) {
        sparkGeometry.attributes.position.needsUpdate = true;
    }
}

// 7. ARTICULATION & INTERACTIONS
function toggleLid(open) {
    if (!hingeNode) return;
    lighterState.isOpen = open !== undefined ? open : !lighterState.isOpen;

    const targetQuat = lighterState.isOpen ? openHingeQuat : closedHingeQuat;
    const startQuat = hingeNode.quaternion.clone();

    const progressObj = { t: 0 };
    gsap.to(progressObj, {
        t: 1,
        duration: 0.5,
        ease: lighterState.isOpen ? "back.out(1.4)" : "power2.inOut",
        onUpdate: () => {
            hingeNode.quaternion.copy(startQuat).slerp(targetQuat, progressObj.t);
        },
        onComplete: () => {
            if (!lighterState.isOpen && lighterState.isIgnited) {
                setIgnited(false);
            }
        },
    });
}

function strikeLighter() {
    if (!lighterState.isOpen) {
        toggleLid(true);
    }

    if (flintstoneMesh) {
        gsap.to(flintstoneMesh.rotation, {
            z: flintstoneMesh.rotation.z + Math.PI * 4,
            duration: 0.38,
            ease: "power3.out",
        });
    }

    if (hammerMesh) {
        gsap.to(hammerMesh.rotation, {
            z: 0.35,
            duration: 0.12,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut",
        });
    }

    triggerSparks();

    setTimeout(() => {
        setIgnited(true);
    }, 110);
}

function setIgnited(ignited) {
    lighterState.isIgnited = ignited;
    const targetExtinguish = ignited ? 0.0 : 1.0;

    gsap.to(flameUniforms.uExtinguish, {
        value: targetExtinguish,
        duration: ignited ? 0.25 : 0.4,
        ease: ignited ? "back.out(1.8)" : "power2.in",
    });
    gsap.to(glowUniforms.uExtinguish, {
        value: targetExtinguish,
        duration: 0.35,
    });
    gsap.to(smokeUniforms.uExtinguish, {
        value: targetExtinguish,
        duration: 0.8,
    });

    gsap.to(flameLight, {
        intensity: ignited ? 3.0 : 0.0,
        duration: ignited ? 0.25 : 0.4,
    });
}

function toggleFlame() {
    if (lighterState.isIgnited) {
        setIgnited(false);
    } else {
        strikeLighter();
    }
}

// 8. RAYCASTING & INPUT EVENTS
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let pointerDownX = 0;
let pointerDownY = 0;
let pointerDownTime = 0;

window.addEventListener("pointerdown", (event) => {
    pointerDownX = event.clientX;
    pointerDownY = event.clientY;
    pointerDownTime = performance.now();
});

window.addEventListener("pointerup", (event) => {
    const deltaMove = Math.hypot(event.clientX - pointerDownX, event.clientY - pointerDownY);
    const duration = performance.now() - pointerDownTime;

    // Distinguish click from camera orbit drag (< 6px movement and under 600ms)
    if (deltaMove > 6 || duration > 600) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveMeshes, true);

    if (intersects.length > 0) {
        toggleFlame();
    }
});

// Interactive wind draft from pointer movement
const prevMouse = new THREE.Vector2();
const windBreeze = new THREE.Vector3(0, 0, 0);
const targetWind = new THREE.Vector3(0, 0, 0);

window.addEventListener("pointermove", (e) => {
    const currentMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    const currentMouseY = -(e.clientY / window.innerHeight) * 2 + 1;

    const deltaX = (currentMouseX - prevMouse.x) * 2.8;
    const deltaY = (currentMouseY - prevMouse.y) * 2.0;

    targetWind.x = THREE.MathUtils.clamp(targetWind.x + deltaX * 0.4, -0.6, 0.6);
    targetWind.z = THREE.MathUtils.clamp(targetWind.z - deltaY * 0.3, -0.6, 0.6);

    prevMouse.set(currentMouseX, currentMouseY);
});

window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        toggleFlame();
    } else if (e.key === "l" || e.key === "L") {
        toggleLid();
    }
});

// -------------------------------------------------------------
// 9. RESIZE HANDLER
// -------------------------------------------------------------
window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 10. RENDER & ANIMATION LOOP
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Multi-frequency flame flicker
    const f1 = Math.sin(elapsedTime * 14.0 * 1.35);
    const f2 = Math.sin(elapsedTime * 23.3 * 1.35);
    const f3 = Math.cos(elapsedTime * 7.7 * 1.35);
    const rawFlicker = (f1 * 0.45 + f2 * 0.35 + f3 * 0.2) * lighterState.flickerStrength;
    const flickerMultiplier = 1.0 + rawFlicker;

    flameUniforms.uTime.value = elapsedTime;
    glowUniforms.uTime.value = elapsedTime;
    smokeUniforms.uTime.value = elapsedTime;

    glowUniforms.uFlameFlicker.value = flickerMultiplier;

    // Atmospheric breeze
    const naturalBreezeX = Math.sin(elapsedTime * 1.8) * Math.cos(elapsedTime * 0.7) * 0.12;
    const naturalBreezeZ = Math.cos(elapsedTime * 1.4) * Math.sin(elapsedTime * 0.9) * 0.08;
    targetWind.x = THREE.MathUtils.lerp(targetWind.x, naturalBreezeX, 0.04);
    targetWind.z = THREE.MathUtils.lerp(targetWind.z, naturalBreezeZ, 0.04);

    windBreeze.lerp(targetWind, 0.08);
    flameUniforms.uWind.value.copy(windBreeze);
    smokeUniforms.uWind.value.copy(windBreeze);

    if (lighterState.isIgnited) {
        flameLight.intensity = 3.0 * (0.88 + 0.25 * rawFlicker);
        flameLight.position.x = flameAnchor.x + windBreeze.x * 0.2;
        flameLight.position.z = flameAnchor.z + windBreeze.z * 0.2;
    }

    glowMesh.quaternion.copy(camera.quaternion);
    updateSparks(delta);

    controls.update();
    renderer.render(scene, camera);
}

animate();
