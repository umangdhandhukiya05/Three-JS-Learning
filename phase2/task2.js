import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader.js";

// 1. SCENE, CAMERA & RENDERER SETUP

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b14);
scene.fog = new THREE.FogExp2(0x070b14, 0.025);

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 5, 12);

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
dirLight.position.set(10, 15, 10);
scene.add(dirLight);

// Floating cyber particles
const particleCount = 400;
const particleGeo = new THREE.BufferGeometry();
const particlePos = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i += 3) {
    particlePos[i] = (Math.random() - 0.5) * 40;
    particlePos[i + 1] = (Math.random() - 0.5) * 20;
    particlePos[i + 2] = (Math.random() - 0.5) * 40;
}
particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.12, transparent: true, opacity: 0.5 })
);
scene.add(particles);

// 2. TOPIC 9: ADVANCED MATERIALS & SHADERS (DODECAHEDRON)

/**
 * Custom Vertex Shader:
 * - Computes procedural wave displacement along normal vectors using sin & cos functions.
 * - Passes normal, view direction, and elevation to the fragment shader via varyings.
 */
const vertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vElevation;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    // Procedural wave distortion along vertex normal
    float elevation = sin(position.x * 2.5 + uTime * 2.2) *
                      cos(position.y * 2.5 + uTime * 1.8) *
                      sin(position.z * 2.5 + uTime * 1.2) * 0.9;

    vec3 displaced = position + normal * elevation;
    vElevation = elevation;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * Custom Fragment Shader:
 * - Dynamic color gradient based on vertex elevation.
 * - Angle-dependent Fresnel rim glow for futuristic silhouette illumination.
 */
const fragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vElevation;

  void main() {
    // 1. Dynamic elevation color gradient (Cyan to Deep Midnight Blue)
    vec3 colorCyan = vec3(1, 0, 0);
    vec3 colorBlue = vec3(0, 0, 0);
    vec3 baseColor = mix(colorBlue, colorCyan, vElevation * 2.2 + 0.5);

    // 2. Fresnel Rim Glow (Intense glow along silhouette edges)
    vec3 viewDir = normalize(vViewPosition);
    vec3 normalVec = normalize(vNormal);
    float fresnel = pow(1.0 - max(dot(viewDir, normalVec), 0.0), 3.0);
    vec3 rimColor = vec3(1.0, 1.0, 0.0); //yellow

    vec3 finalColor = mix(baseColor, rimColor, fresnel * 0.1);
    gl_FragColor = vec4(finalColor, 0.95);
  }
`;

const uniforms = {
    uTime: { value: 0 },
};

const dodecahedronMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
    transparent: true,
    side: THREE.DoubleSide,
});

// Single Central Object: Dodecahedron
const dodecahedronGeo = new THREE.DodecahedronGeometry(2.4, 3);
const dodecahedron = new THREE.Mesh(dodecahedronGeo, dodecahedronMaterial);
dodecahedron.position.set(0, 0, 0);
scene.add(dodecahedron);

// WATER OBJECT (Custom ShaderMaterial with wave distortion & procedural caustics)
const waterVertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vWaveElevation;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Multi-octave wave displacement simulating rippling water surface
    float wave1 = sin(pos.x * 2.2 + uTime * 2.5) * 0.1;
    float wave2 = cos(pos.y * 2.2 + uTime * 2.0) * 0.1;
    float wave3 = sin((pos.x + pos.y) * 1.6 + uTime * 1.4) * 0.01;
    float totalWave = wave1 + wave2 + wave3;

    pos.z += totalWave;
    vWaveElevation = totalWave;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const waterFragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vWaveElevation;

  void main() {
    // Circular pond mask
    float dist = length(vUv - 0.5) * 2.0;
    if (dist > 1.0) discard;

    // Procedural caustic light shimmer
    float caustic = sin(vWorldPos.x * 3.5 + uTime * 2.0) * cos(vWorldPos.z * 3.5 + uTime * 1.8);
    caustic = pow(max(0.0, caustic), 3.0) * 1.4;

    // Water depth gradient (Deep Ocean to Electric Cyan)
    vec3 deepWater = vec3(0.02, 0.08, 0.22);
    vec3 surfaceWater = vec3(0.0, 0.85, 1.0);
    vec3 waterColor = mix(deepWater, surfaceWater, dist * 0.7 + vWaveElevation * 1.5 + 0.3);
    waterColor += vec3(caustic);

    // Glowing border rim that triggers UnrealBloomPass
    float border = smoothstep(0.88, 1.0, dist);
    waterColor += vec3(0.0, 0.95, 1.0) * border * 2.8;

    gl_FragColor = vec4(waterColor, 0.88);
  }
`;

