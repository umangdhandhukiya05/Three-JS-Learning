import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Shaders
import flameVertexShader from "./shaders/flameVertex.glsl";
import flameFragmentShader from "./shaders/flameFragment.glsl";
import waxVertexShader from "./shaders/waxVertex.glsl";
import waxFragmentShader from "./shaders/waxFragment.glsl";
import glowVertexShader from "./shaders/glowVertex.glsl";
import glowFragmentShader from "./shaders/glowFragment.glsl";
import smokeVertexShader from "./shaders/smokeVertex.glsl";
import smokeFragmentShader from "./shaders/smokeFragment.glsl";
import emberVertexShader from "./shaders/emberVertex.glsl";
import emberFragmentShader from "./shaders/emberFragment.glsl";

// 1. SCENE, CAMERA & RENDERER SETUP
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040509);
scene.fog = new THREE.FogExp2(0x040509, 0.04);

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(0, 2.0, 6.8);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2.5;
controls.maxDistance = 14.0;
controls.maxPolarAngle = Math.PI / 2 + 0.08;
controls.target.set(0, 1.35, 0);

// 2. CANDLE CONFIGURATION & CRIMSON BLOOD WAX
const candleDimensions = {
    radius: 0.9,
    height: 2.8,
    wickHeight: 0.38,
};

const flamePosition = new THREE.Vector3(
    0,
    candleDimensions.height * 0.5 + candleDimensions.wickHeight + 0.32,
    0
);

// Single Color Theme: Crimson Blood
const waxColors = {
    base: "#6b0f1a", // Deep rich crimson blood
    sss: "#e61c2b",  // Vivid scarlet subsurface glow
};

const flameColors = {
    root: "#0d3bd8",   // Sapphire oxygen combustion root
    inner: "#fffce8",  // White-hot plasma core
    outer: "#ff7300",  // Radiant amber mantle
    tip: "#d41f00",    // Crimson flame crest
    aura: "#ff9922",   // Atmospheric golden halo
    light: "#ffaa38",  // Point light color
};

// 3. LIGHTING
const ambientLight = new THREE.AmbientLight(0x182030, 0.4);
scene.add(ambientLight);

// Subtle rim fill light to accentuate Fresnel silhouettes
const rimFillLight = new THREE.DirectionalLight(0x283b5e, 0.65);
rimFillLight.position.set(-6, 8, -6);
scene.add(rimFillLight);

// Dynamic PointLight originating from the candle flame
const candleLight = new THREE.PointLight(
    new THREE.Color(flameColors.light),
    3.8,
    14.0,
    1.8
);
candleLight.position.copy(flamePosition);
candleLight.castShadow = true;
candleLight.shadow.bias = -0.002;
candleLight.shadow.mapSize.width = 1024;
candleLight.shadow.mapSize.height = 1024;
scene.add(candleLight);

// 4. CANDLE BODY (WAX) MESH & SHADERS
const waxUniforms = {
    uTime: { value: 0.0 },
    uWaxColor: { value: new THREE.Color(waxColors.base) },
    uSubsurfaceColor: { value: new THREE.Color(waxColors.sss) },
    uFlamePosition: { value: flamePosition.clone() },
    uFlameFlicker: { value: 1.0 },
    uFresnelPower: { value: 2.8 },
    uSubsurfaceStrength: { value: 1.35 },
    uCandleTopY: { value: candleDimensions.height * 0.5 },
    uCandleHeight: { value: candleDimensions.height },
    uMeltProgress: { value: 0.0 },
    uWaxDripIntensity: { value: 0.14 },
    uExtinguish: { value: 0.0 },

    // Dissolve parameters
    uDissolveProgress: { value: 0.0 },
    uDissolveEdgeColor: { value: new THREE.Color("#ff5500") },
    uDissolveEdgeWidth: { value: 0.06 },
};

// High-resolution cylinder for smooth procedural drips & pool indentation
const waxGeometry = new THREE.CylinderGeometry(
    candleDimensions.radius,
    candleDimensions.radius * 1.04,
    candleDimensions.height,
    128,
    128,
    false
);

const waxMaterial = new THREE.ShaderMaterial({
    vertexShader: waxVertexShader,
    fragmentShader: waxFragmentShader,
    uniforms: waxUniforms,
    side: THREE.FrontSide,
});

const waxMesh = new THREE.Mesh(waxGeometry, waxMaterial);
waxMesh.position.y = candleDimensions.height * 0.5 + 0.15;
waxMesh.castShadow = true;
waxMesh.receiveShadow = true;
scene.add(waxMesh);

// 5. CANDLE WICK & GLOWING EMBER
const wickCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, waxMesh.position.y + candleDimensions.height * 0.5 - 0.08, 0),
    new THREE.Vector3(0.02, waxMesh.position.y + candleDimensions.height * 0.5 + 0.12, 0.01),
    new THREE.Vector3(0.04, waxMesh.position.y + candleDimensions.height * 0.5 + candleDimensions.wickHeight, 0.02),
]);

