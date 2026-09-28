#include ./noise.glsl

uniform float uTime;
uniform float uSmokeSpeed;
uniform float uSmokeDensity;
uniform float uExtinguish;
uniform vec3 uSmokeColor;

varying vec2 vUv;
varying vec3 vWorldPos;
varying float vHeight;

void main() {
    // 3D noise sample moving upward with convection
    vec3 coord = vec3(
        vWorldPos.x * 2.5,
        vWorldPos.y * 2.0 - uTime * uSmokeSpeed,
        vWorldPos.z * 2.5
    );

    float n1 = fbm3D(coord);
    float n2 = snoise3D(coord * 2.0 + 10.0) * 0.5;
    float smokeNoise = n1 * 0.7 + n2 * 0.3;

    // Lateral profile mask: cylindrical fade from center
    float lateralDist = abs(vUv.x - 0.5) * 2.0;
    float lateralMask = smoothstep(1.0, 0.2, lateralDist);

    // Vertical fade: base starts near flame tip, top dissolves into air
    float baseFade = smoothstep(0.0, 0.15, vHeight);
    float topDissolve = smoothstep(1.0, 0.3, vHeight);

    // Procedural Dissolve: Noise progressively eats away at smoke wisps at the top
    float dissolveMask = smoothstep(0.25, 0.75, smokeNoise + (1.0 - vHeight) * 0.4);

    // Overall alpha
    float density = mix(uSmokeDensity, uSmokeDensity * 2.5, uExtinguish);
    float alpha = lateralMask * baseFade * topDissolve * dissolveMask * density;

    alpha = clamp(alpha, 0.0, 0.85);
    if (alpha < 0.01) discard;

    // Smoke color: subtle gradient from warm base to cool ambient dissipation
    vec3 col = mix(uSmokeColor * 1.1, uSmokeColor * 0.8, vHeight);

    gl_FragColor = vec4(col, alpha);
}