const waterUniforms = {
    uTime: { value: 0 },
};

const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    uniforms: waterUniforms,
    transparent: true,
    side: THREE.DoubleSide,
});

const waterGeo = new THREE.PlaneGeometry(12, 12, 64, 64);
const waterPool = new THREE.Mesh(waterGeo, waterMaterial);
waterPool.rotation.x = -Math.PI / 2;
waterPool.position.set(0, -3.1, 0);
scene.add(waterPool);

// 3. TOPIC 8: POST-PROCESSING EFFECTS PIPELINE
const composer = new EffectComposer(renderer);

//Render Pass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Unreal Bloom Pass (Produces glow on Fresnel rim and shader highlights)
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.05,  // Strength
    0.2,  // Radius
    1  // Threshold
);
composer.addPass(bloomPass);

// Outline Pass (Screen-space highlighting on mouse hover)
const outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera
);
outlinePass.edgeStrength = 4.0;
outlinePass.edgeGlow = 1.0;
outlinePass.visibleEdgeColor.set(0x00f0ff);
outlinePass.hiddenEdgeColor.set(0xff00aa);
composer.addPass(outlinePass);

// Vignette Pass (Screen-space corner darkening)
const vignettePass = new ShaderPass(VignetteShader);
vignettePass.uniforms["offset"].value = 1.05;
vignettePass.uniforms["darkness"].value = 1.35;
composer.addPass(vignettePass);

// Output Pass (sRGB & Tone Mapping)
const outputPass = new OutputPass();
composer.addPass(outputPass);

// 4. MOUSE RAYCASTING FOR HOVER OUTLINE
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-999, -999);

window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

function handleRaycast() {
    raycaster.setFromCamera(mouse, camera);
    const targets = waterPool.visible ? [dodecahedron, waterPool] : [dodecahedron];
    const intersects = raycaster.intersectObjects(targets);

    if (intersects.length > 0) {
        outlinePass.selectedObjects = [intersects[0].object];
        document.body.style.cursor = "pointer";
    } else {
        outlinePass.selectedObjects = [];
        document.body.style.cursor = "default";
    }
}

// 5. BOTTOM TOGGLE BAR EVENT LISTENERS
const btnBloom = document.getElementById("btn-bloom");
const btnVignette = document.getElementById("btn-vignette");
const btnOutline = document.getElementById("btn-outline");
const btnWater = document.getElementById("btn-water");

// Toggle Bloom
let isBloomOn = true;
if (btnBloom) {
    btnBloom.addEventListener("click", () => {
        isBloomOn = !isBloomOn;
        bloomPass.enabled = isBloomOn;
        btnBloom.textContent = isBloomOn ? "Bloom: ON" : "Bloom: OFF";
        btnBloom.classList.toggle("active", isBloomOn);
    });
}

// Toggle Vignette
let isVignetteOn = true;
if (btnVignette) {
    btnVignette.addEventListener("click", () => {
        isVignetteOn = !isVignetteOn;
        vignettePass.enabled = isVignetteOn;
        btnVignette.textContent = isVignetteOn ? "Vignette: ON" : "Vignette: OFF";
        btnVignette.classList.toggle("active", isVignetteOn);
    });
}

// Toggle Outline
let isOutlineOn = true;
if (btnOutline) {
    btnOutline.addEventListener("click", () => {
        isOutlineOn = !isOutlineOn;
        outlinePass.enabled = isOutlineOn;
        btnOutline.textContent = isOutlineOn ? "Outline: ON" : "Outline: OFF";
        btnOutline.classList.toggle("active", isOutlineOn);
    });
}

// Toggle Water Object
let isWaterOn = true;
if (btnWater) {
    btnWater.addEventListener("click", () => {
        isWaterOn = !isWaterOn;
        waterPool.visible = isWaterOn;
        btnWater.textContent = isWaterOn ? "Water: ON" : "Water: OFF";
        btnWater.classList.toggle("active", isWaterOn);
    });
}

// 6. ANIMATION & RENDER LOOP
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Update shader time uniforms
    uniforms.uTime.value = elapsedTime;
    waterUniforms.uTime.value = elapsedTime;

    // Rotate Dodecahedron
    dodecahedron.rotation.y = elapsedTime * 0.35;
    dodecahedron.rotation.x = elapsedTime * 0.2;

    particles.rotation.y = elapsedTime * 0.03;

    // Raycasting for outline
    handleRaycast();

    // Controls & Post-Processing Render
    controls.update();
    composer.render();
}

animate();

// Window Resize Handler
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});