const wickGeometry = new THREE.TubeGeometry(wickCurve, 32, 0.028, 12, false);
const wickMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.95,
    metalness: 0.05,
});
const wickMesh = new THREE.Mesh(wickGeometry, wickMaterial);
scene.add(wickMesh);

// Glowing ember tip
const emberUniforms = {
    uTime: { value: 0.0 },
    uFlameFlicker: { value: 1.0 },
    uExtinguish: { value: 0.0 },
    uEmberGlow: { value: 1.0 },
};

const emberGeometry = new THREE.SphereGeometry(0.038, 16, 16);
const emberMaterial = new THREE.ShaderMaterial({
    vertexShader: emberVertexShader,
    fragmentShader: emberFragmentShader,
    uniforms: emberUniforms,
});
const emberMesh = new THREE.Mesh(emberGeometry, emberMaterial);
emberMesh.position.copy(wickCurve.getPoint(1.0));
scene.add(emberMesh);

// 6. CANDLE FLAME (PROCEDURAL TEARDROP MESH & SHADERS)
const flameHeight = 1.05;
const flameRadius = 0.32;
const flameGeo = new THREE.CylinderGeometry(
    0.001,
    flameRadius,
    flameHeight,
    64,
    64,
    true
);
flameGeo.translate(0, flameHeight * 0.5, 0);

const flamePosAttr = flameGeo.attributes.position;
for (let i = 0; i < flamePosAttr.count; i++) {
    const y = flamePosAttr.getY(i);
    const normalizedY = y / flameHeight;
    const bulb = Math.sin(Math.pow(normalizedY, 0.65) * Math.PI) * (1.0 - normalizedY * 0.4);
    const radiusMultiplier = Math.max(0.05, bulb);

    flamePosAttr.setX(i, flamePosAttr.getX(i) * radiusMultiplier);
    flamePosAttr.setZ(i, flamePosAttr.getZ(i) * radiusMultiplier);
}
flameGeo.computeVertexNormals();

const flameUniforms = {
    uTime: { value: 0.0 },
    uFlickerSpeed: { value: 1.35 },
    uFlickerStrength: { value: 0.28 },
    uWind: { value: new THREE.Vector3(0, 0, 0) },
    uExtinguish: { value: 0.0 },
    uFlameScale: { value: 1.0 },

    // Palette
    uColorRoot: { value: new THREE.Color(flameColors.root) },
    uColorInner: { value: new THREE.Color(flameColors.inner) },
    uColorOuter: { value: new THREE.Color(flameColors.outer) },
    uColorTip: { value: new THREE.Color(flameColors.tip) },

    // Glow & Dissolve
    uGlowIntensity: { value: 2.1 },
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
flameMesh.position.set(
    emberMesh.position.x,
    emberMesh.position.y - 0.04,
    emberMesh.position.z
);
scene.add(flameMesh);

// 7. ATMOSPHERIC RADIAL GLOW AURA (Soft Natural Halo)
const glowUniforms = {
    uTime: { value: 0.0 },
    uGlowColor: { value: new THREE.Color(flameColors.aura) },
    uGlowIntensity: { value: 0.75 },
    uFlameFlicker: { value: 1.0 },
    uExtinguish: { value: 0.0 },
};

const glowGeometry = new THREE.PlaneGeometry(3.6, 3.6);
const glowMaterial = new THREE.ShaderMaterial({
    vertexShader: glowVertexShader,
    fragmentShader: glowFragmentShader,
    uniforms: glowUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
});

const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
glowMesh.position.set(flameMesh.position.x, flameMesh.position.y + 0.42, flameMesh.position.z);
scene.add(glowMesh);

// 8. PROCEDURAL RISING SMOKE WISPS
const smokeHeight = 4.2;
const smokeUniforms = {
    uTime: { value: 0.0 },
    uSmokeSpeed: { value: 0.85 },
    uSmokeDensity: { value: 0.26 },
    uExtinguish: { value: 0.0 },
    uSmokeColor: { value: new THREE.Color(0xb0b8c8) },
    uWind: { value: new THREE.Vector3(0, 0, 0) },
};

const smokeGroup = new THREE.Group();
const smokeGeo = new THREE.PlaneGeometry(1.6, smokeHeight, 48, 64);
smokeGeo.translate(0, smokeHeight * 0.5, 0);

const smokeMat = new THREE.ShaderMaterial({
    vertexShader: smokeVertexShader,
    fragmentShader: smokeFragmentShader,
    uniforms: smokeUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
});

const smokePlane1 = new THREE.Mesh(smokeGeo, smokeMat);
const smokePlane2 = new THREE.Mesh(smokeGeo, smokeMat);
smokePlane2.rotation.y = Math.PI / 2;
smokeGroup.add(smokePlane1);
smokeGroup.add(smokePlane2);

smokeGroup.position.set(
    flameMesh.position.x,
    flameMesh.position.y + flameHeight * 0.65,
    flameMesh.position.z
);
scene.add(smokeGroup);

// 9. CANDLESTICK PEDESTAL & TABLETOP
const pedestalGroup = new THREE.Group();

const saucerGeo = new THREE.CylinderGeometry(2.3, 2.0, 0.16, 64);
const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x1f1d1b,
    roughness: 0.4,
    metalness: 0.85,
});
const saucerMesh = new THREE.Mesh(saucerGeo, pedestalMat);
saucerMesh.position.y = 0.08;
saucerMesh.receiveShadow = true;
saucerMesh.castShadow = true;
pedestalGroup.add(saucerMesh);

