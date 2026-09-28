import * as THREE from "three";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import "./task4.css";
gsap.registerPlugin(Observer);

/* ════════════════════════════════════════════════════════════
   TOPIC 13 – SCROLL-BASED SOLAR SYSTEM VIEWER
   Cinematic: Universe Landing Page + Zoom one by one planet on scroll
   ════════════════════════════════════════════════════════════ */


// ─── 1. TEXTURE LOADER ────────────────────────────────────
const loader = new THREE.TextureLoader();
function loadTex(filename) {
  const tex = loader.load(`/textures/${filename}`);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const TEX = {
  sun: loadTex("sun_color.jpg"),
  mercury: loadTex("mercury_color.jpg"),
  venus: loadTex("venus_color.jpg"),
  earth: loadTex("planet.jpg"),
  mars: loadTex("mars_color.jpg"),
  jupiter: loadTex("jupiter_color.jpg"),
  saturn: loadTex("saturn_color.jpg"),
  uranus: loadTex("uranus_color.jpg"),
  neptune: loadTex("neptune_color.jpg"),
};

// ─── Normal maps (procedural) ─────────────────────────────
function makeNormalMap(w, h, heightFn, scale = 4.0) {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dX = (heightFn(x + 1, y) - heightFn(x - 1, y)) * scale;
      const dY = (heightFn(x, y + 1) - heightFn(x, y - 1)) * scale;
      const len = Math.sqrt(dX * dX + dY * dY + 1);
      const i = (y * w + x) * 4;
      img.data[i] = Math.round((-dX / len * 0.5 + 0.5) * 255);
      img.data[i + 1] = Math.round((-dY / len * 0.5 + 0.5) * 255);
      img.data[i + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

function craterFn(w, h, count = 80, seed = 42) {
  const cr = []; let rng = seed;
  const rand = () => { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return (rng >>> 0) / 0xffffffff; };
  for (let i = 0; i < count; i++) cr.push({ cx: rand() * w, cy: rand() * h, r: 4 + rand() * 20 });
  return (x, y) => {
    let v = 0;
    for (const c of cr) {
      const d = Math.sqrt((x - c.cx) ** 2 + (y - c.cy) ** 2) / c.r;
      if (d < 1.2) v += (d < 0.8 ? -0.4 : 0.3) * (1 - d / 1.2);
    }
    return Math.max(-1, Math.min(1, v));
  };
}
const bandFn = (freq) => (x, y) => Math.sin(y * freq) * 0.25;

const NORM = {
  mercury: makeNormalMap(256, 128, craterFn(256, 128, 80, 7), 5.0),
  mars: makeNormalMap(256, 128, craterFn(256, 128, 50, 13), 4.0),
  earth: makeNormalMap(256, 128, bandFn(0.02), 1.5),
  jupiter: makeNormalMap(256, 128, bandFn(0.12), 2.0),
  saturn: makeNormalMap(256, 128, bandFn(0.10), 1.5),
  neptune: makeNormalMap(256, 128, bandFn(0.08), 2.0),
};

// ─── 2. SOLAR BODIES DATA ─────────────────────────────────
const SOLAR_BODIES = [
  {
    name: "SUN",
    subtitle: "Our Star",
    texKey: "sun",
    normalKey: null,
    visualRadius: 3.4,
    rotSpeed: 0.003,
    roughness: 1.0,
    metalness: 0.0,
    isBasic: true,
    glowR: 255, glowG: 140, glowB: 0,
    bgColor: 0x080300,
    description: "The Sun is the star at the center of our Solar System. Its nuclear fusion converts 620 million tons of hydrogen every second into energy that powers all life on Earth.",
    facts: [
      ["TYPE", "G-type Main-Sequence Star"],
      ["AGE", "4.6 Billion Years"],
      ["SURFACE TEMP", "5,778 K"],
      ["DIAMETER", "1,392,700 km"],
      ["MASS", "1.989 × 10³⁰ kg"],
    ],
  },
  {
    name: "MERCURY",
    subtitle: "The Swift Planet",
    texKey: "mercury",
    normalKey: "mercury",
    visualRadius: 2.1,
    rotSpeed: 0.004,
    roughness: 0.95,
    metalness: 0.05,
    glowR: 140, glowG: 130, glowB: 120,
    bgColor: 0x030303,
    description: "The smallest planet has no atmosphere, leading to extreme temperature swings from −180 °C at night to 430 °C during the day. It completes an orbit in just 88 Earth days.",
    facts: [
      ["TYPE", "Terrestrial Planet"],
      ["ORBIT PERIOD", "88 Earth Days"],
      ["SURFACE TEMP", "−180 °C to 430 °C"],
      ["DIAMETER", "4,879 km"],
      ["DISTANCE", "0.39 AU"],
    ],
  },
  {
    name: "VENUS",
    subtitle: "The Morning Star",
    texKey: "venus",
    normalKey: null,
    visualRadius: 2.5,
    rotSpeed: -0.002,
    roughness: 0.75,
    metalness: 0.0,
    glowR: 200, glowG: 160, glowB: 80,
    bgColor: 0x060300,
    description: "Venus is the hottest planet at 465 °C due to a runaway greenhouse effect caused by its thick CO₂ atmosphere. It rotates backwards — the Sun rises in the west on Venus.",
    facts: [
      ["TYPE", "Terrestrial Planet"],
      ["ORBIT PERIOD", "225 Earth Days"],
      ["SURFACE TEMP", "465 °C"],
      ["DIAMETER", "12,104 km"],
      ["DISTANCE", "0.72 AU"],
    ],
  },
  {
    name: "EARTH",
    subtitle: "The Blue Marble",
    texKey: "earth",
    normalKey: "earth",
    visualRadius: 2.6,
    rotSpeed: 0.008,
    roughness: 0.65,
    metalness: 0.0,
    hasClouds: false,
    glowR: 60, glowG: 100, glowB: 220,
    bgColor: 0x000308,
    description: "Our home is the only known world harboring life. Liquid oceans, a breathable nitrogen-oxygen atmosphere, and a protective magnetic field make Earth uniquely habitable.",
    facts: [
      ["TYPE", "Terrestrial Planet"],
      ["ORBIT PERIOD", "365.25 Days"],
      ["SURFACE TEMP", "−89 °C to 58 °C"],
      ["DIAMETER", "12,742 km"],
      ["DISTANCE", "1.00 AU"],
    ],
  },
  {
    name: "MARS",
    subtitle: "The Red Planet",
    texKey: "mars",
    normalKey: "mars",
    visualRadius: 2.2,
    rotSpeed: 0.009,
    roughness: 0.90,
    metalness: 0.0,
    glowR: 180, glowG: 60, glowB: 20,
    bgColor: 0x060200,
    description: "Mars hosts Olympus Mons — the tallest volcano in the Solar System — and Valles Marineris, a canyon stretching 4,000 km. Ancient riverbeds suggest Mars once had liquid water.",
    facts: [
      ["TYPE", "Terrestrial Planet"],
      ["ORBIT PERIOD", "687 Earth Days"],
      ["SURFACE TEMP", "−125 °C to 20 °C"],
      ["DIAMETER", "6,779 km"],
      ["DISTANCE", "1.52 AU"],
    ],
  },
  {
    name: "JUPITER",
    subtitle: "The Giant King",
    texKey: "jupiter",
    normalKey: "jupiter",
    visualRadius: 3.3,
    rotSpeed: 0.020,
    roughness: 0.70,
    metalness: 0.0,
    glowR: 160, glowG: 120, glowB: 60,
    bgColor: 0x050300,
    description: "The largest planet is a gas giant with no solid surface. Its Great Red Spot is a storm larger than Earth that has raged for over 350 years. It has 95 known moons.",
    facts: [
      ["TYPE", "Gas Giant"],
      ["ORBIT PERIOD", "11.9 Earth Years"],
      ["CLOUD TEMP", "−145 °C"],
      ["DIAMETER", "139,820 km"],
      ["DISTANCE", "5.20 AU"],
    ],
  },
  {
    name: "SATURN",
    subtitle: "Lord of the Rings",
    texKey: "saturn",
    normalKey: "saturn",
    visualRadius: 2.7,
    rotSpeed: 0.016,
    roughness: 0.72,
    metalness: 0.0,
    hasRings: true,
    glowR: 200, glowG: 165, glowB: 70,
    bgColor: 0x050400,
    description: "Saturn's iconic rings span 282,000 km yet are only ~100 m thick — made mostly of ice and rock fragments. It is the least dense planet and would float in water. It has 146 moons.",
    facts: [
      ["TYPE", "Gas Giant"],
      ["ORBIT PERIOD", "29.4 Earth Years"],
      ["CLOUD TEMP", "−178 °C"],
      ["DIAMETER", "116,460 km"],
      ["DISTANCE", "9.58 AU"],
    ],
  },
  {
    name: "URANUS",
    subtitle: "The Ice Giant",
    texKey: "uranus",
    normalKey: null,
    visualRadius: 2.4,
    rotSpeed: -0.010,
    roughness: 0.55,
    metalness: 0.05,
    glowR: 70, glowG: 200, glowB: 220,
    bgColor: 0x000508,
    description: "Uranus rotates on its side with a 98° axial tilt — likely from an ancient collision. Its pale blue-green color comes from methane ice in its atmosphere. It has 28 known moons.",
    facts: [
      ["TYPE", "Ice Giant"],
      ["ORBIT PERIOD", "84 Earth Years"],
      ["CLOUD TEMP", "−224 °C"],
      ["DIAMETER", "50,724 km"],
      ["DISTANCE", "19.2 AU"],
    ],
  },
  {
    name: "NEPTUNE",
    subtitle: "The Windy World",
    texKey: "neptune",
    normalKey: "neptune",
    visualRadius: 2.3,
    rotSpeed: 0.012,
    roughness: 0.60,
    metalness: 0.0,
    glowR: 30, glowG: 80, glowB: 200,
    bgColor: 0x000208,
    description: "The windiest planet, with gusts reaching 2,100 km/h — the fastest in the Solar System. Neptune was predicted mathematically before it was ever observed through a telescope.",
    facts: [
      ["TYPE", "Ice Giant"],
      ["ORBIT PERIOD", "165 Earth Years"],
      ["CLOUD TEMP", "−218 °C"],
      ["DIAMETER", "49,244 km"],
      ["DISTANCE", "30.1 AU"],
    ],
  },
];

// ─── 3. RENDERER / SCENE / CAMERA ─────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02020a);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 20, 36);
camera.lookAt(0, 0, 0);

// ─── 4. LIGHTING ──────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0x111133, 0.55);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xFFF0DD, 2.8);
keyLight.position.set(6, 3, 8);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x223366, 0.35);
fillLight.position.set(-6, -2, -4);
scene.add(fillLight);

// ─── 5. STARFIELD ─────────────────────────────────────────
(function buildStars() {
  const count = 6000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const palette = [[1, 1, 1], [0.85, 0.92, 1], [1, 0.96, 0.75], [1, 0.80, 0.75], [0.75, 0.90, 1]];
  for (let i = 0; i < count; i++) {
    const r = 200 + Math.random() * 600;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    const c = palette[Math.floor(Math.random() * palette.length)];
    const b = 0.5 + Math.random() * 0.5;
    col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.85, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true,
  })));
})();

