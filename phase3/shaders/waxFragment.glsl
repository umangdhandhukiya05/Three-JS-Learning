#include ./noise.glsl

uniform float uTime;
uniform vec3 uWaxColor;              // Ivory / beeswax base tone
uniform vec3 uSubsurfaceColor;       // Warm internal glow
uniform vec3 uFlamePosition;         // World position of flame
uniform float uFlameFlicker;         // Realtime flicker multiplier (0.8 ~ 1.2)
uniform float uFresnelPower;         // Translucent rim exponent
uniform float uSubsurfaceStrength;   // Internal light transmission
uniform float uCandleTopY;           // Top height of candle in local space
uniform float uCandleHeight;         // Height of candle
uniform float uExtinguish;           // 0.0 to 1.0

// Dissolve Uniforms
uniform float uDissolveProgress;     // 0.0 (intact) to 1.0 (fully dissolved)
uniform vec3 uDissolveEdgeColor;     // Glowing molten edge color
uniform float uDissolveEdgeWidth;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying float vTopPoolMask;
varying float vDripFactor;

void main() {
    // -------------------------------------------------------------
    // 1. DISSOLVE EFFECT: NOISE-BASED MELT / BURNING EROSION
    // -------------------------------------------------------------
    float dissolveNoise = fbm3D(vWorldPos * 2.2 + vec3(0.0, uTime * 0.1, 0.0));
    // Dissolve prioritizes from the top downwards organically
    float heightBias = (vLocalPos.y / uCandleHeight) * 0.5;
    float dissolveVal = dissolveNoise * 0.5 + 0.5 - heightBias * 0.3;
    float dissolveThreshold = uDissolveProgress * 1.3;

    if (uDissolveProgress > 0.001) {
        if (dissolveVal < dissolveThreshold) {
            discard;
        }
    }
    // Fiery glowing molten edge where wax is dissolving
    float edgeDist = dissolveVal - dissolveThreshold;
    float dissolveEdgeGlow = smoothstep(uDissolveEdgeWidth, 0.0, edgeDist) * step(0.005, uDissolveProgress);

    // -------------------------------------------------------------
    // 2. VECTORS & LIGHTING SETUP
    // -------------------------------------------------------------
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);

    vec3 lightVec = uFlamePosition - vWorldPos;
    float lightDist = length(lightVec);
    vec3 L = normalize(lightVec);

    // Quadratic attenuation from flame light
    float lightAtten = 1.0 / (1.0 + lightDist * lightDist * 0.9);
    float flicker = mix(uFlameFlicker, 0.0, uExtinguish);

    // Directional ambient fill for subtle environment shading
    vec3 ambLightDir = normalize(vec3(0.5, 1.0, 0.8));
    float ambDiffuse = max(dot(N, ambLightDir), 0.0) * 0.25 + 0.12;

    // Diffuse light from candle flame
    float flameDiffuse = max(dot(N, L), 0.0) * lightAtten * flicker * 1.5;

    // -------------------------------------------------------------
    // 3. FRESNEL & SUBSURFACE SCATTERING (Wax Translucency)
    // -------------------------------------------------------------
    // Fresnel rim effect (translucent rim glow around the wax silhouette)
    float NdotV = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = pow(1.0 - NdotV, uFresnelPower);

    // Subsurface light wrap: light penetrating through the wax body towards the viewer
    float forwardScatter = pow(clamp(dot(-V, L) + 0.35, 0.0, 1.0), 3.0);

    // Light depth penetration near top rim (paraffin wax glows from top down)
    float depthBelowTop = max(0.0, uCandleTopY - vLocalPos.y);
    float internalPenetration = exp(-depthBelowTop * 1.8) * lightAtten * flicker;

    // Combine subsurface transmission
    vec3 sssTotal = uSubsurfaceColor * (
        internalPenetration * 2.2 +
        forwardScatter * lightAtten * flicker * 0.9 +
        fresnel * internalPenetration * 1.5
    ) * uSubsurfaceStrength;

    // -------------------------------------------------------------
    // 4. PROCEDURAL MASKING: TOP MELT POOL & DRIP DETAILS
    // -------------------------------------------------------------
    // Molten liquid pool on top has high specularity and wet gloss
    vec3 H = normalize(L + V);
    float specPower = mix(18.0, 90.0, vTopPoolMask);
    float specIntensity = pow(max(dot(N, H), 0.0), specPower) * lightAtten * flicker;
    vec3 specularColor = vec3(1.0, 0.9, 0.7) * specIntensity * mix(0.3, 1.2, vTopPoolMask);

    // Molten pool darkening & warm amber transmission
    vec3 baseSurfaceCol = uWaxColor;
    if (vTopPoolMask > 0.01) {
        // Wet liquid ripple perturbation
        float ripples = sin(length(vLocalPos.xz) * 35.0 - uTime * 4.0) * 0.03 * flicker;
        baseSurfaceCol = mix(baseSurfaceCol, uWaxColor * 0.85 + uSubsurfaceColor * 0.25, vTopPoolMask);
        specularColor += vec3(ripples);
    }

    // Wax drip edge enhancement (slight ambient occlusion underneath drip)
    baseSurfaceCol *= (1.0 - vDripFactor * 0.12);

    // -------------------------------------------------------------
    // 5. COLOR COMPOSITING
    // -------------------------------------------------------------
    // Ambient + Flame Diffuse
    vec3 litWax = baseSurfaceCol * (ambDiffuse + flameDiffuse * vec3(1.0, 0.85, 0.6));

    // Add subsurface internal scattering
    litWax += sssTotal;

    // Add specular gleam
    litWax += specularColor;

    // Add soft Fresnel edge tint
    litWax += uSubsurfaceColor * fresnel * 0.3 * (0.5 + 0.5 * flicker);

    // Add glowing dissolve edge if dissolving
    vec3 fieryEdge = uDissolveEdgeColor * 4.5 * dissolveEdgeGlow;
    litWax += fieryEdge;

    gl_FragColor = vec4(litWax, 1.0);
}
