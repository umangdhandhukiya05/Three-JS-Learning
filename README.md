# Three.js Learning Journey 🚀

A structured, task-by-task exploration of 3D web graphics using **Three.js** and **Vite**. This repository covers foundational 3D concepts, scene setups, lighting configurations, helpers, geometry types, and material shaders.

---

## 🛠️ Tech Stack

- **Three.js** (`^0.186.0`) – 3D library for WebGL rendering
- **Vite** (`^8.3.0`) – Fast build tool and local development server
- **JavaScript (ES Modules)** – Modern ES6+ syntax

---

## 🚀 Getting Started

### 1. Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### 2. Run Local Development Server

```bash
npm run dev
```

Visit the local URL shown in your terminal (typically `http://localhost:5173`).

### 🔹 Task 1: Basic Three.js Setup & Fundamentals ([phase1/task1.js](file:///Users/ztlab135/Desktop/threeJS%20learning/phase1/task1.js))

A foundational 3D scene demonstrating the core anatomy of Three.js.

- **Scene & Camera:** Initialization of `THREE.Scene` and `THREE.PerspectiveCamera`.
- **Mesh Creation:** Creating 3D cubes using `BoxGeometry` and `MeshStandardMaterial`.
- **Lighting:** Adding `AmbientLight` (soft ambient illumination) and `DirectionalLight` (directional sun-like rays).
- **OrbitControls:** Interactive camera navigation with smooth damping (`enableDamping: true`).
- **Animation Loop:** Using `requestAnimationFrame` to animate multiple cube rotations.
- **Window Resize Handling:** Dynamically updating camera aspect ratio and renderer size.

---

### 🔹 Task 2: 4-Corner Lighting Setup & Dev Helpers ([phase1/task2.js](file:///Users/ztlab135/Desktop/threeJS%20learning/phase1/task2.js))

Focuses on advanced spatial lighting, time-based animation, and developer debugging tools.

- **Central Subject:** Centered sphere using `SphereGeometry` and `MeshStandardMaterial`.
- **4-Corner Lighting System:** Four `DirectionalLight` sources positioned at all four corners of the scene for 360° balanced illumination.
- **Dev Tools & Helpers:**
  - `DirectionalLightHelper` for visualizing light source positions and directions.
  - `AxesHelper` for 3D coordinate space orientation (Red = X, Green = Y, Blue = Z).
  - `GridHelper` for floor plane alignment and distance reference.
- **Time-based Animation:** `THREE.Clock` to drive smooth, frame-rate-independent object rotation.

---

### 🔹 Task 3: Geometries & Materials Showcase ([phase1/task3.js](file:///Users/ztlab135/Desktop/threeJS%20learning/phase1/task3.js))

A comprehensive 3D room showcase demonstrating various geometry types and material properties.

#### 1. Geometries Covered:
- **`BoxGeometry`**: 3D cube with transparency and roughness.
- **`SphereGeometry`**: Smooth sphere with specular highlight reflections.
- **`CylinderGeometry`**: Metallic cylinder.
- **`ConeGeometry`**: Cone with physical clearcoat coating.
- **`TorusGeometry`**: Transparent cyan donut.
- **`BufferGeometry`**: Custom octahedron constructed from raw vertex float coordinates and computed surface normals.
- **`PlaneGeometry`**: Double-sided planes arranged into a 3D stage/room (floor and enclosing walls).

#### 2. Materials & Properties Covered:
- **`MeshBasicMaterial`**: Unlit material (ignores scene lights), supports color, opacity, and `THREE.DoubleSide`.
- **`MeshStandardMaterial`**: Physically based rendering (PBR) with `roughness`, `metalness`, and opacity.
- **`MeshPhongMaterial`**: Shiny surface with `shininess` and `specular` highlight control.
- **`MeshPhysicalMaterial`**: Advanced PBR material supporting `clearcoat` and `clearcoatRoughness`.
- **`wireframe: true`**: Visualizing underlying polygon mesh tessellation.

---

## 📖 Topics & Concepts Reference

| Topic | Three.js Classes / Concepts Used |
| :--- | :--- |
| **Core Architecture** | `THREE.Scene`, `THREE.PerspectiveCamera`, `THREE.WebGLRenderer`, `requestAnimationFrame` |
| **Geometries** | `BoxGeometry`, `SphereGeometry`, `CylinderGeometry`, `ConeGeometry`, `TorusGeometry`, `BufferGeometry`, `PlaneGeometry` |
| **Custom Vertices** | `BufferGeometry`, `BufferAttribute`, `computeVertexNormals` |
| **Materials** | `MeshBasicMaterial`, `MeshStandardMaterial`, `MeshPhongMaterial`, `MeshPhysicalMaterial` |
| **Material Attributes** | `color`, `roughness`, `metalness`, `shininess`, `specular`, `clearcoat`, `clearcoatRoughness`, `transparent`, `opacity`, `wireframe`, `side: THREE.DoubleSide` |
| **Lighting** | `AmbientLight`, `DirectionalLight` (4-corner setup) |
| **Helpers & Debugging** | `DirectionalLightHelper`, `AxesHelper`, `GridHelper` |
| **Camera Controls** | `OrbitControls` with `dampingFactor` |
| **Animation & Timing** | `THREE.Clock` (`getElapsedTime()`), rotation on X, Y, Z axes |
| **Responsiveness** | `window.addEventListener('resize')`, `camera.updateProjectionMatrix()`, `renderer.setPixelRatio` |

---

## 📁 Project Structure

```
threeJS learning/
├── index.html        # Entry HTML linking the active task script
├── style.css         # Reset styling and full-screen canvas layout
├── package.json      # Dependencies and run scripts
├── phase1/
│   ├── task1.js      # Task 1: Basic Three.js setup & rotation
│   ├── task2.js      # Task 2: 4-Corner lights, helpers & sphere
│   └── task3.js      # Task 3: Geometries & materials showcase room
└── README.md         # Documentation and guide
```
