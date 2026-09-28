#include ./noise.glsl

uniform int uMode; // 0: Waves, 1: Smoke, 2: Terrain, 3: Liquid
uniform float uTime;
uniform float uColorCycleSpeed;

// Mode specific params
uniform float uSmokeDensity;
uniform float uStripeFrequency;
uniform float uRippleFrequency;

// Palette Colors
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uColorInteractive;

// Mouse uniforms
uniform vec2 uMouse;
uniform float uMouseHover;
uniform float uMouseRadius;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vElevation;
varying float vMouseDist;

void main() {
    // Dynamic color shift over time
    vec3 colorShift = vec3(
        sin(uTime * uColorCycleSpeed) * 0.1,
        cos(uTime * uColorCycleSpeed * 0.8) * 0.1,
        sin(uTime * uColorCycleSpeed * 1.2) * 0.1
    );
    vec3 colA = clamp(uColorA + colorShift, 0.0, 1.0);
    vec3 colB = clamp(uColorB + vec3(colorShift.y, colorShift.z, colorShift.x), 0.0, 1.0);

    // Mouse interactive aura & localized ripples
    float mouseGlow = smoothstep(uMouseRadius, 0.0, vMouseDist) * uMouseHover;
    float interactiveRipples = sin(vMouseDist * 35.0 - uTime * 8.0) * 0.5 + 0.5;
    float interactionFactor = mouseGlow * (0.6 + interactiveRipples * 0.4);

    vec4 finalColor = vec4(1.0);

    if (uMode == 0) {
        // --- 0: WAVES ---
        float h = clamp(vElevation * 2.5 + 0.5, 0.0, 1.0);
        vec3 oceanCol = mix(colA, colB, h);

        // White foam on wave crests
        float foam = smoothstep(0.22, 0.38, vElevation);
        oceanCol = mix(oceanCol, vec3(1.0), foam * 0.85);

        // Subtle water caustics pattern
        float caustics = sin((vUv.x + vUv.y) * uStripeFrequency + uTime * 2.0) * 0.5 + 0.5;
        oceanCol = mix(oceanCol, uColorC, caustics * 0.3);

        // Interactive mouse glow
        oceanCol = mix(oceanCol, uColorInteractive, interactionFactor);
        finalColor = vec4(oceanCol, 1.0);
    }
    else if (uMode == 1) {
        // --- 1: SMOKE ---
        vec2 smokeCoord = vec2(vUv.x * 2.0, vUv.y * 1.5 - uTime * 0.5);
        float density = fbm2D(smokeCoord) * 0.5 + 0.5;

        // Soft border vignette for wispy edges
        float edgeAlpha = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x)
                        * smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.8, vUv.y);

        vec3 smokeColor = mix(colA, colB, density);
        smokeColor = mix(smokeColor, uColorInteractive, interactionFactor);
        float alpha = clamp(density * edgeAlpha * uSmokeDensity, 0.0, 1.0);
        finalColor = vec4(smokeColor, alpha);
    }
    else if (uMode == 2) {
        // --- 2: TERRAIN ---
        // Biome altitude bands:
        // Deep lake / canyon (< 0.25) -> Valley grass (< 0.65) -> Mountain rock (< 0.85) -> Snow peak (> 0.85)
        float h = clamp(vElevation * 1.2 + 0.35, 0.0, 1.0);
        vec3 terrainColor;
        vec3 waterCol = colA;                         // Deep valley water
        vec3 grassCol = vec3(0.14, 0.54, 0.26);        // Midland grass/forest
        vec3 rockCol  = vec3(0.44, 0.46, 0.50);        // Stone cliffs
        vec3 snowCol  = vec3(0.96, 0.98, 1.00);        // Snowy peaks

        if (h < 0.25) {
            terrainColor = mix(waterCol, grassCol, h / 0.25);
        } else if (h < 0.65) {
            terrainColor = mix(grassCol, rockCol, (h - 0.25) / 0.4);
        } else {
            terrainColor = mix(rockCol, snowCol, (h - 0.65) / 0.35);
        }

        terrainColor = mix(terrainColor, uColorInteractive, interactionFactor * 0.8);
        finalColor = vec4(terrainColor, 1.0);
    }
    else if (uMode == 3) {
        // --- 3: LIQUID ---
        // Fresnel rim reflection on spherical liquid droplet
        vec3 viewDir = normalize(-vPosition);
        float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.8);

        // Dynamic iridescent surface tension
        float iridescence = sin(vElevation * 25.0 + uTime * 2.5) * 0.5 + 0.5;
        vec3 liquidColor = mix(colA, colB, fresnel);
        liquidColor = mix(liquidColor, uColorC, iridescence * 0.4);
        liquidColor += vec3(fresnel * 0.55); // Specular gleam

        liquidColor = mix(liquidColor, uColorInteractive, interactionFactor);
        finalColor = vec4(liquidColor, 1.0);
    }

    gl_FragColor = finalColor;
}