// ─── 6. PLANET MESHES ─────────────────────────────────────
const sphereGeo = new THREE.SphereGeometry(1, 64, 64);

// Standard (lit) planet
const planetMat = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.0 });
const planetMesh = new THREE.Mesh(sphereGeo, planetMat);
scene.add(planetMesh);

// Sun (unlit / self-illuminated)
const sunMat = new THREE.MeshBasicMaterial();
const sunMesh = new THREE.Mesh(sphereGeo, sunMat);
sunMesh.visible = false;
scene.add(sunMesh);

let activeMesh = sunMesh; // will be set by applyPlanet

// ─── Glow sprite ──────────────────────────────────────────
const glowCanvas = document.createElement("canvas");
glowCanvas.width = glowCanvas.height = 256;
const glowCtx = glowCanvas.getContext("2d");
const glowTex = new THREE.CanvasTexture(glowCanvas);
const glowMat = new THREE.SpriteMaterial({
  map: glowTex,
  blending: THREE.AdditiveBlending,
  transparent: true,
  opacity: 0.8,
  depthWrite: false,
});
const glowSprite = new THREE.Sprite(glowMat);
glowSprite.position.set(0, 0, -0.5);
scene.add(glowSprite);

function setGlowColor(r, g, b, radius, intensity = 0.8) {
  const size = 256, half = size / 2;
  glowCtx.clearRect(0, 0, size, size);
  const grad = glowCtx.createRadialGradient(half, half, size * 0.04, half, half, half);
  grad.addColorStop(0, `rgba(${r},${g},${b},${intensity})`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},${(intensity * 0.35).toFixed(2)})`);
  grad.addColorStop(0.7, `rgba(${r},${g},${b},0.06)`);
  grad.addColorStop(1, `rgba(0,0,0,0)`);
  glowCtx.fillStyle = grad;
  glowCtx.fillRect(0, 0, size, size);
  glowTex.needsUpdate = true;
  glowSprite.scale.set(radius * 2.4, radius * 2.4, 1);
}

// ─── Saturn rings ─────────────────────────────────────────
const ringTex = (() => {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 1;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0.00, "rgba(0,0,0,0)");
  g.addColorStop(0.12, "rgba(180,148,100,0.28)");
  g.addColorStop(0.28, "rgba(215,182,132,0.88)");
  g.addColorStop(0.45, "rgba(232,200,150,0.94)");
  g.addColorStop(0.55, "rgba(205,178,130,0.82)");
  g.addColorStop(0.60, "rgba(10,5,2,0.07)");
  g.addColorStop(0.66, "rgba(195,165,115,0.74)");
  g.addColorStop(0.80, "rgba(170,140,100,0.52)");
  g.addColorStop(0.92, "rgba(130,105,75,0.28)");
  g.addColorStop(1.00, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 1);
  return new THREE.CanvasTexture(c);
})();
const ringInner = 1.38, ringOuter = 2.55;
const ringGeo = new THREE.RingGeometry(ringInner, ringOuter, 96);
{ // Remap UVs radially
  const pos = ringGeo.attributes.position, uv = ringGeo.attributes.uv;
  const v = new THREE.Vector3();
  for (let j = 0; j < pos.count; j++) {
    v.fromBufferAttribute(pos, j);
    uv.setXY(j, (v.length() - ringInner) / (ringOuter - ringInner), 0.5);
  }
  uv.needsUpdate = true;
}
const ringMesh = new THREE.Mesh(ringGeo,
  new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, depthWrite: false }));
ringMesh.rotation.x = Math.PI / 2.15;
ringMesh.visible = false;
scene.add(ringMesh);

// ─── Earth cloud layer ────────────────────────────────────
const cloudTex = (() => {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const ctx = c.getContext("2d");
  for (let i = 0; i < 130; i++) {
    ctx.beginPath();
    ctx.ellipse(Math.random() * 1024, 35 + Math.random() * 442, 42 + Math.random() * 92, 8 + Math.random() * 22, (Math.random() - .5) * .6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${(.32 + Math.random() * .52).toFixed(2)})`;
    ctx.fill();
  }
  for (let y = 0; y < 38; y += 3) {
    const a = (.28 + Math.random() * .38).toFixed(2);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(0, y, 1024, 2);
    ctx.fillRect(0, 512 - y - 2, 1024, 2);
  }
  return new THREE.CanvasTexture(c);
})();
const cloudMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1.035, 64, 64),
  new THREE.MeshStandardMaterial({ map: cloudTex, transparent: true, opacity: 0.68, depthWrite: false })
);
cloudMesh.visible = false;
scene.add(cloudMesh);

