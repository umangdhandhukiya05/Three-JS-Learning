#include ./noise.glsl

uniform int uMode; // 0: Waves, 1: Smoke, 2: Terrain, 3: Liquid
uniform float uTime;

// Mode specific params
uniform float uWaveSpeed;
uniform float uWaveFrequency;
uniform float uWaveElevation;

uniform float uSmokeSpeed;
uniform float uSmokeTurbulence;

uniform float uTerrainHeight;
uniform float uTerrainFrequency;

uniform float uLiquidWobble;
uniform float uLiquidSpeed;

// Mouse interaction uniforms
uniform vec2 uMouse;
uniform float uMouseHover;
uniform float uMouseRadius;
uniform float uMouseStrength;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vElevation;
varying float vMouseDist;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;
    float elevation = 0.0;
    float dist = distance(uv, uMouse);
    vMouseDist = dist;

    // Mouse falloff & interactive ripples
    float mouseFalloff = smoothstep(uMouseRadius, 0.0, dist) * uMouseHover;
    float mouseRipple = sin(dist * 35.0 - uTime * 8.0) * mouseFalloff * uMouseStrength;

    if (uMode == 0) {
        // --- 0: WAVES ---
        float waveX = sin(pos.x * uWaveFrequency + uTime * uWaveSpeed);
        float waveY = cos(pos.y * (uWaveFrequency * 0.8) + uTime * (uWaveSpeed * 0.7));
        float micro = snoise2D(pos.xy * 2.5 + uTime * 1.5) * 0.25;
        elevation = (waveX + waveY + micro) * uWaveElevation + mouseRipple;
        pos.z += elevation;
    }
    else if (uMode == 1) {
        // --- 1: SMOKE ---
        // Wispy upward drifting billows
        vec2 smokeCoord = vec2(pos.x * 1.5, pos.y * 1.2 - uTime * uSmokeSpeed);
        float turbulence = fbm2D(smokeCoord) * uSmokeTurbulence;
        pos.x += turbulence * 0.35 + mouseRipple * 0.5;
        pos.z += sin(pos.y * 2.0 + uTime * 2.0) * 0.15;
        elevation = turbulence;
    }
    else if (uMode == 2) {
        // --- 2: TERRAIN ---
        // Procedural multi-octave mountain landscape with sharp ridges
        vec2 terrainCoord = pos.xy * uTerrainFrequency;
        float baseFbm = fbm2D(terrainCoord);
        float peaks = 1.0 - abs(snoise2D(terrainCoord * 2.0));
        elevation = (baseFbm * 0.7 + peaks * 0.3) * uTerrainHeight;
        // Mouse creates an interactive uplift/crater
        elevation += mouseFalloff * uMouseStrength * 1.5;
        pos.z += elevation;
    }
    else if (uMode == 3) {
        // --- 3: LIQUID ---
        // 3D organic noise displacement along normal
        vec3 noiseCoord = normal * 2.0 + vec3(0.0, 0.0, uTime * uLiquidSpeed);
        float wobble = snoise3D(noiseCoord) * uLiquidWobble;
        float pull = mouseFalloff * uMouseStrength * 0.5;
        pos += normal * (wobble + pull);
        elevation = wobble;
    }

    vElevation = elevation;
    vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
