#include ./noise.glsl

uniform float uTime;
uniform float uFlickerSpeed;
uniform float uFlickerStrength;
uniform vec3 uWind;
uniform float uExtinguish;
uniform float uFlameScale;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPos;
varying float vNoiseDisplacement;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;

    // Scale flame
    pos *= uFlameScale;

    // Height gradient (0 at wick base, 1 at flame tip)
    float h = clamp(uv.y, 0.0, 1.0);
    float hFactor = pow(h, 1.7); // Displace tip more than base

    // Multi-octave 3D simplex noise for organic flame flutter
    vec3 noiseCoord = vec3(
        pos.x * 2.2 + uWind.x * 0.4,
        pos.y * 1.8 - uTime * (uFlickerSpeed * 2.8),
        pos.z * 2.2 + uWind.z * 0.4
    );

    float n1 = snoise3D(noiseCoord);
    float n2 = snoise3D(noiseCoord * 2.1 + vec3(12.3, 45.6, 78.9)) * 0.5;
    float turbulence = (n1 + n2) * uFlickerStrength * hFactor;
    vNoiseDisplacement = turbulence;

    // Displace vertices organically
    pos.x += turbulence * 0.35;
    pos.z += snoise3D(noiseCoord + vec3(33.0, 11.0, 55.0)) * uFlickerStrength * hFactor * 0.35;

    // Wind displacement proportional to height
    pos += uWind * hFactor * 0.65;

    // Natural flame stretch and pulse
    float pulse = sin(uTime * 14.0) * 0.03 * uFlickerStrength;
    pos.y *= (1.0 + pulse * hFactor);

    // If extinguishing, shrink and flatten flame downward
    float extScale = 1.0 - smoothstep(0.0, 1.0, uExtinguish);
    pos.xyz *= extScale;

    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