// ─── 7. UNIVERSE SOLAR SYSTEM (LANDING PAGE) ──────────────
const universeGroup = new THREE.Group();
scene.add(universeGroup);

// Central Universe Sun
const uniSunGeo = new THREE.SphereGeometry(2.3, 64, 64);
const uniSunMat = new THREE.MeshBasicMaterial({ map: TEX.sun });
const uniSunMesh = new THREE.Mesh(uniSunGeo, uniSunMat);
universeGroup.add(uniSunMesh);

// Central Sun Glow Sprite
const uniGlowMat = new THREE.SpriteMaterial({
  map: glowTex,
  color: 0xffffff,
  transparent: true,
  opacity: 0.95,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const uniGlowSprite = new THREE.Sprite(uniGlowMat);
uniGlowSprite.scale.set(6.8, 6.8, 1);
universeGroup.add(uniGlowSprite);

// Point Light from Universe Sun
const uniSunLight = new THREE.PointLight(0xfffaed, 4.2, 90, 0.4);
universeGroup.add(uniSunLight);

const uniAmbient = new THREE.AmbientLight(0x223355, 0.7);
universeGroup.add(uniAmbient);

// Orbiting Planets configuration
const ORBIT_CONFIGS = [
  { name: "Mercury", dist: 4.8, r: 0.28, speed: 0.024, tex: TEX.mercury, normal: NORM.mercury },
  { name: "Venus", dist: 7.2, r: 0.44, speed: 0.018, tex: TEX.venus, normal: NORM.venus },
  { name: "Earth", dist: 9.8, r: 0.48, speed: 0.013, tex: TEX.earth, normal: NORM.earth },
  { name: "Mars", dist: 12.6, r: 0.35, speed: 0.010, tex: TEX.mars, normal: NORM.mars },
  { name: "Jupiter", dist: 16.8, r: 1.05, speed: 0.006, tex: TEX.jupiter, normal: NORM.jupiter },
  { name: "Saturn", dist: 21.4, r: 0.85, speed: 0.004, tex: TEX.saturn, normal: NORM.saturn, hasRings: true },
  { name: "Uranus", dist: 25.8, r: 0.62, speed: 0.0028, tex: TEX.uranus, normal: null },
  { name: "Neptune", dist: 30.2, r: 0.58, speed: 0.0020, tex: TEX.neptune, normal: NORM.neptune },
];

const orbitingPlanets = [];

ORBIT_CONFIGS.forEach((cfg, idx) => {
  // Orbit Ring Line
  const pts = [];
  const segments = 120;
  for (let s = 0; s <= segments; s++) {
    const theta = (s / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(theta) * cfg.dist, 0, Math.sin(theta) * cfg.dist));
  }
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const orbitMat = new THREE.LineBasicMaterial({
    color: 0x5a8ab8,
    transparent: true,
    opacity: 0.22,
  });
  const orbitLine = new THREE.Line(orbitGeo, orbitMat);
  universeGroup.add(orbitLine);

  // Planet Mesh
  const pGeo = new THREE.SphereGeometry(cfg.r, 32, 32);
  const pMat = new THREE.MeshStandardMaterial({
    map: cfg.tex,
    normalMap: cfg.normal,
    roughness: 0.6,
    metalness: 0.1,
  });
  const pMesh = new THREE.Mesh(pGeo, pMat);

  const angle = (idx / ORBIT_CONFIGS.length) * Math.PI * 2 + Math.random() * 0.5;
  pMesh.position.set(Math.cos(angle) * cfg.dist, 0, Math.sin(angle) * cfg.dist);
  universeGroup.add(pMesh);

  // If Saturn, add mini ring
  if (cfg.hasRings) {
    const sRingGeo = new THREE.RingGeometry(cfg.r * 1.35, cfg.r * 2.4, 64);
    const sRingMat = new THREE.MeshStandardMaterial({
      map: ringTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const sRing = new THREE.Mesh(sRingGeo, sRingMat);
    sRing.rotation.x = Math.PI / 2 + 0.35;
    pMesh.add(sRing);
  }

  orbitingPlanets.push({
    mesh: pMesh,
    dist: cfg.dist,
    speed: cfg.speed,
    angle: angle,
  });
});

// ─── 8. DOM OVERLAY ───────────────────────────────────────
// Landing page hero
const landingHero = document.createElement("div");
landingHero.id = "landing-hero";
landingHero.innerHTML = `
  <h1 class="landing-title">The Solar System</h1>
  <p class="landing-desc">Journey through the celestial architecture of our planetary system. Scroll or click below to explore each world in cinematic detail.</p>
  <div class="landing-actions">
    <button id="start-btn">Explore Planets <span class="btn-arrow">↓</span></button>
  </div>
  <div id="landing-hint">
    <div class="landing-scroll-mouse">
      <div class="mouse-wheel"></div>
    </div>
    <span>Scroll Down To Begin</span>
  </div>
`;
document.body.appendChild(landingHero);

// Planet Detail Overlay
const overlay = document.createElement("div");
overlay.id = "overlay";
overlay.innerHTML = `
  <div id="top-bar">
    <div id="label-group">
      <div id="planet-subtitle"></div>
      <div id="planet-num"></div>
    </div>
    <div id="info-card">
      <div id="planet-description"></div>
      <div id="facts-list"></div>
    </div>
  </div>
  <div id="bottom-bar">
    <div id="planet-name"></div>
    <div id="scroll-hint">
      <div class="scroll-arrow"></div>
      SCROLL
    </div>
  </div>
`;
document.body.appendChild(overlay);

// Vignette
const vigEl = document.createElement("div");
vigEl.id = "vignette";
document.body.appendChild(vigEl);

// Flash
const flashEl = document.createElement("div");
flashEl.id = "flash";
document.body.appendChild(flashEl);

// Progress dots (10 sections: Overview + 9 celestial bodies)
const progressEl = document.createElement("div");
progressEl.id = "progress";
const SECTION_NAMES = ["Overview", ...SOLAR_BODIES.map((b) => b.name)];
SECTION_NAMES.forEach((name, i) => {
  const dot = document.createElement("div");
  dot.className = "dot" + (i === 0 ? " active" : "");
  dot.title = name;
  dot.addEventListener("click", () => {
    if (i !== currentSection && !isTransitioning) {
      const dir = i > currentSection ? 1 : -1;
      goToSection(i, dir);
    }
  });
  progressEl.appendChild(dot);
});
document.body.appendChild(progressEl);

// Element refs
const elName = document.getElementById("planet-name");
const elSubtitle = document.getElementById("planet-subtitle");
const elNum = document.getElementById("planet-num");
const elDesc = document.getElementById("planet-description");
const elFacts = document.getElementById("facts-list");
const elHint = document.getElementById("scroll-hint");
const dots = Array.from(progressEl.querySelectorAll(".dot"));

// ─── 9. STATE & PLANET APPLICATION ────────────────────────
let currentSection = 0; // 0 = Landing Page, 1..9 = Planets (Sun..Neptune)
let currentIndex = 0; // 0 = Sun, 1 = Mercury, etc.
let rotY = 0; // continuous rotation
let isTransitioning = false;

function updateDots(sec) {
  dots.forEach((d, i) => d.classList.toggle("active", i === sec));
}

function applyPlanet(idx) {
  const body = SOLAR_BODIES[idx];

  // Scene background
  scene.background = new THREE.Color(body.bgColor);

  // Glow
  setGlowColor(body.glowR, body.glowG, body.glowB, body.visualRadius, body.isBasic ? 1.0 : 0.55);
  glowSprite.visible = true;

  if (body.isBasic) {
    planetMesh.visible = false;
    sunMesh.visible = true;
    sunMesh.scale.setScalar(body.visualRadius);
    sunMat.map = TEX[body.texKey];
    sunMat.needsUpdate = true;
    activeMesh = sunMesh;
    glowSprite.scale.set(body.visualRadius * 2.6, body.visualRadius * 2.6, 1);
    glowMat.opacity = 0.9;
  } else {
    sunMesh.visible = false;
    planetMesh.visible = true;
    planetMesh.scale.setScalar(body.visualRadius);
    planetMat.map = TEX[body.texKey];
    planetMat.normalMap = body.normalKey ? NORM[body.normalKey] : null;
    planetMat.normalScale.set(1.2, 1.2);
    planetMat.roughness = body.roughness;
    planetMat.metalness = body.metalness;
    planetMat.needsUpdate = true;
    activeMesh = planetMesh;
    glowSprite.scale.set(body.visualRadius * 2.4, body.visualRadius * 2.4, 1);
    glowMat.opacity = 0.45;
  }

  // Current rotation continuity
  activeMesh.rotation.y = rotY;

  // Saturn ring
  ringMesh.visible = !!body.hasRings;
  ringMesh.scale.setScalar(body.hasRings ? body.visualRadius : 1);

  // Earth clouds
  cloudMesh.visible = !!body.hasClouds;
  cloudMesh.scale.setScalar(body.hasClouds ? body.visualRadius : 1);
  if (body.hasClouds) cloudMesh.rotation.y = rotY * 0.9;

  // Update HTML
  elName.textContent = body.name;
  elSubtitle.textContent = body.subtitle.toUpperCase();
  elNum.textContent = `${String(idx + 1).padStart(2, "0")} — ${String(SOLAR_BODIES.length).padStart(2, "0")}`;
  elDesc.textContent = body.description;
  elFacts.innerHTML = body.facts.map(([l, v]) =>
    `<div class="fact-row"><span class="fact-label">${l}</span><span class="fact-value">${v}</span></div>`
  ).join("");

  // Scroll hint clickable to advance (hidden only on final planet)
  elHint.style.opacity = idx < SOLAR_BODIES.length - 1 ? "1" : "0";
  elHint.onclick = () => {
    if (currentSection < SOLAR_BODIES.length && !isTransitioning) {
      goToSection(currentSection + 1, 1);
    }
  };
}

// ─── 10. SECTION & PLANET SWITCHING ───────────────────────
function switchToPlanet(newIdx, direction = 1) {
  if (newIdx === currentIndex || isTransitioning) return;
  if (newIdx < 0 || newIdx >= SOLAR_BODIES.length) return;

  isTransitioning = true;
  const targetBody = SOLAR_BODIES[newIdx];
  const targetR = targetBody.visualRadius;

  const tl = gsap.timeline({
    onComplete: () => {
      setTimeout(() => {
        isTransitioning = false;
      }, 150);
    },
  });

  // 1. Current planet zoom transition (forward = zooms toward camera, back = zooms away)
  const exitScale = direction > 0 ? activeMesh.scale.x * 1.55 : activeMesh.scale.x * 0.45;
  tl.to(activeMesh.scale, {
    x: exitScale,
    y: exitScale,
    z: exitScale,
    duration: 0.35,
    ease: "power2.in",
  }, 0);

  tl.to(flashEl, { opacity: 1, duration: 0.22, ease: "power2.in" }, 0.08);

  tl.to([elName, "#info-card", "#label-group"], {
    opacity: 0,
    y: direction > 0 ? -25 : 25,
    duration: 0.22,
    ease: "power2.in",
  }, 0);

  // 2. Midpoint: swap planet
  tl.call(() => {
    currentIndex = newIdx;
    applyPlanet(newIdx);

    const enterStartScale = direction > 0 ? targetR * 0.38 : targetR * 1.65;
    activeMesh.scale.setScalar(enterStartScale);

    gsap.to(activeMesh.scale, {
      x: targetR,
      y: targetR,
      z: targetR,
      duration: 0.75,
      ease: "power3.out",
      overwrite: true,
    });

    gsap.fromTo(elName,
      { opacity: 0, y: direction > 0 ? 48 : -48 },
      { opacity: 1, y: 0, duration: 0.65, ease: "power3.out", delay: 0.08 }
    );
    gsap.fromTo("#label-group",
      { opacity: 0, y: direction > 0 ? 15 : -15 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.08 }
    );
    gsap.fromTo("#info-card",
      { opacity: 0, x: 45 },
      { opacity: 1, x: 0, duration: 0.65, ease: "power3.out", delay: 0.15 }
    );
  });

  tl.to(flashEl, { opacity: 0, duration: 0.38, ease: "power2.out" });
}

function goToSection(newSec, direction = 1) {
  if (newSec === currentSection || isTransitioning) return;
  if (newSec < 0 || newSec > SOLAR_BODIES.length) return;

  const oldSec = currentSection;

  if (oldSec === 0 && newSec >= 1) {
    // ✦ Landing Page -> Planet Overview (Zoom into Sun or chosen planet)
    isTransitioning = true;
    const planetIdx = newSec - 1;
    currentSection = newSec;
    currentIndex = planetIdx;
    updateDots(newSec);

    // Fade landing UI out
    gsap.to("#landing-hero", { opacity: 0, y: -45, duration: 0.5, ease: "power2.in" });

    // Swoop camera down towards center
    gsap.to(camera.position, {
      x: 0,
      y: 0,
      z: 9,
      duration: 1.25,
      ease: "power3.inOut",
      onUpdate: () => camera.lookAt(0, 0, 0),
    });

    // Flash transition midpoint
    gsap.timeline({ delay: 0.5 })
      .to(flashEl, { opacity: 0.85, duration: 0.28, ease: "power2.in" })
      .call(() => {
        universeGroup.visible = false;
        applyPlanet(planetIdx);
        overlay.style.opacity = "1";
        overlay.style.pointerEvents = "auto";

        const r = SOLAR_BODIES[planetIdx].visualRadius;
        activeMesh.scale.setScalar(r * 0.42);
        gsap.to(activeMesh.scale, {
          x: r,
          y: r,
          z: r,
          duration: 0.85,
          ease: "power3.out",
          overwrite: true,
        });

        gsap.fromTo(elName,
          { opacity: 0, y: 48 },
          { opacity: 1, y: 0, duration: 0.65, ease: "power3.out", delay: 0.08 }
        );
        gsap.fromTo("#label-group",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.08 }
        );
        gsap.fromTo("#info-card",
          { opacity: 0, x: 45 },
          { opacity: 1, x: 0, duration: 0.65, ease: "power3.out", delay: 0.15 }
        );
      })
      .to(flashEl, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
        onComplete: () => {
          setTimeout(() => {
            isTransitioning = false;
          }, 120);
        },
      });

  } else if (oldSec >= 1 && newSec === 0) {
    // ✦ Planet Overview -> Universe Landing Page
    isTransitioning = true;
    currentSection = 0;
    updateDots(0);

    gsap.to([elName, "#info-card", "#label-group"], {
      opacity: 0,
      y: 25,
      duration: 0.32,
      ease: "power2.in",
    });

    gsap.timeline({ delay: 0.1 })
      .to(flashEl, { opacity: 0.85, duration: 0.28, ease: "power2.in" })
      .call(() => {
        overlay.style.opacity = "0";
        overlay.style.pointerEvents = "none";
        planetMesh.visible = false;
        sunMesh.visible = false;
        ringMesh.visible = false;
        cloudMesh.visible = false;
        glowSprite.visible = false;
        universeGroup.visible = true;
        scene.background = new THREE.Color(0x02020a);

        gsap.to(camera.position, {
          x: 0,
          y: 20,
          z: 36,
          duration: 1.25,
          ease: "power3.out",
          onUpdate: () => camera.lookAt(0, 0, 0),
        });

        gsap.fromTo("#landing-hero",
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.75, ease: "power3.out", delay: 0.15 }
        );
      })
      .to(flashEl, {
        opacity: 0,
        duration: 0.45,
        ease: "power2.out",
        onComplete: () => {
          setTimeout(() => {
            isTransitioning = false;
          }, 120);
        },
      });

  } else {
    // ✦ Planet to Planet (both >= 1)
    currentSection = newSec;
    const planetIdx = newSec - 1;
    updateDots(newSec);
    switchToPlanet(planetIdx, direction);
  }
}

