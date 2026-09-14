# Three.js Learning Journey & Texture Laboratory 🚀

A structured, production-focused exploration of 3D graphics using **Three.js**, **Vite**, and **lil-gui**.

---

## 🛠️ Tech Stack

- **Three.js** (`^0.186.0`) – 3D WebGL rendering engine
- **lil-gui** (`^0.20.0`) – Floating inspector and controller GUI
- **Vite** (`^8.3.0`) – Development server & build pipeline
- **JavaScript (ES Modules)** – Pure modern ES6+ (No React/R3F required)

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🔬 3D Product Showcase & Texture Laboratory ([main.js](file:///Users/ztlab135/Desktop/threeJS%20learning/main.js))

An interactive 3D laboratory covering all 26 texture concepts:

### Objects Included in the Laboratory:
1. **Wooden Crate:** Full PBR setup (`map`, `normalMap`, `roughnessMap`, `aoMap`).
2. **Brick Wall:** Height / Displacement mapping (`displacementMap`, `displacementScale`) on subdivided geometry.
3. **Brushed Metal Sphere:** High metalness conductor with low roughness anisotropic streaks.
4. **Rough Concrete Floor:** Large tiled surface demonstrating `repeat.set(10, 10)`, `wrapS/T = RepeatWrapping`, and mipmaps.
5. **Sci-Fi Planet Sphere:** Spherical equirectangular UV mapping.
6. **Refractive Crystal:** Physical glass transmission (`MeshPhysicalMaterial`) demonstrating when **Material-Only** is better than textures.
7. **Texture Atlas Cube:** 4 sub-textures packed into a single $2\times2$ image to reduce draw calls.
8. **Luxury Timepiece (Watch):** Production-ready multi-mesh product combining brushed steel, gold bezel, sunray dial face, sapphire crystal, and leather band.

---

## 📚 Complete 26-Part Texture Topics Covered

| Part | Topic | Explanation & Three.js Implementation |
| :--- | :--- | :--- |
| **1** | **TextureLoader** | Image $\to$ `TextureLoader` $\to$ `THREE.Texture` $\to$ `Material` $\to$ `Mesh`. |
| **2** | **UV Mapping** | How 2D coordinates $(u, v) \in [0, 1]$ wrap onto 3D vertices across Box, Sphere, Plane, Cylinder geometries. |
| **3** | **Base Color Map** | `material.map`: Multiplied with `material.color`. Configured with `THREE.SRGBColorSpace`. |
| **4** | **Texture Repeat** | `texture.repeat.set(x, y)`: Repeats high-res small tiles over large floors rather than huge monolithic images. |
| **5** | **Texture Wrapping** | `THREE.ClampToEdgeWrapping`, `THREE.RepeatWrapping`, `THREE.MirroredRepeatWrapping`. |
| **6** | **Texture Offset** | `texture.offset.set(u, v)`: Shifts texture along UV space (conveyor belts, scrolling UI). |
| **7** | **Texture Rotation** | `texture.rotation` & `texture.center.set(0.5, 0.5)`: Rotates texture around specified pivot in radians. |
| **8** | **Normal Map** | `material.normalMap`: Perturbs surface normals in tangent space to simulate bumps without extra polygons. |
| **9** | **Roughness Map** | `material.roughnessMap`: Grayscale map (Black = 0.0 glossy reflection, White = 1.0 matte diffuse). |
| **10** | **Metalness Map** | `material.metalnessMap`: Grayscale map (White = 1.0 metal conductor, Black = 0.0 dielectric insulator). |
| **11** | **AO Map** | `material.aoMap`: Darkens contact crevices and corners. Requires `geometry.attributes.uv2`. |
| **12** | **Displacement Map** | `material.displacementMap`: Physically displaces vertices in 3D space. Requires high vertex density. |
| **13** | **Texture Filtering** | `minFilter` (when texture is smaller than pixels) & `magFilter` (`LinearFilter` vs `NearestFilter`). |
| **14** | **Mipmaps** | Automatically generated downscaled texture pyramid $(1/2, 1/4, 1/8)$ preventing aliasing at distance. |
| **15** | **Image Formats** | Comparison of JPG (compressed, no alpha), PNG (lossless, alpha), WebP/AVIF (modern web), and KTX2/Basis (GPU VRAM compressed). |
| **16** | **Color Space** | `SRGBColorSpace` for color/albedo maps, `NoColorSpace` (Linear) for data maps (Normal, Roughness, AO). |
| **17** | **PBR Workflow** | Combining Base Color + Normal + Roughness + Metalness + AO for photorealistic lighting interaction. |
| **18** | **Texture Reuse** | Reusing a single `THREE.Texture` instance across multiple materials to conserve VRAM. |
| **19** | **Texture Atlas** | Merging multiple sub-textures into one image to batch geometry and minimize WebGL draw calls. |
| **20** | **Texture Resolution** | Matching power-of-two resolutions ($512, 1024, 2048$) to camera distance and screen pixel density. |
| **21** | **Memory & Disposal** | Calling `texture.dispose()` to prevent memory leaks in Single Page Applications. |
| **22** | **LoadingManager** | Tracking `onStart`, `onProgress`, `onLoad`, `onError` for unified loading screens. |
| **23** | **Interactive GUI** | Live slider control for Repeat, Offset, Rotation, Normal Scale, Displacement Scale, and Filtering. |
| **24** | **Production Example** | Premium luxury watch model simulating real e-commerce 3D product configurators. |
| **25** | **Material vs Texture** | Trade-offs of procedural/uniform shaders vs heavy texture downloads. |
| **26** | **Learning Inspector** | Raycaster click selection HUD with real-time map toggle buttons. |

---

## 📦 How to Download & Add Real PBR Textures

If you wish to use downloaded real-world photographic PBR textures:

1. **Free Recommended Sources:**
   - [AmbientCG](https://ambientcg.com/) (Free CC0 textures)
   - [Poly Haven](https://polyhaven.com/textures) (Free CC0 PBR textures)
2. **Download 1K or 2K PBR Sets (JPG or PNG)** containing:
   - `*_Color.jpg` (or `*_Albedo.jpg`)
   - `*_NormalGL.jpg` (DirectX vs OpenGL normal - Three.js uses OpenGL)
   - `*_Roughness.jpg`
   - `*_Metalness.jpg` (if metal)
   - `*_AO.jpg` (or `*_AmbientOcclusion.jpg`)
   - `*_Displacement.jpg` (or `*_Height.jpg`)
3. **Where to Place Files:**
   Create a `/public/textures/` folder in your project root:
   ```text
   threeJS learning/
   └── public/
       └── textures/
           ├── wood/
           │   ├── wood_color.jpg
           │   ├── wood_normal.jpg
           │   └── wood_roughness.jpg
           └── brick/
               ├── brick_color.jpg
               ├── brick_normal.jpg
               └── brick_displacement.jpg
   ```
4. **Load via `TextureLoader` in JavaScript:**
   ```javascript
   const colorTex = textureLoader.load("/textures/wood/wood_color.jpg");
   colorTex.colorSpace = THREE.SRGBColorSpace;
   ```

---

## ✅ Learning Checklist

- [x] `THREE.TextureLoader` and `THREE.LoadingManager`
- [x] UV Coordinates and 0 $\to$ 1 UV normalization
- [x] Base Color / Diffuse (`material.map`)
- [x] Normal Mapping (`material.normalMap`, `normalScale`)
- [x] Roughness Mapping (`material.roughnessMap`)
- [x] Metalness Mapping (`material.metalnessMap`)
- [x] Ambient Occlusion (`material.aoMap`, `geometry.attributes.uv2`)
- [x] Displacement Mapping (`material.displacementMap`, vertex density)
- [x] Repeat (`texture.repeat.set(x, y)`) & Wrapping modes
- [x] Offset (`texture.offset.set(x, y)`) & Rotation (`texture.rotation`)
- [x] Texture Filtering (`LinearFilter`, `NearestFilter`) & Mipmaps
- [x] Correct Color Space management (`SRGBColorSpace` vs Linear)
- [x] Full PBR workflow layer toggles
- [x] Texture Reuse & Memory Disposal (`texture.dispose()`)
- [x] Texture Atlas sub-UV layout
- [x] GPU VRAM vs Download Size trade-offs

---

## 🎯 10 Practice Tasks to Master Three.js Textures

1. **Conveyor Belt Animation:** Animate `floorMaterial.map.offset.y += 0.01` in the render loop to create a continuous conveyor belt or rushing river effect.
2. **Normal Map Inversion:** Toggle `material.normalScale.set(1, -1)` to see how flipping the Y green channel changes bumps to indents (DirectX vs OpenGL normal formats).
3. **Retro Pixel Art Style:** Set `texture.magFilter = THREE.NearestFilter` and `texture.minFilter = THREE.NearestFilter` on a low-resolution $64\times64$ sprite for a crisp retro look.
4. **Video Texture:** Replace a static map on the screen with `new THREE.VideoTexture(videoElement)` to create a live playing 3D billboard.
5. **Interactive Canvas Texture:** Draw dynamic paint strokes onto a 2D canvas with mouse events, then set `canvasTexture.needsUpdate = true` to create an interactive 3D whiteboard.
6. **Alpha / Opacity Map:** Apply a black-and-white mask texture to `material.alphaMap` with `transparent: true` to create a wire mesh or leaf cutout.
7. **Roughness Puddle Shader:** Dynamically blend a puddle texture into `roughnessMap` so areas of the floor look wet and mirror-like.
8. **Subdivision Comparison:** Create two brick planes side-by-side (one with 1 segment, one with 128 segments) to visually demonstrate why displacement fails on low-poly meshes.
9. **Environment Map & PBR:** Add an HDR environment map (`scene.environment`) and observe how metallic and rough surfaces reflect the environment.
10. **Memory Leak Test:** Create and destroy 50 textured meshes in a loop, verify with `renderer.info.memory.textures` that memory clears when calling `.dispose()`.

---

## 💼 10 Technical Interview Questions & Answers

#### Q1: Why must color textures use `SRGBColorSpace` while normal and roughness maps use Linear (`NoColorSpace`)?
**Answer:** Color textures store visual RGB values that were gamma-encoded for human display. Three.js must convert them to Linear space for correct PBR math. Normal, roughness, metalness, and displacement maps contain mathematical vector/scalar data, not color; applying gamma correction to data maps corrupts their values.

#### Q2: What is the difference between a Normal Map and a Displacement Map?
**Answer:** A **Normal Map** alters surface lighting normals per pixel during the fragment shader stage to simulate bumps without changing actual polygon geometry. A **Displacement Map** physically moves vertices in the vertex shader, creating true 3D silhouette silhouettes and cast shadows, but requires high geometry polygon density.

#### Q3: Why does `material.aoMap` require a secondary UV attribute (`uv2`) in Three.js?
**Answer:** Ambient Occlusion is often baked across an entire model without tiling, whereas base color textures may tile repeatedly. Three.js uses `uv` (channel 0) for repeating diffuse/normal maps and `uv2` (channel 1) for the un-tiled ambient occlusion map.

#### Q4: What is the purpose of Mipmaps and what is their VRAM penalty?
**Answer:** Mipmaps are pre-filtered, downsampled copies of a texture (e.g., $1024 \to 512 \to 256 \dots$). When an object is far away, the GPU samples smaller mipmaps to eliminate shimmering/aliasing and improve cache efficiency. Mipmaps increase GPU VRAM usage by exactly **33.3%**.

#### Q5: What is the difference between image download file size and GPU VRAM memory usage?
**Answer:** A JPG file might only be 200 KB on disk due to lossy file compression. However, when loaded into WebGL VRAM, it is uncompressed into raw uncompressed RGBA pixel buffers: $\text{Width} \times \text{Height} \times 4 \text{ bytes}$. A $2048 \times 2048$ texture consumes **16 MB of VRAM** regardless of whether the JPG was 200 KB or 2 MB.

#### Q6: How do GPU-compressed texture formats like KTX2 / Basis Universal solve the VRAM issue?
**Answer:** KTX2 textures remain compressed inside GPU VRAM (using formats like BC7, ASTC, or ETC2) without ever being unpacked into raw RGBA buffers, reducing VRAM footprint and memory bandwidth by up to **75%**.

#### Q7: What causes "Texture Bleeding" in Texture Atlases and how is it prevented?
**Answer:** Texture bleeding occurs when bilinear filtering or mipmapping blends pixels across the borders of adjacent sub-textures in an atlas. It is prevented by adding padding (gutter margins) of 4–8 pixels between sub-textures.

#### Q8: When would you choose `THREE.NearestFilter` over `THREE.LinearFilter`?
**Answer:** `NearestFilter` is chosen for pixel art aesthetics, sharp data lookup textures, voxel games (Minecraft style), or QR codes where smooth interpolation causes unwanted blurring.

#### Q9: What does `texture.needsUpdate = true` do and when is it required?
**Answer:** WebGL uploads texture buffers to GPU VRAM once. If you modify a canvas texture, change wrap modes, swap pixel buffers, or change image sources, setting `needsUpdate = true` signals Three.js to re-upload the texture to the GPU on the next render pass.

#### Q10: How do you properly free texture memory in a Single Page Application (SPA)?
**Answer:** Remove the mesh from the scene, then explicitly call `material.map.dispose()`, `material.dispose()`, and `geometry.dispose()`. Simply setting the JS variable to `null` leaves the texture allocated in GPU memory.

---

## 🌐 Production Architecture Mapping

In enterprise 3D web applications (such as Apple product configurators, Shopify 3D viewers, or architectural visualization platforms):

1. **Assets Pipeline:** 3D models are exported as compressed `.glb` / `.gltf` with embedded KTX2 or WebP textures.
2. **Central Asset Manager:** Assets are requested through `THREE.LoadingManager` with progressive percentage bars.
3. **PBR Standard:** Materials use `MeshStandardMaterial` or `MeshPhysicalMaterial` driven by environment maps (`scene.environment = PMREMGenerator.fromEquirectangular(hdr)`).
4. **Responsive Detail (LOD):** Far-away objects use $512\times512$ textures; close-up hero products dynamically load $2048\times2048$ maps.
5. **Garbage Collection:** Route changes trigger recursive scene traversal calling `dispose()` on all geometries, textures, and materials.
