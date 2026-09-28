#include ./noise.glsl

uniform float uTime;
uniform vec3 uColorRoot;    // Oxygen-rich combustion base (deep sapphire blue)
uniform vec3 uColorInner;   // White-hot incandescent plasma core
uniform vec3 uColorOuter;   // Rich warm amber / tangerine mantle
uniform vec3 uColorTip;     // Flickering crimson-orange crest
uniform float uGlowIntensity;
uniform float uDissolveProgress; // 0.0 (fully burning) to 1.0 (fully dissolved)
uniform float uExtinguish;       // 0.0 to 1.0
uniform float uFlickerSpeed;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPos;
varying float vNoiseDisplacement;

void main() {
    // -----------------------------------------------------------------
    // 1. PROCEDURAL MASKING: TEARDROP FLAME SHAPE & ZONES
    // -----------------------------------------------------------------
    // Normalize coordinates so center axis is 0.0
    float radialDist = abs(vUv.x - 0.5) * 2.0;

    // Teardrop silhouette envelope: wider in lower-middle, tapering to fine point at tip
    float widthEnvelope = (1.0 - pow(vUv.y, 1.4)) * (0.85 + 0.15 * sin(vUv.y * 3.14159));
    widthEnvelope = max(widthEnvelope, 0.001);

    // Lateral profile mask
    float shapeMask = smoothstep(widthEnvelope, widthEnvelope * 0.45, radialDist);

    // Root cut-off & smooth base anchoring
    float baseMask = smoothstep(0.0, 0.06, vUv.y);

    // -----------------------------------------------------------------
    // 2. PROCEDURAL NOISE & TURBULENT UPWARD FLOW
    // -----------------------------------------------------------------
    vec2 flowUv1 = vec2(vUv.x * 3.0, vUv.y * 2.2 - uTime * (uFlickerSpeed * 2.5));
    vec2 flowUv2 = vec2(vUv.x * 5.0 + 1.7, vUv.y * 3.5 - uTime * (uFlickerSpeed * 3.8));
    float noise1 = fbm2D(flowUv1);
    float noise2 = snoise2D(flowUv2);
    float combinedNoise = noise1 * 0.65 + noise2 * 0.35;

    // -----------------------------------------------------------------
    // 3. DISSOLVE EFFECT: NOISE-DRIVEN COMBUSTION EROSION AT TIP & OVERALL
    // -----------------------------------------------------------------
    // Natural flame combustion erosion near the crest:
    // As flame ascends (vUv.y -> 1.0), noise progressively cuts into alpha
    float naturalErosion = pow(vUv.y, 1.8) * 1.3 - (combinedNoise * 0.45);
    float flameLife = smoothstep(1.0, 0.65, naturalErosion);

    // Overall interactive dissolve technique (e.g. dissolving flame or extinguishing):
    float dissolveNoise = fbm3D(vWorldPos * 3.0 + vec3(0.0, -uTime * 2.0, 0.0));
    float dissolveFactor = dissolveNoise * 0.5 + 0.5;
    float dissolveThreshold = uDissolveProgress * 1.2;
    
    // Dissolve edge glow: bright fiery edge where dissolve is taking place
    float dissolveDelta = dissolveFactor - dissolveThreshold;
    if (uDissolveProgress > 0.01 && dissolveDelta < 0.0) {
        discard;
    }
    float dissolveEdgeGlow = smoothstep(0.18, 0.0, dissolveDelta) * step(0.005, uDissolveProgress);

    // -----------------------------------------------------------------
    // 4. FRESNEL & CORE GLOW
    // -----------------------------------------------------------------
    vec3 viewDir = normalize(-vPosition);
    vec3 normalDir = normalize(vNormal);

    // View alignment: front-facing areas contain the white-hot core
    float viewFacing = max(dot(normalDir, viewDir), 0.0);
    // Rim Fresnel highlight
    float fresnel = pow(1.0 - viewFacing, 2.2);

    // Intense inner core mask (concentrated near wick center)
    float coreLateral = smoothstep(0.35 * widthEnvelope, 0.0, radialDist);
    float coreVertical = smoothstep(0.05, 0.25, vUv.y) * smoothstep(0.75, 0.35, vUv.y);
    float coreIntensity = coreLateral * coreVertical * (0.8 + 0.2 * viewFacing);

    // Blue combustion zone at the root (oxygen-rich lower mantle)
    float blueMask = smoothstep(0.32, 0.02, vUv.y) * smoothstep(widthEnvelope, 0.0, radialDist * 0.85);

    // -----------------------------------------------------------------
    // 5. COLOR BLENDING & MULTI-LAYER RADIANCE
    // -----------------------------------------------------------------
    // Base mantle gradient (amber to tip crimson)
    vec3 flameCol = mix(uColorOuter, uColorTip, pow(vUv.y, 1.2));

    // Blend in the incandescent white-hot core
    flameCol = mix(flameCol, uColorInner, coreIntensity * 0.95);

    // Blend in the deep sapphire blue root
    flameCol = mix(flameCol, uColorRoot, blueMask * 0.9);

    // Add rim Fresnel glow
    flameCol += uColorOuter * fresnel * 0.5;

    // Add bright edge highlight when interactive dissolve is active
    flameCol += vec3(1.0, 0.7, 0.3) * dissolveEdgeGlow * 3.0;

    // Boost emissive glow for post-processing / bloom
    flameCol *= uGlowIntensity;

    // -----------------------------------------------------------------
    // 6. FINAL ALPHA COMPOSITING
    // -----------------------------------------------------------------
    float alpha = shapeMask * baseMask * flameLife;
    alpha = clamp(alpha, 0.0, 1.0);

    // Dim and fade alpha when extinguishing
    float extFactor = 1.0 - smoothstep(0.0, 1.0, uExtinguish);
    alpha *= extFactor;

    // Discard nearly invisible fragments for crisp depth sorting
    if (alpha < 0.02) discard;

    gl_FragColor = vec4(flameCol, alpha);
}