function nextSection() {
  if (currentSection < SOLAR_BODIES.length && !isTransitioning) {
    goToSection(currentSection + 1, 1);
  }
}

function prevSection() {
  if (currentSection > 0 && !isTransitioning) {
    goToSection(currentSection - 1, -1);
  }
}

// ─── 11. CONTROLS & PARALLAX ──────────────────────────────
let lastScrollTime = 0;
let mouseX = 0, mouseY = 0;

window.addEventListener("mousemove", (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

// Direct Mouse Wheel Listener
window.addEventListener("wheel", (e) => {
  const now = Date.now();
  if (isTransitioning || now - lastScrollTime < 650) return;
  if (Math.abs(e.deltaY) < 18) return;

  lastScrollTime = now;
  if (e.deltaY > 0) {
    nextSection();
  } else {
    prevSection();
  }
}, { passive: true });

// GSAP Observer for touch and gestures
Observer.create({
  type: "wheel,touch",
  wheelSpeed: 1,
  tolerance: 20,
  preventDefault: false,
  onDown: () => {
    const now = Date.now();
    if (!isTransitioning && now - lastScrollTime > 650) {
      lastScrollTime = now;
      nextSection();
    }
  },
  onUp: () => {
    const now = Date.now();
    if (!isTransitioning && now - lastScrollTime > 650) {
      lastScrollTime = now;
      prevSection();
    }
  },
});

// Keyboard navigation
window.addEventListener("keydown", (e) => {
  if (isTransitioning) return;
  if (["ArrowDown", "PageDown", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
    nextSection();
  } else if (["ArrowUp", "PageUp", "ArrowLeft"].includes(e.key)) {
    e.preventDefault();
    prevSection();
  }
});

// Touch swipe navigation
let touchStartY = 0;
window.addEventListener("touchstart", (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener("touchend", (e) => {
  if (isTransitioning) return;
  const delta = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(delta) > 40) {
    if (delta > 0) nextSection();
    else prevSection();
  }
}, { passive: true });

// Button and Hint clicks
document.getElementById("start-btn").addEventListener("click", () => {
  goToSection(1, 1);
});

document.getElementById("landing-hint").addEventListener("click", () => {
  goToSection(1, 1);
});

// Initial Landing View Setup
planetMesh.visible = false;
sunMesh.visible = false;
ringMesh.visible = false;
cloudMesh.visible = false;
glowSprite.visible = false;
universeGroup.visible = true;

// Landing page entrance animation
gsap.from(".landing-title", { opacity: 0, y: 35, duration: 1.0, delay: 0.25, ease: "power3.out" });
gsap.from(".landing-desc", { opacity: 0, y: 25, duration: 0.9, delay: 0.5, ease: "power3.out" });
gsap.from(".landing-actions", { opacity: 0, scale: 0.9, duration: 0.8, delay: 0.65, ease: "back.out(1.5)" });
gsap.from("#landing-hint", { opacity: 0, y: 15, duration: 1.0, delay: 0.85 });

// ─── 12. ANIMATION LOOP ───────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  if (currentSection === 0) {
    // Parallax on landing page
    camera.position.x += (mouseX * 5 - camera.position.x) * 0.035;
    camera.position.y += (20 + mouseY * -4 - camera.position.y) * 0.035;
    camera.lookAt(0, 0, 0);

    // Orbit universe planets
    orbitingPlanets.forEach((p) => {
      p.angle += p.speed;
      p.mesh.position.x = Math.cos(p.angle) * p.dist;
      p.mesh.position.z = Math.sin(p.angle) * p.dist;
      p.mesh.rotation.y += 0.02;
    });

    // Pulse central universe sun
    uniSunMesh.rotation.y += 0.005;
    const pulse = 1 + Math.sin(elapsed * 1.8) * 0.012;
    uniSunMesh.scale.setScalar(2.3 * pulse);
    uniGlowSprite.scale.set(6.8 * pulse, 6.8 * pulse, 1);
  } else {
    // Planet showcase mode
    const body = SOLAR_BODIES[currentIndex];
    rotY += body.rotSpeed;
    activeMesh.rotation.y = rotY;

    // Sun corona pulse
    if (body.isBasic) {
      const pulse = 1 + Math.sin(elapsed * 1.8) * 0.009;
      if (!isTransitioning) {
        sunMesh.scale.setScalar(body.visualRadius * pulse);
      }
      glowMat.opacity = 0.75 + Math.sin(elapsed * 1.4) * 0.12;
      glowSprite.scale.set(
        body.visualRadius * (2.5 + Math.sin(elapsed * 0.9) * 0.05),
        body.visualRadius * (2.5 + Math.sin(elapsed * 0.9) * 0.05),
        1
      );
    }
  }

  renderer.render(scene, camera);
}
animate();

// ─── 13. RESIZE ───────────────────────────────────────────
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