const rimGeo = new THREE.TorusGeometry(2.28, 0.08, 16, 64);
rimGeo.rotateX(Math.PI / 2);
const rimMesh = new THREE.Mesh(rimGeo, pedestalMat);
rimMesh.position.y = 0.16;
pedestalGroup.add(rimMesh);

const collarGeo = new THREE.CylinderGeometry(
    candleDimensions.radius * 1.08,
    candleDimensions.radius * 1.25,
    0.35,
    48
);
const collarMesh = new THREE.Mesh(collarGeo, pedestalMat);
collarMesh.position.y = 0.25;
collarMesh.receiveShadow = true;
collarMesh.castShadow = true;
pedestalGroup.add(collarMesh);

const tableGeo = new THREE.PlaneGeometry(28, 28);
const tableMat = new THREE.MeshStandardMaterial({
    color: 0x090b10,
    roughness: 0.85,
    metalness: 0.1,
});
const tableMesh = new THREE.Mesh(tableGeo, tableMat);
tableMesh.rotation.x = -Math.PI / 2;
tableMesh.position.y = 0.0;
tableMesh.receiveShadow = true;
pedestalGroup.add(tableMesh);

scene.add(pedestalGroup);

// 10. INTERACTIVE MOUSE WIND BREEZE
const mouse = new THREE.Vector2(0, 0);
const prevMouse = new THREE.Vector2(0, 0);
const windBreeze = new THREE.Vector3(0, 0, 0);
const targetWind = new THREE.Vector3(0, 0, 0);

window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    const deltaX = (mouse.x - prevMouse.x) * 3.5;
    const deltaY = (mouse.y - prevMouse.y) * 2.5;

    targetWind.x = THREE.MathUtils.clamp(targetWind.x + deltaX * 0.45, -0.8, 0.8);
    targetWind.z = THREE.MathUtils.clamp(targetWind.z - deltaY * 0.35, -0.8, 0.8);

    prevMouse.copy(mouse);
});

// 11. RESIZE HANDLER
window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 12. ANIMATION & RENDER LOOP (Direct Renderer, No Bloom)
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Natural multi-frequency flame flicker
    const f1 = Math.sin(elapsedTime * 14.0 * 1.35);
    const f2 = Math.sin(elapsedTime * 23.3 * 1.35);
    const f3 = Math.cos(elapsedTime * 7.7 * 1.35);
    const rawFlicker = (f1 * 0.4 + f2 * 0.35 + f3 * 0.25) * 0.28;
    const flickerMultiplier = 1.0 + rawFlicker;

    // Update shader uniforms
    flameUniforms.uTime.value = elapsedTime;
    waxUniforms.uTime.value = elapsedTime;
    glowUniforms.uTime.value = elapsedTime;
    smokeUniforms.uTime.value = elapsedTime;
    emberUniforms.uTime.value = elapsedTime;

    waxUniforms.uFlameFlicker.value = flickerMultiplier;
    glowUniforms.uFlameFlicker.value = flickerMultiplier;
    emberUniforms.uFlameFlicker.value = flickerMultiplier;

    // Atmospheric subtle breeze draft
    const breezeX = Math.sin(elapsedTime * 1.8) * Math.cos(elapsedTime * 0.7) * 0.15;
    const breezeZ = Math.cos(elapsedTime * 1.4) * Math.sin(elapsedTime * 0.9) * 0.1;
    targetWind.x = THREE.MathUtils.lerp(targetWind.x, breezeX, 0.05);
    targetWind.z = THREE.MathUtils.lerp(targetWind.z, breezeZ, 0.05);

    windBreeze.lerp(targetWind, 0.08);
    flameUniforms.uWind.value.copy(windBreeze);
    smokeUniforms.uWind.value.copy(windBreeze);

    // Dynamic flame light intensity modulation
    const baseLight = 3.6;
    candleLight.intensity = baseLight * (0.85 + 0.3 * rawFlicker);
    candleLight.position.x = flameMesh.position.x + windBreeze.x * 0.3;
    candleLight.position.z = flameMesh.position.z + windBreeze.z * 0.3;

    // Billboard glow aura towards camera
    glowMesh.quaternion.copy(camera.quaternion);

    controls.update();

    // Render directly with WebGLRenderer (no bloom pass)
    renderer.render(scene, camera);
}

animate();
